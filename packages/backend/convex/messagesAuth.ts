/**
 * Authenticated message queries and mutations
 * These ensure users can only access messages from their own chats
 */

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getCurrentUser, requireAuth } from './authHelpers';

// Get messages for a chat (with ownership verification)
export const getMyMessages = query({
  args: {
    chatId: v.id('chats'),
    limit: v.optional(v.number()),
    before: v.optional(v.number()), // timestamp for pagination
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    // Verify the chat belongs to the user
    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.ownerId !== user._id) {
      return [];
    }

    const limit = Math.min(args.limit ?? 50, 100);

    let query = ctx.db
      .query('messages')
      .withIndex('by_chat', (q) => q.eq('chatId', args.chatId));

    if (args.before !== undefined) {
      query = query.filter((q) => q.lt(q.field('createdAt'), args.before ?? 0));
    }

    const messages = await query.order('desc').take(limit);

    // Return in chronological order (oldest first)
    return messages.reverse();
  },
});

// Create a new message (with ownership verification and subscription checking)
export const createMyMessage = mutation({
  args: {
    chatId: v.id('chats'),
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
              args: v.record(
                v.string(),
                v.union(v.string(), v.number(), v.boolean(), v.null())
              ),
              result: v.optional(
                v.object({
                  success: v.boolean(),
                  data: v.optional(
                    v.record(
                      v.string(),
                      v.union(v.string(), v.number(), v.boolean(), v.null())
                    )
                  ),
                  error: v.optional(v.string()),
                  executionTime: v.optional(v.number()),
                })
              ),
            })
          )
        ),
        reasoning: v.optional(v.string()),
        citations: v.optional(v.array(v.string())),
      })
    ),
    status: v.optional(v.string()),
    parentMessageId: v.optional(v.id('messages')),
  },
  handler: async (ctx, args) => {
    const { user } = await requireAuth(ctx);

    // Verify the chat belongs to the user
    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.ownerId !== user._id) {
      throw new Error('Chat not found or access denied');
    }

    // For user messages, check subscription limits
    if (args.role === 'user' && user.subscription) {
      // Check if user has reached message limits
      if (
        (user.subscription.messagesUsed ?? 0) >=
        (user.subscription.messagesLimit ?? 0)
      ) {
        throw new Error(
          'Message limit reached. Please upgrade your subscription.'
        );
      }

      // Check premium model limits if using a premium model
      const model = args.metadata?.model || chat.model;
      const premiumModels = ['gpt-4o', 'claude-3-5-sonnet', 'gemini-1.5-pro'];

      if (
        premiumModels.includes(model) &&
        (user.subscription.premiumMessagesUsed ?? 0) >=
          (user.subscription.premiumMessagesLimit ?? 0)
      ) {
        throw new Error(
          'Premium message limit reached. Please upgrade to Pro Plus.'
        );
      }

      // Update usage counts
      const updates: any = {
        'subscription.messagesUsed': (user.subscription.messagesUsed ?? 0) + 1,
      };

      if (premiumModels.includes(model)) {
        updates['subscription.premiumMessagesUsed'] =
          (user.subscription.premiumMessagesUsed ?? 0) + 1;
      }

      await ctx.db.patch(user._id, updates);
    }

    const now = Date.now();

    // Create the message
    const walletAddress = user.walletAddress;
    if (!walletAddress) {
      throw new Error('Wallet address not set for user');
    }

    const messageId = await ctx.db.insert('messages', {
      chatId: args.chatId,
      walletAddress,
      role: args.role,
      content: args.content,
      tokenCount: args.tokenCount ?? 0,
      embedding: args.embedding,
      metadata: args.metadata,
      status: args.status ?? 'sent',
      parentMessageId: args.parentMessageId,
      createdAt: now,
      updatedAt: now,
    });

    // Update chat's last message timestamp and counts
    const updateData: any = {
      lastMessageAt: now,
      updatedAt: now,
      messageCount: chat.messageCount + 1,
    };

    if (args.tokenCount) {
      updateData.totalTokens = chat.totalTokens + args.tokenCount;
    }

    await ctx.db.patch(args.chatId, updateData);

    return await ctx.db.get(messageId);
  },
});

// Delete a message (with ownership verification)
export const deleteMyMessage = mutation({
  args: {
    id: v.id('messages'),
  },
  handler: async (ctx, args) => {
    const { user } = await requireAuth(ctx);

    const message = await ctx.db.get(args.id);
    if (!message) {
      throw new Error('Message not found');
    }

    // Get the chat to verify ownership
    const chat = await ctx.db.get(message.chatId);
    if (!chat || chat.ownerId !== user._id) {
      throw new Error('Access denied');
    }

    await ctx.db.delete(args.id);

    // Update chat message count
    await ctx.db.patch(message.chatId, {
      messageCount: Math.max(0, chat.messageCount - 1),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Clear all messages in a chat (with ownership verification)
export const clearMyChatMessages = mutation({
  args: {
    chatId: v.id('chats'),
  },
  handler: async (ctx, args) => {
    const { user } = await requireAuth(ctx);

    // Verify the chat belongs to the user
    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.ownerId !== user._id) {
      throw new Error('Chat not found or access denied');
    }

    // Delete all messages in the chat
    const messages = await ctx.db
      .query('messages')
      .withIndex('by_chat', (q) => q.eq('chatId', args.chatId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Reset chat counters
    await ctx.db.patch(args.chatId, {
      messageCount: 0,
      totalTokens: 0,
      lastMessageAt: undefined,
      updatedAt: Date.now(),
    });

    return { success: true, deletedCount: messages.length };
  },
});

// Get message statistics for a chat (with ownership verification)
export const getMyChatMessageStats = query({
  args: {
    chatId: v.id('chats'),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    // Verify the chat belongs to the user
    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.ownerId !== user._id) {
      return null;
    }

    const messages = await ctx.db
      .query('messages')
      .withIndex('by_chat', (q) => q.eq('chatId', args.chatId))
      .collect();

    const userMessages = messages.filter((m) => m.role === 'user');
    const assistantMessages = messages.filter((m) => m.role === 'assistant');

    const totalTokens = messages.reduce(
      (sum, m) => sum + (m.tokenCount ?? 0),
      0
    );

    const modelUsage = new Map<string, number>();
    messages.forEach((m) => {
      const model = m.metadata?.model;
      if (model) {
        modelUsage.set(model, (modelUsage.get(model) || 0) + 1);
      }
    });

    return {
      totalMessages: messages.length,
      userMessages: userMessages.length,
      assistantMessages: assistantMessages.length,
      totalTokens,
      modelUsage: Object.fromEntries(modelUsage),
      firstMessage: messages.length > 0 ? messages[0].createdAt : null,
      lastMessage:
        messages.length > 0 ? messages[messages.length - 1].createdAt : null,
    };
  },
});
