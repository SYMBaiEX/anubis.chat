import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // Legacy todos table (for existing functionality)
  todos: defineTable({
    text: v.string(),
    completed: v.boolean(),
  }),

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
});
