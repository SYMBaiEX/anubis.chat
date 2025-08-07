/**
 * Convex Functions for Agentic AI System
 * Complete CRUD operations for agents, executions, and steps
 * Includes Solana blockchain-specific agent capabilities
 */

import { v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import { mutation, query } from './_generated/server';

// =============================================================================
// Agent Management
// =============================================================================

// Get agent by ID
export const getById = query({
  args: { id: v.id('agents') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get a specific agent by ID (alias for compatibility)
export const get = query({
  args: { id: v.id('agents') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// List all available agents for a user
// Includes both public agents and user's custom agents
export const list = query({
  args: { 
    includePublic: v.optional(v.boolean()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const agents = [];

    // Get public agents
    if (args.includePublic !== false) {
      const publicAgents = await ctx.db
        .query('agents')
        .withIndex('by_public', q => q.eq('isPublic', true).eq('isActive', true))
        .collect();
      agents.push(...publicAgents);
    }

    // Get user's custom agents
    if (args.userId) {
      const customAgents = await ctx.db
        .query('agents')
        .withIndex('by_creator', q => q.eq('createdBy', args.userId))
        .filter(q => q.eq(q.field('isActive'), true))
        .collect();
      agents.push(...customAgents);
    }

    return agents.sort((a, b) => {
      // Sort by: public agents first, then by creation date
      if (a.isPublic && !b.isPublic) return -1;
      if (!a.isPublic && b.isPublic) return 1;
      return b.createdAt - a.createdAt;
    });
  },
});

// Get agents by owner (for upstream compatibility)
export const getByOwner = query({
  args: {
    walletAddress: v.string(),
    limit: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);

    let query = ctx.db
      .query('agents')
      .withIndex('by_creator', (q) => q.eq('createdBy', args.walletAddress));

    if (args.isActive !== undefined) {
      query = query.filter((q) => q.eq(q.field('isActive'), args.isActive));
    }

    return await query.order('desc').take(limit);
  },
});

// Create new agent
export const create = mutation({
  args: {
    name: v.string(),
    type: v.union(
      v.literal('general'),
      v.literal('trading'),
      v.literal('defi'),
      v.literal('nft'),
      v.literal('dao'),
      v.literal('portfolio'),
      v.literal('custom')
    ),
    description: v.string(),
    systemPrompt: v.string(),
    capabilities: v.array(v.string()),
    model: v.string(),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
    config: v.optional(v.object({
      rpcUrl: v.optional(v.string()),
      priorityFee: v.optional(v.number()),
      slippage: v.optional(v.number()),
      gasBudget: v.optional(v.number()),
    })),
    isPublic: v.optional(v.boolean()),
    createdBy: v.string(), // walletAddress
    tools: v.optional(v.array(v.string())), // For upstream compatibility
    maxSteps: v.optional(v.number()), // For upstream compatibility
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const agentId = await ctx.db.insert('agents', {
      name: args.name,
      type: args.type,
      description: args.description,
      systemPrompt: args.systemPrompt,
      capabilities: args.capabilities,
      model: args.model,
      temperature: args.temperature ?? 0.7,
      maxTokens: args.maxTokens,
      config: args.config,
      isActive: true,
      isPublic: args.isPublic ?? false,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(agentId);
  },
});

// Update agent
export const update = mutation({
  args: {
    id: v.id('agents'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    systemPrompt: v.optional(v.string()),
    capabilities: v.optional(v.array(v.string())),
    model: v.optional(v.string()),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
    config: v.optional(v.object({
      rpcUrl: v.optional(v.string()),
      priorityFee: v.optional(v.number()),
      slippage: v.optional(v.number()),
      gasBudget: v.optional(v.number()),
    })),
    isActive: v.optional(v.boolean()),
    walletAddress: v.optional(v.string()), // For permission check
    tools: v.optional(v.array(v.string())), // For upstream compatibility
    maxSteps: v.optional(v.number()), // For upstream compatibility
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.id);
    
    if (!agent) {
      throw new Error('Agent not found');
    }

    // Check permissions if walletAddress provided
    if (args.walletAddress && agent.createdBy !== args.walletAddress) {
      throw new Error('Access denied');
    }

    const { id, walletAddress, ...updates } = args;
    
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(id);
  },
});

// Delete agent
export const remove = mutation({
  args: { 
    id: v.id('agents'),
    userId: v.string(), // walletAddress - only allow user to delete their own custom agents
    walletAddress: v.optional(v.string()), // Alias for upstream compatibility
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.id);
    
    if (!agent) {
      throw new Error('Agent not found');
    }

    const userWallet = args.userId || args.walletAddress;

    // Only allow deleting custom agents created by the user
    if (agent.isPublic || agent.createdBy !== userWallet) {
      throw new Error('Cannot delete this agent');
    }

    // Check if agent has active executions (from upstream)
    const activeExecutions = await ctx.db
      .query('agentExecutions')
      .withIndex('by_agent', (q) => q.eq('agentId', args.id))
      .filter((q) =>
        q.or(
          q.eq(q.field('status'), 'pending'),
          q.eq(q.field('status'), 'running'),
          q.eq(q.field('status'), 'waiting_approval')
        )
      )
      .collect();

    if (activeExecutions.length > 0) {
      throw new Error('Cannot delete agent with active executions');
    }

    await ctx.db.patch(args.id, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return { success: true, agentId: args.id };
  },
});

// Initialize default public agents (run once)
export const initializeDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Check if agents already exist
    const existingAgents = await ctx.db
      .query('agents')
      .withIndex('by_public', q => q.eq('isPublic', true))
      .take(1);

    if (existingAgents.length > 0) {
      return 'Default agents already exist';
    }

    // Create default public agents
    const defaultAgents = [
      {
        name: 'ISIS General Assistant',
        type: 'general' as const,
        description: 'General-purpose AI assistant with comprehensive Solana blockchain capabilities',
        systemPrompt: 'You are ISIS, a helpful AI assistant with access to Solana blockchain operations. You can help users with trading, DeFi, NFTs, and general blockchain interactions. Always be helpful, accurate, and secure in your responses.',
        capabilities: ['chat', 'getBalance', 'transfer', 'deployToken', 'swapTokens', 'getTokenPrice'],
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 4000,
      },
      {
        name: 'Trading Specialist',
        type: 'trading' as const,
        description: 'Specialized in token trading, swaps, and market analysis on Solana',
        systemPrompt: 'You are a specialized trading agent for Solana. You excel at token analysis, executing swaps, monitoring prices, and providing market insights. Always consider risk management and help users make informed trading decisions.',
        capabilities: ['swapTokens', 'getTokenPrice', 'getTrendingTokens', 'getMarketData', 'analyzeToken'],
        model: 'gpt-4',
        temperature: 0.3,
        maxTokens: 3000,
      },
      {
        name: 'DeFi Expert',
        type: 'defi' as const,
        description: 'Expert in DeFi protocols, lending, staking, and yield farming',
        systemPrompt: 'You are a DeFi specialist focused on Solana protocols. You can help with lending, borrowing, staking, liquidity provision, and yield farming. Always explain risks and help users understand protocol mechanics.',
        capabilities: ['lendAssets', 'stake', 'restake', 'provideLiquidity', 'getDeFiPositions'],
        model: 'gpt-4',
        temperature: 0.5,
        maxTokens: 3500,
      },
      {
        name: 'NFT Creator',
        type: 'nft' as const,
        description: 'Handles NFT creation, trading, and marketplace operations',
        systemPrompt: 'You are an NFT specialist for Solana. You can help with creating NFT collections, minting NFTs, trading on marketplaces, and managing NFT portfolios. Always consider authenticity and market dynamics.',
        capabilities: ['deployCollection', 'mintNFT', 'getNFTsByOwner', 'listNFT', 'buyNFT'],
        model: 'gpt-4',
        temperature: 0.6,
        maxTokens: 3000,
      },
      {
        name: 'DAO Governance Agent',
        type: 'dao' as const,
        description: 'Manages DAO governance, voting, and proposal creation',
        systemPrompt: 'You are a DAO governance specialist. You help users participate in decentralized governance, create proposals, vote on initiatives, and understand governance mechanisms. Always promote democratic participation.',
        capabilities: ['createProposal', 'vote', 'getDaoInfo', 'getProposals', 'delegateVote'],
        model: 'gpt-4',
        temperature: 0.4,
        maxTokens: 3000,
      },
      {
        name: 'Portfolio Tracker',
        type: 'portfolio' as const,
        description: 'Tracks portfolio performance and provides analytics',
        systemPrompt: 'You are a portfolio management specialist. You help users track their Solana assets, analyze performance, understand market exposure, and make portfolio optimization decisions. Focus on data-driven insights.',
        capabilities: ['getBalance', 'getTokenBalances', 'getPortfolioValue', 'analyzePerformance', 'getAssetAllocation'],
        model: 'gpt-4',
        temperature: 0.3,
        maxTokens: 3500,
      },
    ];

    const agentIds = [];
    for (const agent of defaultAgents) {
      const agentId = await ctx.db.insert('agents', {
        ...agent,
        isActive: true,
        isPublic: true,
        createdAt: now,
        updatedAt: now,
      });
      agentIds.push(agentId);
    }

    return `Created ${agentIds.length} default agents`;
  },
});

// =============================================================================
// Agent Executions (from upstream)
// =============================================================================

// Create agent execution
export const createExecution = mutation({
  args: {
    agentId: v.id('agents'),
    walletAddress: v.string(),
    input: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Verify agent exists and user has access
    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      throw new Error('Agent not found');
    }

    const executionId = await ctx.db.insert('agentExecutions', {
      agentId: args.agentId,
      walletAddress: args.walletAddress,
      status: 'pending',
      input: args.input,
      startedAt: Date.now(),
      metadata: args.metadata,
    });

    return await ctx.db.get(executionId);
  },
});

// Update execution status and result
export const updateExecution = mutation({
  args: {
    id: v.id('agentExecutions'),
    walletAddress: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('running'),
      v.literal('waiting_approval'),
      v.literal('completed'),
      v.literal('failed'),
      v.literal('cancelled')
    ),
    result: v.optional(
      v.object({
        success: v.boolean(),
        output: v.string(),
        finalStep: v.number(),
        totalSteps: v.number(),
        toolsUsed: v.array(v.string()),
        tokensUsed: v.object({
          input: v.number(),
          output: v.number(),
          total: v.number(),
        }),
        executionTime: v.number(),
      })
    ),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const execution = await ctx.db.get(args.id);
    if (!execution || execution.walletAddress !== args.walletAddress) {
      throw new Error('Execution not found or access denied');
    }

    const updates: Partial<Doc<'agentExecutions'>> = {
      status: args.status,
    };

    if (args.result !== undefined) updates.result = args.result;
    if (args.error !== undefined) updates.error = args.error;

    if (['completed', 'failed', 'cancelled'].includes(args.status)) {
      updates.completedAt = Date.now();
    }

    await ctx.db.patch(args.id, updates);
    return await ctx.db.get(args.id);
  },
});

// Get execution by ID
export const getExecutionById = query({
  args: { id: v.id('agentExecutions') },
  handler: async (ctx, args) => {
    const execution = await ctx.db.get(args.id);
    if (!execution) return null;

    // Get associated agent
    const agent = await ctx.db.get(execution.agentId);

    // Get execution steps
    const steps = await ctx.db
      .query('agentSteps')
      .withIndex('by_execution', (q) => q.eq('executionId', args.id))
      .order('asc')
      .collect();

    return {
      ...execution,
      agent,
      steps,
    };
  },
});

// Get executions by agent
export const getExecutionsByAgent = query({
  args: {
    agentId: v.id('agents'),
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);

    let query = ctx.db
      .query('agentExecutions')
      .withIndex('by_agent', (q) => q.eq('agentId', args.agentId));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field('status'), args.status));
    }

    return await query.order('desc').take(limit);
  },
});

