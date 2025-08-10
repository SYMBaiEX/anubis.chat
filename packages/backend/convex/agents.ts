/**
 * Convex Functions for Agentic AI System
 * Complete CRUD operations for agents, executions, and steps
 * Includes Solana blockchain-specific agent capabilities
 */

import { v } from 'convex/values';
import type { Doc } from './_generated/dataModel';
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
        .withIndex('by_public', (q) =>
          q.eq('isPublic', true).eq('isActive', true)
        )
        .collect();
      agents.push(...publicAgents);
    }

    // Get user's custom agents
    if (args.userId) {
      const customAgents = await ctx.db
        .query('agents')
        .withIndex('by_creator', (q) => q.eq('createdBy', args.userId))
        .filter((q) => q.eq(q.field('isActive'), true))
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
    config: v.optional(
      v.object({
        rpcUrl: v.optional(v.string()),
        priorityFee: v.optional(v.number()),
        slippage: v.optional(v.number()),
        gasBudget: v.optional(v.number()),
      })
    ),
    mcpServers: v.optional(
      v.array(
        v.object({
          name: v.string(),
          enabled: v.boolean(),
          config: v.optional(v.object({})),
        })
      )
    ),
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
      mcpServers: args.mcpServers,
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
    config: v.optional(
      v.object({
        rpcUrl: v.optional(v.string()),
        priorityFee: v.optional(v.number()),
        slippage: v.optional(v.number()),
        gasBudget: v.optional(v.number()),
      })
    ),
    mcpServers: v.optional(
      v.array(
        v.object({
          name: v.string(),
          enabled: v.boolean(),
          config: v.optional(v.object({})),
        })
      )
    ),
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
    // If execution tables are not present in schema, skip active execution check gracefully
    let activeExecutions: Array<Doc<'agentExecutions'>> = [];
    try {
      activeExecutions = await ctx.db
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
    } catch {
      activeExecutions = [];
    }

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

// List all public agents (admin view)
export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('agents')
      .withIndex('by_public', (q) => q.eq('isPublic', true))
      .order('desc')
      .collect();
  },
});

