import { v } from 'convex/values';
import type { Doc } from './_generated/dataModel';
import { mutation, query } from './_generated/server';

// Get chats by owner
export const getByOwner = query({
  args: {
    ownerId: v.string(), // This should be the user ID, not wallet address
    limit: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 50);

    let query = ctx.db
      .query('chats')
      .withIndex('by_owner', (q) => q.eq('ownerId', args.ownerId));

    if (args.isActive !== undefined) {
      query = query.filter((q) => q.eq(q.field('isActive'), args.isActive));
    }

    const chats = await query.order('desc').take(limit);

    // Get message counts for each chat
    const chatsWithMessageCounts = await Promise.all(
      chats.map(async (chat) => {
        const messageCount = await ctx.db
          .query('messages')
          .withIndex('by_chat', (q) => q.eq('chatId', chat._id))
          .collect()
          .then((messages) => messages.length);

        return {
          ...chat,
          messageCount,
        };
      })
    );

    return chatsWithMessageCounts;
  },
});

// Get single chat by ID
export const getById = query({
  args: { id: v.id('chats') },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.id);

    if (!chat) {
      return null;
    }

    // Get message count
    const messageCount = await ctx.db
      .query('messages')
      .withIndex('by_chat', (q) => q.eq('chatId', args.id))
      .collect()
      .then((messages) => messages.length);

    return {
      ...chat,
      messageCount,
    };
  },
});

// Create new chat
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    ownerId: v.string(), // This should be the user ID, not wallet address
    model: v.string(),
    systemPrompt: v.optional(v.string()),
    agentPrompt: v.optional(v.string()),
    agentId: v.optional(v.id('agents')),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const chatId = await ctx.db.insert('chats', {
      title: args.title,
      description: args.description,
      ownerId: args.ownerId,
      model: args.model,
      systemPrompt: args.systemPrompt,
      agentPrompt: args.agentPrompt,
      agentId: args.agentId,
      temperature: args.temperature,
      maxTokens: args.maxTokens,
      isPinned: false,
      isActive: true,
      messageCount: 0,
      totalTokens: 0,
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(chatId);
  },
});

// Update chat
export const update = mutation({
  args: {
    id: v.id('chats'),
    ownerId: v.string(), // For access control
    title: v.optional(v.string()),
    model: v.optional(v.string()),
    systemPrompt: v.optional(v.string()),
    agentPrompt: v.optional(v.string()),
    agentId: v.optional(v.id('agents')),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.id);

    if (!chat || chat.ownerId !== args.ownerId) {
      throw new Error('Chat not found or access denied');
    }

    const updates: Partial<Doc<'chats'>> = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) {
      updates.title = args.title;
    }
    if (args.model !== undefined) {
      updates.model = args.model;
    }
    if (args.systemPrompt !== undefined) {
      updates.systemPrompt = args.systemPrompt;
    }
    if (args.agentPrompt !== undefined) {
      updates.agentPrompt = args.agentPrompt;
    }
    if (args.agentId !== undefined) {
      updates.agentId = args.agentId;
    }
    if (args.temperature !== undefined) {
      updates.temperature = args.temperature;
    }
    if (args.maxTokens !== undefined) {
      updates.maxTokens = args.maxTokens;
    }
    if (args.isActive !== undefined) {
      updates.isActive = args.isActive;
    }

    await ctx.db.patch(args.id, updates);
    return await ctx.db.get(args.id);
  },
});

// Delete chat and all its messages
export const remove = mutation({
  args: {
    id: v.id('chats'),
    ownerId: v.string(), // For access control
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.id);

    if (!chat || chat.ownerId !== args.ownerId) {
      throw new Error('Chat not found or access denied');
    }

    // Delete all messages in this chat
    const messages = await ctx.db
      .query('messages')
      .withIndex('by_chat', (q) => q.eq('chatId', args.id))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete the chat
    await ctx.db.delete(args.id);

    return { success: true, chatId: args.id };
  },
});

// Archive chat (set inactive)
export const archive = mutation({
  args: {
    id: v.id('chats'),
    ownerId: v.string(),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.id);

    if (!chat || chat.ownerId !== args.ownerId) {
      throw new Error('Chat not found or access denied');
    }

    await ctx.db.patch(args.id, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.id);
  },
});

// Restore archived chat
export const restore = mutation({
  args: {
    id: v.id('chats'),
    ownerId: v.string(),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.id);

    if (!chat || chat.ownerId !== args.ownerId) {
      throw new Error('Chat not found or access denied');
    }

    await ctx.db.patch(args.id, {
      isActive: true,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.id);
  },
});

// Update last message timestamp and counters
export const updateLastMessageTime = mutation({
  args: {
    id: v.id('chats'),
    timestamp: v.number(),
    incrementMessageCount: v.optional(v.boolean()),
    addTokens: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.id);
    if (!chat) {
      throw new Error('Chat not found');
    }

    const updates: Partial<Doc<'chats'>> = {
      lastMessageAt: args.timestamp,
      updatedAt: Date.now(),
    };

    if (args.incrementMessageCount) {
      updates.messageCount = chat.messageCount + 1;
    }

    if (args.addTokens) {
      updates.totalTokens = chat.totalTokens + args.addTokens;
    }

    await ctx.db.patch(args.id, updates);
    return await ctx.db.get(args.id);
  },
});

// Pin or unpin a chat
export const togglePin = mutation({
  args: {
    id: v.id('chats'),
    ownerId: v.string(),
    isPinned: v.boolean(),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.id);

    if (!chat || chat.ownerId !== args.ownerId) {
      throw new Error('Chat not found or access denied');
    }

    await ctx.db.patch(args.id, {
      isPinned: args.isPinned,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.id);
  },
});

// Get chat statistics for user
export const getStats = query({
  args: { ownerId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // Return empty stats if no ownerId provided
    if (!args.ownerId) {
      return {
        totalChats: 0,
        activeChats: 0,
        archivedChats: 0,
        totalMessages: 0,
        modelUsage: [],
        recentActivity: [],
      };
    }

    // Narrow the optional value to a definite string for index filtering
    const ownerId = args.ownerId as string;

    const chats = await ctx.db
      .query('chats')
      .withIndex('by_owner', (q) => q.eq('ownerId', ownerId))
      .collect();

    const activeChats = chats.filter((chat) => chat.isActive);
    const archivedChats = chats.filter((chat) => !chat.isActive);

    // Get total message count across all chats
    const allMessages = await Promise.all(
      chats.map((chat) =>
        ctx.db
          .query('messages')
          .withIndex('by_chat', (q) => q.eq('chatId', chat._id))
          .collect()
      )
    );

    const totalMessages = allMessages.flat().length;
    const modelUsage = new Map<string, number>();

    chats.forEach((chat) => {
      modelUsage.set(chat.model, (modelUsage.get(chat.model) || 0) + 1);
    });

    return {
      totalChats: chats.length,
      activeChats: activeChats.length,
      archivedChats: archivedChats.length,
      totalMessages,
      modelUsage: Object.fromEntries(modelUsage),
      oldestChat:
        chats.length > 0 ? Math.min(...chats.map((c) => c.createdAt)) : null,
      newestChat:
        chats.length > 0 ? Math.max(...chats.map((c) => c.createdAt)) : null,
    };
  },
});
