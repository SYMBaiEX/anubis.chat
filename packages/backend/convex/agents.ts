import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

/**
 * List all available agents for a user
 * Includes both public agents and user's custom agents
 */
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

/**
 * Get a specific agent by ID
 */
export const get = query({
  args: { id: v.id('agents') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Create a new custom agent
 */
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

    return agentId;
  },
});

/**
 * Update an existing agent
 */
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
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return id;
  },
});

/**
 * Delete an agent (mark as inactive)
 */
export const remove = mutation({
  args: { 
    id: v.id('agents'),
    userId: v.string(), // Only allow user to delete their own custom agents
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.id);
    
    if (!agent) {
      throw new Error('Agent not found');
    }

    // Only allow deleting custom agents created by the user
    if (agent.isPublic || agent.createdBy !== args.userId) {
      throw new Error('Cannot delete this agent');
    }

    await ctx.db.patch(args.id, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

/**
 * Initialize default public agents (run once)
 */
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