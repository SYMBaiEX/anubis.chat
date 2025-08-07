import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// =============================================================================
// Common Schema Definitions
// =============================================================================

// JSON-like values that can be stored
const jsonValue = v.union(
  v.string(),
  v.number(),
  v.boolean(),
  v.null(),
  v.array(v.any()), // Arrays can contain mixed types
  v.object({}) // Objects can have dynamic keys
);

// Tool execution arguments - commonly used parameter types
const toolParameters = v.union(
  v.string(),
  v.number(),
  v.boolean(),
  v.null(),
  v.object({
    // Common tool parameter structures
    query: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    filters: v.optional(v.object({})),
    options: v.optional(v.object({})),
    data: v.optional(v.object({})),
    config: v.optional(v.object({})),
  }),
  v.array(jsonValue)
);

// Tool execution results
const toolResult = v.union(
  v.string(),
  v.number(),
  v.boolean(),
  v.null(),
  v.object({
    status: v.optional(v.string()),
    message: v.optional(v.string()),
    data: v.optional(jsonValue),
    metadata: v.optional(v.object({})),
  }),
  v.array(jsonValue)
);

// Error details for various error contexts
const errorDetails = v.object({
  code: v.optional(v.string()),
  message: v.optional(v.string()),
  stack: v.optional(v.string()),
  context: v.optional(v.object({})),
  timestamp: v.optional(v.number()),
  severity: v.optional(
    v.union(
      v.literal('low'),
      v.literal('medium'),
      v.literal('high'),
      v.literal('critical')
    )
  ),
});

// Workflow/Agent execution metadata
const executionMetadata = v.object({
  source: v.optional(v.string()),
  priority: v.optional(
    v.union(
      v.literal('low'),
      v.literal('normal'),
      v.literal('high'),
      v.literal('urgent')
    )
  ),
  tags: v.optional(v.array(v.string())),
  environment: v.optional(v.string()),
  timeout: v.optional(v.number()),
  retryPolicy: v.optional(
    v.object({
      maxRetries: v.number(),
      backoffMultiplier: v.optional(v.number()),
      initialDelay: v.optional(v.number()),
    })
  ),
  custom: v.optional(v.object({})),
});

// Workflow variables
const workflowVariables = v.object({
  inputs: v.optional(v.object({})),
  outputs: v.optional(v.object({})),
  context: v.optional(v.object({})),
  state: v.optional(v.object({})),
  temp: v.optional(v.object({})),
});

// Search filters
const searchFilters = v.object({
  dateRange: v.optional(
    v.object({
      start: v.number(),
      end: v.number(),
    })
  ),
  type: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  owner: v.optional(v.string()),
  status: v.optional(v.string()),
  metadata: v.optional(v.object({})),
});

// HTTP headers for webhooks - using underscore-case for valid identifiers
const httpHeaders = v.object({
  content_type: v.optional(v.string()),
  authorization: v.optional(v.string()),
  user_agent: v.optional(v.string()),
  accept: v.optional(v.string()),
  x_api_key: v.optional(v.string()),
  // Allow additional custom headers as key-value pairs
  custom_headers: v.optional(
    v.array(
      v.object({
        key: v.string(),
        value: v.string(),
      })
    )
  ),
});

// Webhook payload structure
const webhookPayload = v.object({
  event: v.string(),
  timestamp: v.number(),
  data: v.object({}),
  metadata: v.optional(
    v.object({
      version: v.optional(v.string()),
      source: v.optional(v.string()),
      traceId: v.optional(v.string()),
    })
  ),
});

// Approval request data
const approvalData = v.object({
  action: v.string(),
  resource: v.optional(v.string()),
  parameters: v.optional(toolParameters),
  context: v.optional(v.object({})),
  metadata: v.optional(v.object({})),
});

// Approval modifications
const approvalModifications = v.object({
  parameters: v.optional(toolParameters),
  conditions: v.optional(v.array(v.string())),
  restrictions: v.optional(v.array(v.string())),
  metadata: v.optional(v.object({})),
});

