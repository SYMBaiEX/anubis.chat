import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // Users table for wallet-based authentication
  users: defineTable({
    walletAddress: v.string(),
    publicKey: v.string(),
    displayName: v.optional(v.string()),
    avatar: v.optional(v.string()),
    preferences: v.object({
      theme: v.union(v.literal('light'), v.literal('dark')),
      aiModel: v.string(),
      notifications: v.boolean(),
    }),
    subscription: v.object({
      tier: v.union(
        v.literal('free'),
        v.literal('pro'),
        v.literal('enterprise')
      ),
      tokensUsed: v.number(),
      tokensLimit: v.number(),
      features: v.array(v.string()),
    }),
    createdAt: v.number(),
    lastActiveAt: v.number(),
    isActive: v.boolean(),
  })
    .index('by_wallet', ['walletAddress'])
    .index('by_active', ['isActive', 'lastActiveAt']),

  // Documents for RAG system
  documents: defineTable({
    title: v.string(),
    content: v.string(),
    type: v.union(
      v.literal('text'),
      v.literal('markdown'),
      v.literal('pdf'),
      v.literal('url')
    ),
    ownerId: v.string(), // walletAddress
    metadata: v.optional(
      v.object({
        source: v.optional(v.string()),
        author: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        category: v.optional(v.string()),
        language: v.optional(v.string()),
        wordCount: v.optional(v.number()),
        characterCount: v.optional(v.number()),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_owner', ['ownerId', 'createdAt'])
    .index('by_type', ['type'])
    .index('by_category', ['metadata.category'])
    .searchIndex('search_content', {
      searchField: 'content',
      filterFields: ['ownerId', 'type'],
    })
    .searchIndex('search_title', {
      searchField: 'title',
      filterFields: ['ownerId', 'type'],
    }),

  // Chat conversations
  chats: defineTable({
    title: v.string(),
    ownerId: v.string(), // walletAddress
    model: v.string(),
    systemPrompt: v.optional(v.string()),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastMessageAt: v.optional(v.number()),
  })
    .index('by_owner', ['ownerId', 'updatedAt'])
    .index('by_active', ['isActive', 'lastMessageAt']),

  // Messages within chats
  messages: defineTable({
    chatId: v.id('chats'),
    role: v.union(
      v.literal('user'),
      v.literal('assistant'),
      v.literal('system')
    ),
    content: v.string(),
    metadata: v.optional(
      v.object({
        model: v.optional(v.string()),
        tokensUsed: v.optional(v.number()),
        finishReason: v.optional(v.string()),
        processingTime: v.optional(v.number()),
        citations: v.optional(v.array(v.string())), // Document IDs for RAG
      })
    ),
    createdAt: v.number(),
  })
    .index('by_chat', ['chatId', 'createdAt'])
    .index('by_timestamp', ['createdAt']),

  // AI usage tracking
  usage: defineTable({
    userId: v.string(), // walletAddress
    operation: v.union(
      v.literal('completion'),
      v.literal('object_generation'),
      v.literal('stream'),
      v.literal('embedding')
    ),
    model: v.string(),
    tokensUsed: v.number(),
    cost: v.optional(v.number()),
    duration: v.optional(v.number()),
    createdAt: v.number(),
    metadata: v.optional(
      v.object({
        chatId: v.optional(v.id('chats')),
        messageId: v.optional(v.id('messages')),
        requestSize: v.optional(v.number()),
        responseSize: v.optional(v.number()),
      })
    ),
  })
    .index('by_user', ['userId', 'createdAt'])
    .index('by_operation', ['operation', 'createdAt'])
    .index('by_model', ['model', 'createdAt']),

  // JWT token blacklist
  blacklistedTokens: defineTable({
    tokenId: v.string(),
    userId: v.string(), // walletAddress
    expiresAt: v.number(),
    blacklistedAt: v.number(),
  })
    .index('by_token', ['tokenId'])
    .index('by_expires', ['expiresAt'])
    .index('by_user', ['userId']),

  // Nonce tracking for wallet authentication
  nonces: defineTable({
    publicKey: v.string(),
    nonce: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index('by_key', ['publicKey'])
    .index('by_expires', ['expiresAt']),

  // AI Agents for specialized tasks
  agents: defineTable({
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
    capabilities: v.array(v.string()), // List of available tools/actions
    model: v.string(),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
    config: v.optional(v.object({
      rpcUrl: v.optional(v.string()),
      priorityFee: v.optional(v.number()),
      slippage: v.optional(v.number()),
      gasBudget: v.optional(v.number()),
    })),
    isActive: v.boolean(),
    isPublic: v.boolean(), // Whether available to all users or custom
    createdBy: v.optional(v.string()), // walletAddress for custom agents
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_type', ['type', 'isActive'])
    .index('by_creator', ['createdBy', 'createdAt'])
    .index('by_public', ['isPublic', 'isActive']),

  // Agent Sessions - tracks active agent contexts
  agentSessions: defineTable({
    chatId: v.id('chats'),
    agentId: v.id('agents'),
    userId: v.string(), // walletAddress
    context: v.optional(v.object({
      lastAction: v.optional(v.string()),
      pendingTransactions: v.optional(v.array(v.string())),
      walletBalance: v.optional(v.number()),
      activePositions: v.optional(v.array(v.string())),
      preferences: v.optional(v.object({
        riskLevel: v.optional(v.union(v.literal('low'), v.literal('medium'), v.literal('high'))),
        maxSlippage: v.optional(v.number()),
        autoConfirm: v.optional(v.boolean()),
      })),
    })),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_chat', ['chatId'])
    .index('by_agent', ['agentId', 'isActive'])
    .index('by_user', ['userId', 'isActive']),

  // Blockchain Transactions initiated by agents
  blockchainTransactions: defineTable({
    chatId: v.optional(v.id('chats')),
    messageId: v.optional(v.id('messages')),
    agentId: v.optional(v.id('agents')),
    userId: v.string(), // walletAddress
    signature: v.optional(v.string()), // Transaction signature
    type: v.union(
      v.literal('transfer'),
      v.literal('swap'),
      v.literal('stake'),
      v.literal('unstake'),
      v.literal('lend'),
      v.literal('borrow'),
      v.literal('mint_nft'),
      v.literal('buy_nft'),
      v.literal('sell_nft'),
      v.literal('vote'),
      v.literal('create_token'),
      v.literal('liquidity_add'),
      v.literal('liquidity_remove'),
      v.literal('other')
    ),
    operation: v.string(), // Specific operation name (e.g., 'deployToken', 'swapTokens')
    parameters: v.object({
      amount: v.optional(v.string()),
      tokenMint: v.optional(v.string()),
      targetAddress: v.optional(v.string()),
      slippage: v.optional(v.number()),
      priority: v.optional(v.number()),
    }),
    status: v.union(
      v.literal('pending'),
      v.literal('confirmed'),
      v.literal('failed'),
      v.literal('cancelled')
    ),
    errorMessage: v.optional(v.string()),
    fee: v.optional(v.number()), // Transaction fee in SOL
    blockTime: v.optional(v.number()),
    confirmations: v.optional(v.number()),
    metadata: v.optional(v.object({
      tokensBefore: v.optional(v.array(v.object({
        mint: v.string(),
        amount: v.string(),
      }))),
      tokensAfter: v.optional(v.array(v.object({
        mint: v.string(),
        amount: v.string(),
      }))),
      priceImpact: v.optional(v.number()),
      executionTime: v.optional(v.number()),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId', 'createdAt'])
    .index('by_status', ['status', 'createdAt'])
    .index('by_type', ['type', 'createdAt'])
    .index('by_chat', ['chatId', 'createdAt'])
    .index('by_signature', ['signature']),

  // Tool usage tracking for Solana Agent Kit
  toolUsage: defineTable({
    agentId: v.id('agents'),
    userId: v.string(), // walletAddress
    toolName: v.string(), // e.g., 'deployToken', 'swapTokens', 'getBalance'
    category: v.union(
      v.literal('wallet'),
      v.literal('trading'),
      v.literal('defi'),
      v.literal('nft'),
      v.literal('governance'),
      v.literal('social'),
      v.literal('utility')
    ),
    parameters: v.optional(v.any()), // Tool-specific parameters
    result: v.optional(v.any()), // Tool execution result
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
    executionTime: v.optional(v.number()), // milliseconds
    gasUsed: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_agent', ['agentId', 'createdAt'])
    .index('by_user', ['userId', 'createdAt'])
    .index('by_tool', ['toolName', 'createdAt'])
    .index('by_category', ['category', 'success', 'createdAt']),

  // Agent Capabilities - defines what each agent can do
  agentCapabilities: defineTable({
    agentId: v.id('agents'),
    capability: v.string(), // Tool or action name
    enabled: v.boolean(),
    config: v.optional(v.any()), // Capability-specific configuration
    permissions: v.optional(v.array(v.string())), // Required permissions
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_agent', ['agentId', 'enabled'])
    .index('by_capability', ['capability', 'enabled']),
});