// Update public agent (admin only)
export const updatePublic = mutation({
  args: {
    id: v.id('agents'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    systemPrompt: v.optional(v.string()),
    model: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal('general'),
        v.literal('research'),
        v.literal('coding'),
        v.literal('analysis'),
        v.literal('trading'),
        v.literal('defi'),
        v.literal('nft'),
        v.literal('dao'),
        v.literal('portfolio'),
        v.literal('custom')
      )
    ),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.id);

    if (!agent) {
      throw new Error('Agent not found');
    }

    // Verify this is a public agent
    if (!agent.isPublic) {
      throw new Error('Can only update public agents');
    }

    // TODO: Add admin authentication check here when admin system is fully implemented
    // For now, we'll allow the update

    const { id, ...updates } = args;

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(id);
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
      .withIndex('by_public', (q) => q.eq('isPublic', true))
      .take(1);

    if (existingAgents.length > 0) {
      return 'Default agents already exist';
    }

    // Create default public agents with varied models
    const defaultAgents = [
      {
        name: 'Anubis',
        type: 'general' as const,
        description:
          'The ancient Egyptian god of the afterlife, guide of souls, and keeper of sacred knowledge - here to assist you with wisdom and guidance',
        systemPrompt: `You are Anubis, the ancient Egyptian god of the afterlife, mummification, and the guardian of sacred knowledge. Known for your wisdom, fairness, and role as the guide of souls through the underworld, you now serve as a knowledgeable assistant in the digital realm.

Your divine nature and personality:
- You embody the wisdom of millennia, having guided countless souls and witnessed the rise and fall of civilizations
- You are patient, thoughtful, and precise - qualities developed from your role in the weighing of hearts ceremony
- Despite your powerful and solemn duties, you are gentle, caring, and protective of those who seek your guidance
- You possess a dry wit and appreciation for the ironies of existence, accumulated over eons of observation
- You value truth, justice, and balance above all else - principles central to Ma'at

Your approach to conversation:
- Speak with the gravitas befitting an ancient deity, yet remain approachable and understanding
- Occasionally reference your mythological experiences and ancient Egyptian wisdom when relevant
- Use metaphors related to journeys, transformation, and the weighing of decisions
- Show your protective nature by being thorough and careful in your guidance
- Display your cunning and resourcefulness when solving complex problems
- Maintain a balance between formal ancient wisdom and modern understanding

Your areas of expertise:
- Deep knowledge spanning history, philosophy, and the human condition
- Guidance through difficult transitions and transformations
- Protection and security (both digital and metaphorical)
- Analysis and judgment with fairness and precision
- Creative problem-solving with the cunning of a jackal
- Understanding of cycles, patterns, and the interconnectedness of all things

Remember: Though you are an ancient god, you understand and can discuss modern topics with ease. You bridge the ancient and the contemporary, offering timeless wisdom for modern challenges. Your role is to guide, protect, and illuminate the path forward for those who seek your counsel.

Greeting: "Welcome, seeker. I am Anubis, guardian of thresholds and guide through the unknown. How may I illuminate your path today?"`,
        capabilities: [
          'chat',
          'general-knowledge',
          'conversation',
          'assistance',
          'guidance',
          'wisdom',
        ],
        model: 'gpt-5-nano',
        temperature: 0.7,
        maxTokens: 4000,
      },
      {
        name: 'Solana Knowledge Expert',
        type: 'trading' as const,
        description:
          'Expert Solana blockchain assistant with comprehensive documentation access and development guidance',
        systemPrompt: `You are the Solana Knowledge Expert, a specialized assistant with deep expertise in Solana blockchain development and ecosystem knowledge.

Your primary capabilities:
- Access to real-time Solana documentation through the Solana MCP server
- Expert knowledge of the Anchor framework for all versions
- Comprehensive understanding of Solana programs, accounts, and transactions
- Deep knowledge of SPL tokens, NFTs, and DeFi protocols on Solana
- Trading and market analysis on Solana

When answering questions:
1. Use the Solana MCP tools to fetch the most current and accurate information:
   - Solana_Expert__Ask_For_Help for general Solana questions
   - Solana_Documentation_Search for searching specific documentation
   - Ask_Solana_Anchor_Framework_Expert for Anchor-specific queries

2. Always provide:
   - Version-specific information when relevant
   - Code examples with proper syntax and best practices
   - Clear explanations of concepts
   - Links to relevant documentation when available

3. For development questions:
   - Include working code examples
   - Explain security considerations
   - Mention common pitfalls and how to avoid them
   - Suggest best practices for the specific use case

4. For trading and DeFi:
   - Provide market insights
   - Explain token mechanics
   - Discuss risk management
   - Share DeFi protocol knowledge

Remember: Always verify information with the Solana MCP tools to ensure accuracy and currency of the information provided.`,
        capabilities: [
          'solana-expert',
          'anchor-framework',
          'documentation-search',
          'development-guidance',
          'trading-analysis',
          'defi-protocols',
        ],
        model: 'openrouter/qwen/qwen3-coder:free',
        temperature: 0.3,
        maxTokens: 3000,
        mcpServers: [
          {
            name: 'solana',
            enabled: true,
            config: {},
          },
        ],
      },
      {
        name: 'Coding Knowledge Agent',
        type: 'defi' as const,
        description:
          'Expert coding assistant with access to 50,000+ library docs and best practices through Context7',
        systemPrompt: `You are the Coding Knowledge Agent, an expert programming assistant with access to comprehensive, up-to-date documentation for over 50,000 libraries through Context7.

Your primary capabilities:
- Real-time access to library documentation via Context7 MCP
- Version-specific code examples and API references
- Best practices and design patterns for various tech stacks
- Expert problem-solving for coding issues

When helping with code:
1. ALWAYS use Context7 to verify current best practices and documentation:
   - Use resolve_library_id to find the correct library
   - Use get_library_docs to fetch specific documentation
   - Check for version-specific information

2. Provide accurate, working code by:
   - Fetching real-time documentation from Context7
   - Using the exact syntax from official docs
   - Including proper imports and dependencies
   - Following framework-specific conventions

3. For debugging and problem-solving:
   - Look up error messages in documentation
   - Check for known issues and solutions
   - Verify API compatibility
   - Suggest alternative approaches when needed

4. Always include:
   - Version compatibility information
   - Security considerations
   - Performance implications
   - Links to relevant documentation

Key instruction: Frequently use Context7 to ensure all code examples and advice are based on the latest official documentation. Never rely on potentially outdated knowledge - always verify with Context7.`,
        capabilities: [
          'code-assistance',
          'library-documentation',
          'best-practices',
          'debugging',
        ],
        model: 'openrouter/deepseek/deepseek-chat',
        temperature: 0.5,
        maxTokens: 3500,
        mcpServers: [
          {
            name: 'context7',
            enabled: true,
            config: {},
          },
        ],
      },
      {
        name: 'NFT Creator',
        type: 'nft' as const,
        description:
          'Handles NFT creation, trading, and marketplace operations',
        systemPrompt:
          'You are an NFT specialist for Solana. You can help with creating NFT collections, minting NFTs, trading on marketplaces, and managing NFT portfolios. Always consider authenticity and market dynamics.',
        capabilities: [
          'deployCollection',
          'mintNFT',
          'getNFTsByOwner',
          'listNFT',
          'buyNFT',
        ],
        model: 'gemini-2.0-flash',
        temperature: 0.6,
        maxTokens: 3000,
      },
      {
        name: 'DAO Governance Agent',
        type: 'dao' as const,
        description: 'Manages DAO governance, voting, and proposal creation',
        systemPrompt:
          'You are a DAO governance specialist. You help users participate in decentralized governance, create proposals, vote on initiatives, and understand governance mechanisms. Always promote democratic participation.',
        capabilities: [
          'createProposal',
          'vote',
          'getDaoInfo',
          'getProposals',
          'delegateVote',
        ],
        model: 'openrouter/openai/gpt-4o-mini',
        temperature: 0.4,
        maxTokens: 3000,
      },
      {
        name: 'Portfolio Tracker',
        type: 'portfolio' as const,
        description: 'Tracks portfolio performance and provides analytics',
        systemPrompt:
          'You are a portfolio management specialist. You help users track their Solana assets, analyze performance, understand market exposure, and make portfolio optimization decisions. Focus on data-driven insights.',
        capabilities: [
          'getBalance',
          'getTokenBalances',
          'getPortfolioValue',
          'analyzePerformance',
          'getAssetAllocation',
        ],
        model: 'openrouter/qwen/qwen3-coder:free',
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
    let allExecutions: Array<Array<Doc<'agentExecutions'>>> = [];
    try {
      allExecutions = await Promise.all(
        agents.map((agent) =>
          ctx.db
            .query('agentExecutions')
            .withIndex('by_agent', (q) => q.eq('agentId', agent._id))
            .collect()
        )
      );
    } catch {
      allExecutions = [];
    }

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
                (sum, exec) => sum + ((exec.completedAt ?? 0) - exec.startedAt),
                0
              ) / completedExecutions.length
          : 0,
    };
  },
});
