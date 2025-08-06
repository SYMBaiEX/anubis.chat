import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import { mutation, query } from './_generated/server';

// Get messages by chat ID
export const getByChatId = query({
  args: {
    chatId: v.id('chats'),
    limit: v.optional(v.number()),
    before: v.optional(v.number()), // timestamp for pagination
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 100); // Max 100 messages per request

    let query = ctx.db
      .query('messages')
      .withIndex('by_chat', (q) => q.eq('chatId', args.chatId));

    if (args.before !== undefined) {
      query = query.filter((q) => q.lt(q.field('createdAt'), args.before!));
    }

    const messages = await query.order('desc').take(limit);

    // Return in chronological order (oldest first)
    return messages.reverse();
  },
});

// Get single message by ID
export const getById = query({
  args: { id: v.id('messages') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create new message
export const create = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const messageId = await ctx.db.insert('messages', {
      chatId: args.chatId,
      role: args.role,
      content: args.content,
      metadata: args.metadata,
      createdAt: now,
    });

    // Update chat's last message timestamp
    await ctx.db.patch(args.chatId, {
      lastMessageAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(messageId);
  },
});

// Update message content (for editing)
export const update = mutation({
  args: {
    id: v.id('messages'),
    content: v.string(),
    metadata: v.optional(
      v.object({
        model: v.optional(v.string()),
        tokensUsed: v.optional(v.number()),
        finishReason: v.optional(v.string()),
        processingTime: v.optional(v.number()),
        citations: v.optional(v.array(v.string())),
      })
    ),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.id);

    if (!message) {
      throw new Error('Message not found');
    }

    await ctx.db.patch(args.id, {
      content: args.content,
      metadata: args.metadata || message.metadata,
    });

    return await ctx.db.get(args.id);
  },
});

// Delete message
export const remove = mutation({
  args: { id: v.id('messages') },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.id);

    if (!message) {
      throw new Error('Message not found');
    }

    await ctx.db.delete(args.id);

    return { success: true, messageId: args.id };
  },
});

// Get messages with citations (for RAG context)
export const getWithCitations = query({
  args: {
    chatId: v.id('chats'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 50);

    const messages = await ctx.db
      .query('messages')
      .withIndex('by_chat', (q) => q.eq('chatId', args.chatId))
      .filter((q) => q.neq(q.field('metadata.citations'), undefined))
      .order('desc')
      .take(limit);

    // Get document details for citations
    const messagesWithDocuments = await Promise.all(
      messages.map(async (message) => {
        if (!message.metadata?.citations) {
          return { ...message, documents: [] };
        }

        const documents = await Promise.all(
          message.metadata.citations.map(async (docId) => {
            try {
              return await ctx.db.get(docId as Id<'documents'>);
            } catch {
              return null; // Document might have been deleted
            }
          })
        );

        return {
          ...message,
          documents: documents.filter((doc) => doc !== null),
        };
      })
    );

    return messagesWithDocuments.reverse(); // Chronological order
  },
});

// Get message statistics for a chat
export const getStats = query({
  args: { chatId: v.id('chats') },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query('messages')
      .withIndex('by_chat', (q) => q.eq('chatId', args.chatId))
      .collect();

    const userMessages = messages.filter((m) => m.role === 'user');
    const assistantMessages = messages.filter((m) => m.role === 'assistant');
    const systemMessages = messages.filter((m) => m.role === 'system');

    const totalTokens = messages.reduce(
      (sum, msg) => sum + (msg.metadata?.tokensUsed || 0),
      0
    );

    const totalProcessingTime = assistantMessages.reduce(
      (sum, msg) => sum + (msg.metadata?.processingTime || 0),
      0
    );

    const modelsUsed = new Set(
      assistantMessages
        .map((msg) => msg.metadata?.model)
        .filter((model) => model !== undefined)
    );

    const messagesWithCitations = messages.filter(
      (msg) => msg.metadata?.citations && msg.metadata.citations.length > 0
    );

    return {
      totalMessages: messages.length,
      userMessages: userMessages.length,
      assistantMessages: assistantMessages.length,
      systemMessages: systemMessages.length,
      totalTokens,
      averageTokensPerMessage:
        totalTokens / Math.max(assistantMessages.length, 1),
      totalProcessingTime,
      averageProcessingTime:
        totalProcessingTime / Math.max(assistantMessages.length, 1),
      modelsUsed: Array.from(modelsUsed),
      messagesWithCitations: messagesWithCitations.length,
      firstMessage:
        messages.length > 0
          ? Math.min(...messages.map((m) => m.createdAt))
          : null,
      lastMessage:
        messages.length > 0
          ? Math.max(...messages.map((m) => m.createdAt))
          : null,
    };
  },
});

// Get recent messages across all chats (for activity feed)
export const getRecent = query({
  args: {
    limit: v.optional(v.number()),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 50);

    // First get user's chats
    const userChats = await ctx.db
      .query('chats')
      .withIndex('by_owner', (q) => q.eq('ownerId', args.userId))
      .collect();

    const chatIds = userChats.map((chat) => chat._id);

    // Get recent messages from user's chats
    const recentMessages = await ctx.db
      .query('messages')
      .withIndex('by_timestamp')
      .order('desc')
      .filter((q) => {
        // Check if message belongs to user's chats
        return q.or(
          ...chatIds.map((chatId) => q.eq(q.field('chatId'), chatId))
        );
      })
      .take(limit);

    // Add chat titles to messages
    const messagesWithChatInfo = await Promise.all(
      recentMessages.map(async (message) => {
        const chat = userChats.find((c) => c._id === message.chatId);
        return {
          ...message,
          chatTitle: chat?.title || 'Unknown Chat',
          chatModel: chat?.model || 'unknown',
        };
      })
    );

    return messagesWithChatInfo;
  },
});