// Get user's executions
export const getUserExecutions = query({
  args: {
    walletAddress: v.string(),
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);

    let query = ctx.db
      .query('agentExecutions')
      .withIndex('by_user', (q) => q.eq('walletAddress', args.walletAddress));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field('status'), args.status));
    }

    const executions = await query.order('desc').take(limit);

    // Add agent info to each execution
    const executionsWithAgents = await Promise.all(
      executions.map(async (execution) => {
        const agent = await ctx.db.get(execution.agentId);
        return {
          ...execution,
          agentName: agent?.name || 'Unknown Agent',
          agentModel: agent?.model || 'unknown',
        };
      })
    );

    return executionsWithAgents;
  },
});

// =============================================================================
// Agent Steps
// =============================================================================

// Add step to execution
export const addStep = mutation({
  args: {
    executionId: v.id('agentExecutions'),
    stepNumber: v.number(),
    type: v.union(
      v.literal('reasoning'),
      v.literal('tool_call'),
      v.literal('parallel_tools'),
      v.literal('human_approval'),
      v.literal('workflow_step')
    ),
    input: v.optional(v.string()),
    toolCalls: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          parameters: v.any(),
          requiresApproval: v.boolean(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const stepId = await ctx.db.insert('agentSteps', {
      executionId: args.executionId,
      stepNumber: args.stepNumber,
      type: args.type,
      status: 'pending',
      input: args.input,
      toolCalls: args.toolCalls,
      startedAt: Date.now(),
    });

    return await ctx.db.get(stepId);
  },
});

// Update step status and results
export const updateStep = mutation({
  args: {
    id: v.id('agentSteps'),
    status: v.union(
      v.literal('pending'),
      v.literal('running'),
      v.literal('completed'),
      v.literal('failed'),
      v.literal('waiting_approval')
    ),
    output: v.optional(v.string()),
    reasoning: v.optional(v.string()),
    toolResults: v.optional(
      v.array(
        v.object({
          id: v.string(),
          success: v.boolean(),
          result: v.any(),
          error: v.optional(
            v.object({
              code: v.string(),
              message: v.string(),
              details: v.optional(v.any()),
              retryable: v.optional(v.boolean()),
            })
          ),
          executionTime: v.number(),
          metadata: v.optional(v.any()),
        })
      )
    ),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: Partial<Doc<'agentSteps'>> = {
      status: args.status,
    };

    if (args.output !== undefined) updates.output = args.output;
    if (args.reasoning !== undefined) updates.reasoning = args.reasoning;
    if (args.toolResults !== undefined) updates.toolResults = args.toolResults;
    if (args.error !== undefined) updates.error = args.error;

    if (['completed', 'failed'].includes(args.status)) {
      updates.completedAt = Date.now();
    }

    await ctx.db.patch(args.id, updates);
    return await ctx.db.get(args.id);
  },
});

// Get agent statistics
export const getAgentStats = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const agents = await ctx.db
      .query('agents')
      .withIndex('by_creator', (q) => q.eq('createdBy', args.walletAddress))
      .collect();

    const activeAgents = agents.filter((agent) => agent.isActive);

    // Get execution counts
    const allExecutions = await Promise.all(
      agents.map((agent) =>
        ctx.db
          .query('agentExecutions')
          .withIndex('by_agent', (q) => q.eq('agentId', agent._id))
          .collect()
      )
    );

    const executions = allExecutions.flat();
    const completedExecutions = executions.filter(
      (exec) => exec.status === 'completed'
    );
    const failedExecutions = executions.filter(
      (exec) => exec.status === 'failed'
    );

    const modelUsage = new Map<string, number>();
    agents.forEach((agent) => {
      modelUsage.set(agent.model, (modelUsage.get(agent.model) || 0) + 1);
    });

    return {
      totalAgents: agents.length,
      activeAgents: activeAgents.length,
      totalExecutions: executions.length,
      completedExecutions: completedExecutions.length,
      failedExecutions: failedExecutions.length,
      successRate:
        executions.length > 0
          ? completedExecutions.length / executions.length
          : 0,
      modelUsage: Object.fromEntries(modelUsage),
      averageExecutionTime:
        completedExecutions.length > 0
          ? completedExecutions
              .filter((exec) => exec.completedAt && exec.startedAt)
              .reduce(
                (sum, exec) => sum + (exec.completedAt! - exec.startedAt),
                0
              ) / completedExecutions.length
          : 0,
    };
  },
});