export default defineSchema({
  // =============================================================================
  // User Management
  // =============================================================================

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
      language: v.optional(v.string()),
      temperature: v.optional(v.number()),
      maxTokens: v.optional(v.number()),
      streamResponses: v.optional(v.boolean()),
      saveHistory: v.optional(v.boolean()),
      compactMode: v.optional(v.boolean()),
    }),
    subscription: v.object({
      tier: v.union(
        v.literal('free'),
        v.literal('pro'),
        v.literal('enterprise')
      ),
      expiresAt: v.optional(v.number()),
      tokensUsed: v.number(),
      tokensLimit: v.number(),
      features: v.array(v.string()),
      billingCycle: v.optional(
        v.union(v.literal('monthly'), v.literal('yearly'))
      ),
      autoRenew: v.optional(v.boolean()),
    }),
    createdAt: v.number(),
    lastActiveAt: v.number(),
    isActive: v.boolean(),
  })
    .index('by_wallet', ['walletAddress'])
    .index('by_active', ['isActive', 'lastActiveAt'])
    .index('by_tier', ['subscription.tier']),

  // =============================================================================
  // Authentication & Security
  // =============================================================================

  // JWT token blacklist for secure logout
  blacklistedTokens: defineTable({
    tokenId: v.string(),
    userId: v.string(), // walletAddress
    expiresAt: v.number(),
    blacklistedAt: v.number(),
    reason: v.optional(v.string()),
  })
    .index('by_token', ['tokenId'])
    .index('by_expires', ['expiresAt'])
    .index('by_user', ['userId']),

  // Refresh tokens for secure token renewal
  refreshTokens: defineTable({
    tokenId: v.string(),
    userId: v.string(), // walletAddress
    tokenHash: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
    lastUsedAt: v.optional(v.number()),
    deviceInfo: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    isActive: v.boolean(),
  })
    .index('by_token', ['tokenId'])
    .index('by_user', ['userId', 'isActive'])
    .index('by_expires', ['expiresAt']),

  // Nonce tracking for wallet authentication
  nonces: defineTable({
    publicKey: v.string(),
    nonce: v.string(),
    challenge: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
    used: v.boolean(),
  })
    .index('by_key', ['publicKey'])
    .index('by_nonce', ['nonce'])
    .index('by_expires', ['expiresAt'])
    .index('by_used', ['used']),

  // =============================================================================
  // Chat System
  // =============================================================================

  // Chat conversations
  chats: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    ownerId: v.string(), // walletAddress
    model: v.string(),
    systemPrompt: v.optional(v.string()),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
    isPinned: v.optional(v.boolean()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastMessageAt: v.optional(v.number()),
    messageCount: v.number(),
    totalTokens: v.number(),
  })
    .index('by_owner', ['ownerId', 'updatedAt'])
    .index('by_active', ['isActive', 'lastMessageAt'])
    .index('by_pinned', ['ownerId', 'isPinned', 'updatedAt'])
    .searchIndex('search_title', {
      searchField: 'title',
      filterFields: ['ownerId', 'isActive'],
    }),

  // Messages within chats
  messages: defineTable({
    chatId: v.id('chats'),
    walletAddress: v.string(),
    role: v.union(
      v.literal('user'),
      v.literal('assistant'),
      v.literal('system')
    ),
    content: v.string(),
    tokenCount: v.optional(v.number()),
    embedding: v.optional(v.array(v.number())),
    metadata: v.optional(
      v.object({
        model: v.optional(v.string()),
        finishReason: v.optional(v.string()),
        usage: v.optional(
          v.object({
            inputTokens: v.number(),
            outputTokens: v.number(),
            totalTokens: v.number(),
          })
        ),
        tools: v.optional(
          v.array(
            v.object({
              id: v.string(),
              name: v.string(),
              args: toolParameters,
              result: v.optional(
                v.object({
                  success: v.boolean(),
                  data: v.optional(toolResult),
                  error: v.optional(v.string()),
                  executionTime: v.optional(v.number()),
                })
              ),
            })
          )
        ),
        reasoning: v.optional(v.string()),
        citations: v.optional(v.array(v.string())), // Document IDs for RAG
      })
    ),
    status: v.optional(v.string()),
    parentMessageId: v.optional(v.id('messages')),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    editedAt: v.optional(v.number()),
  })
    .index('by_chat', ['chatId', 'createdAt'])
    .index('by_user', ['walletAddress', 'createdAt'])
    .index('by_timestamp', ['createdAt'])
    .index('by_parent', ['parentMessageId'])
    .searchIndex('search_content', {
      searchField: 'content',
      filterFields: ['chatId', 'walletAddress', 'role'],
    }),

  // =============================================================================
  // Document & Knowledge Management
  // =============================================================================

  // Documents for RAG system
  documents: defineTable({
    title: v.string(),
    content: v.string(),
    type: v.union(
      v.literal('text'),
      v.literal('markdown'),
      v.literal('pdf'),
      v.literal('json'),
      v.literal('csv'),
      v.literal('url')
    ),
    ownerId: v.string(), // walletAddress
    isPublic: v.boolean(),
    embedding: v.optional(v.array(v.number())),
    tags: v.optional(v.array(v.string())),
    metadata: v.optional(
      v.object({
        source: v.optional(v.string()),
        author: v.optional(v.string()),
        category: v.optional(v.string()),
        language: v.optional(v.string()),
        wordCount: v.optional(v.number()),
        characterCount: v.optional(v.number()),
        mimeType: v.optional(v.string()),
        fileSize: v.optional(v.number()),
        checksum: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_owner', ['ownerId', 'createdAt'])
    .index('by_owner_category', ['ownerId', 'metadata.category', 'createdAt'])
    .index('by_type', ['type'])
    .index('by_public', ['isPublic', 'createdAt'])
    .index('by_tags', ['tags'])
    .searchIndex('search_content', {
      searchField: 'content',
      filterFields: ['ownerId', 'type', 'isPublic'],
    })
    .searchIndex('search_title', {
      searchField: 'title',
      filterFields: ['ownerId', 'type', 'isPublic'],
    }),

  // Document chunks for RAG retrieval
  documentChunks: defineTable({
    documentId: v.id('documents'),
    chunkIndex: v.number(),
    content: v.string(),
    embedding: v.array(v.number()),
    metadata: v.object({
      startOffset: v.number(),
      endOffset: v.number(),
      wordCount: v.number(),
      overlap: v.optional(v.number()),
    }),
    createdAt: v.number(),
  })
    .index('by_document', ['documentId', 'chunkIndex'])
    .vectorIndex('by_embedding', {
      vectorField: 'embedding',
      dimensions: 1536, // OpenAI embedding dimensions
      filterFields: ['documentId'],
    }),

  // =============================================================================
  // Agentic AI System - Feature Branch Version with Blockchain Extensions
  // =============================================================================

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

  // =============================================================================
  // Workflow System (from upstream - for future compatibility)
  // =============================================================================

  // Workflows
  workflows: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    walletAddress: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_owner', ['walletAddress', 'updatedAt'])
    .index('by_active', ['isActive', 'updatedAt'])
    .searchIndex('search_name', {
      searchField: 'name',
      filterFields: ['walletAddress', 'isActive'],
    }),

  // Workflow steps
  workflowSteps: defineTable({
    workflowId: v.id('workflows'),
    stepId: v.string(),
    name: v.string(),
    type: v.union(
      v.literal('agent_task'),
      v.literal('condition'),
      v.literal('parallel'),
      v.literal('sequential'),
      v.literal('human_approval'),
      v.literal('delay'),
      v.literal('webhook'),
      v.literal('start'),
      v.literal('end'),
      v.literal('task'),
      v.literal('loop'),
      v.literal('subworkflow')
    ),
    agentId: v.optional(v.id('agents')),
    condition: v.optional(v.string()),
    parameters: v.optional(toolParameters),
    nextSteps: v.optional(v.array(v.string())),
    requiresApproval: v.optional(v.boolean()),
    order: v.number(),
  })
    .index('by_workflow', ['workflowId', 'order'])
    .index('by_step_id', ['stepId']),

  // Workflow triggers
  workflowTriggers: defineTable({
    workflowId: v.id('workflows'),
    triggerId: v.string(),
    type: v.union(
      v.literal('manual'),
      v.literal('schedule'),
      v.literal('webhook'),
      v.literal('completion'),
      v.literal('condition')
    ),
    condition: v.string(),
    parameters: v.optional(toolParameters),
    isActive: v.boolean(),
  })
    .index('by_workflow', ['workflowId'])
    .index('by_type', ['type', 'isActive']),

  // Workflow executions
  workflowExecutions: defineTable({
    workflowId: v.id('workflows'),
    walletAddress: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('running'),
      v.literal('waiting_approval'),
      v.literal('completed'),
      v.literal('failed'),
      v.literal('cancelled')
    ),
    currentStep: v.string(),
    variables: v.optional(workflowVariables),
    error: v.optional(
      v.object({
        stepId: v.string(),
        code: v.string(),
        message: v.string(),
        details: v.optional(errorDetails),
      })
    ),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index('by_workflow', ['workflowId', 'startedAt'])
    .index('by_user', ['walletAddress', 'startedAt'])
    .index('by_status', ['status', 'startedAt']),

  // Workflow step results
  workflowStepResults: defineTable({
    executionId: v.id('workflowExecutions'),
    stepId: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('running'),
      v.literal('completed'),
      v.literal('failed'),
      v.literal('waiting_approval')
    ),
    output: v.optional(toolResult),
    error: v.optional(v.string()),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    retryCount: v.optional(v.number()),
  })
    .index('by_execution', ['executionId', 'stepId'])
    .index('by_status', ['status']),

  // =============================================================================
  // Human-in-the-Loop System
  // =============================================================================

  // Approval requests
  approvalRequests: defineTable({
    executionId: v.string(), // Can be agent or workflow execution
    executionType: v.union(v.literal('agent'), v.literal('workflow')),
    stepId: v.string(),
    walletAddress: v.string(),
    type: v.union(
      v.literal('tool_execution'),
      v.literal('workflow_step'),
      v.literal('sensitive_action'),
      v.literal('resource_usage'),
      v.literal('custom')
    ),
    message: v.string(),
    data: approvalData,
    status: v.union(
      v.literal('pending'),
      v.literal('approved'),
      v.literal('rejected'),
      v.literal('expired')
    ),
    response: v.optional(
      v.object({
        approved: v.boolean(),
        message: v.optional(v.string()),
        modifications: v.optional(approvalModifications),
      })
    ),
    expiresAt: v.number(),
    createdAt: v.number(),
    respondedAt: v.optional(v.number()),
  })
    .index('by_user', ['walletAddress', 'status', 'createdAt'])
    .index('by_execution', ['executionId', 'executionType'])
    .index('by_expires', ['expiresAt'])
    .index('by_status', ['status', 'createdAt']),

  // =============================================================================
  // Usage & Analytics
  // =============================================================================

  // AI usage tracking
  usage: defineTable({
    userId: v.string(), // walletAddress
    operation: v.union(
      v.literal('completion'),
      v.literal('object_generation'),
      v.literal('stream'),
      v.literal('embedding'),
      v.literal('agent_execution'),
      v.literal('workflow_execution')
    ),
    model: v.string(),
    tokensUsed: v.number(),
    cost: v.optional(v.number()),
    duration: v.optional(v.number()),
    success: v.boolean(),
    createdAt: v.number(),
    metadata: v.optional(
      v.object({
        chatId: v.optional(v.id('chats')),
        messageId: v.optional(v.id('messages')),
        agentId: v.optional(v.id('agents')),
        workflowId: v.optional(v.id('workflows')),
        requestSize: v.optional(v.number()),
        responseSize: v.optional(v.number()),
        toolsUsed: v.optional(v.array(v.string())),
      })
    ),
  })
    .index('by_user', ['userId', 'createdAt'])
    .index('by_operation', ['operation', 'createdAt'])
    .index('by_model', ['model', 'createdAt'])
    .index('by_success', ['success', 'createdAt']),

  // Search and analytics
  searchQueries: defineTable({
    userId: v.string(), // walletAddress
    query: v.string(),
    type: v.union(
      v.literal('semantic'),
      v.literal('keyword'),
      v.literal('hybrid'),
      v.literal('vector')
    ),
    resultsCount: v.number(),
    executionTime: v.number(),
    filters: v.optional(searchFilters),
    createdAt: v.number(),
  })
    .index('by_user', ['userId', 'createdAt'])
    .index('by_type', ['type', 'createdAt'])
    .searchIndex('search_queries', {
      searchField: 'query',
      filterFields: ['userId', 'type'],
    }),

  // =============================================================================
  // Memory & Context Management
  // =============================================================================

  // Memory entries for long-term context
  memories: defineTable({
    userId: v.string(), // walletAddress
    content: v.string(),
    embedding: v.array(v.number()),
    importance: v.number(), // 0-1 relevance score
    type: v.union(
      v.literal('fact'),
      v.literal('preference'),
      v.literal('skill'),
      v.literal('goal'),
      v.literal('context')
    ),
    tags: v.optional(v.array(v.string())),
    sourceId: v.optional(v.string()), // Source chat/document ID
    sourceType: v.optional(
      v.union(
        v.literal('chat'),
        v.literal('document'),
        v.literal('agent'),
        v.literal('workflow')
      )
    ),
    accessCount: v.number(),
    lastAccessed: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId', 'importance'])
    .index('by_type', ['type', 'importance'])
    .index('by_source', ['sourceId', 'sourceType'])
    .index('by_access', ['lastAccessed'])
    .vectorIndex('by_embedding', {
      vectorField: 'embedding',
      dimensions: 1536,
      filterFields: ['userId', 'type'],
    })
    .searchIndex('search_content', {
      searchField: 'content',
      filterFields: ['userId', 'type'],
    }),

  // =============================================================================
  // Integration & External Services
  // =============================================================================

  // Webhook subscriptions
  webhooks: defineTable({
    userId: v.string(), // walletAddress
    url: v.string(),
    events: v.array(v.string()),
    secret: v.string(),
    isActive: v.boolean(),
    headers: v.optional(httpHeaders),
    retryPolicy: v.optional(
      v.object({
        maxRetries: v.number(),
        backoffMultiplier: v.number(),
        initialDelay: v.number(),
      })
    ),
    createdAt: v.number(),
    lastTriggered: v.optional(v.number()),
    failureCount: v.number(),
  })
    .index('by_user', ['userId', 'isActive'])
    .index('by_active', ['isActive']),

  // Webhook delivery logs
  webhookDeliveries: defineTable({
    webhookId: v.id('webhooks'),
    eventType: v.string(),
    payload: webhookPayload,
    responseStatus: v.optional(v.number()),
    responseBody: v.optional(v.string()),
    success: v.boolean(),
    attemptCount: v.number(),
    createdAt: v.number(),
    deliveredAt: v.optional(v.number()),
    error: v.optional(v.string()),
  })
    .index('by_webhook', ['webhookId', 'createdAt'])
    .index('by_success', ['success', 'createdAt']),

  // =============================================================================
  // MCP Server Integration
  // =============================================================================

  // MCP Server configurations
  mcpServers: defineTable({
    userId: v.string(), // walletAddress
    serverId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    url: v.string(),
    apiKey: v.optional(v.string()),
    enabled: v.boolean(),
    tools: v.array(v.string()),
    status: v.union(
      v.literal('disconnected'),
      v.literal('connecting'),
      v.literal('connected'),
      v.literal('error'),
      v.literal('disabled')
    ),
    lastConnected: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId', 'enabled'])
    .index('by_server', ['serverId'])
    .index('by_status', ['status']),

  // MCP Tool call logs
  mcpToolCalls: defineTable({
    serverId: v.string(),
    toolName: v.string(),
    userId: v.string(), // walletAddress
    input: toolParameters,
    output: v.optional(toolResult),
    success: v.boolean(),
    executionTime: v.number(),
    error: v.optional(
      v.object({
        code: v.string(),
        message: v.string(),
        details: v.optional(errorDetails),
      })
    ),
    createdAt: v.number(),
  })
    .index('by_server', ['serverId', 'createdAt'])
    .index('by_tool', ['toolName', 'createdAt'])
    .index('by_user', ['userId', 'createdAt'])
    .index('by_success', ['success', 'createdAt']),
});