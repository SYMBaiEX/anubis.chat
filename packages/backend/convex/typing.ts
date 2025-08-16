import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { createModuleLogger } from './utils/logger';

const logger = createModuleLogger('typing');

// Set typing status with conflict resolution
export const setTyping = mutation({
  args: {
    chatId: v.id('chats'),
    walletAddress: v.string(),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    try {
      // Find existing typing indicator for this user in this chat
      const existingTyping = await ctx.db
        .query('typingIndicators')
        .withIndex('by_chat_wallet', (q) =>
          q.eq('chatId', args.chatId).eq('walletAddress', args.walletAddress)
        )
        .first();

      if (args.isTyping) {
        if (existingTyping) {
          // Update existing indicator with retry logic
          try {
            await ctx.db.patch(existingTyping._id, {
              timestamp: now,
              isActive: true,
            });
          } catch (error) {
            // Handle write conflict by recreating the record
            logger.debug(
              'Write conflict updating typing indicator, recreating',
              {
                chatId: args.chatId,
                walletAddress: args.walletAddress,
                error: String(error),
              }
            );

            // Delete and recreate to avoid conflicts
            await ctx.db.delete(existingTyping._id);
            await ctx.db.insert('typingIndicators', {
              chatId: args.chatId,
              walletAddress: args.walletAddress,
              timestamp: now,
              isActive: true,
            });
          }
        } else {
          // Create new typing indicator
          await ctx.db.insert('typingIndicators', {
            chatId: args.chatId,
            walletAddress: args.walletAddress,
            timestamp: now,
            isActive: true,
          });
        }
      } else {
        // Remove typing indicator
        if (existingTyping) {
          try {
            await ctx.db.delete(existingTyping._id);
          } catch (error) {
            // Ignore delete conflicts - record might already be gone
            logger.debug('Write conflict deleting typing indicator, ignoring', {
              chatId: args.chatId,
              walletAddress: args.walletAddress,
              error: String(error),
            });
          }
        }
      }

      // Clean up old typing indicators (older than 10 seconds) with batch processing
      const cutoffTime = now - 10_000;
      const staleIndicators = await ctx.db
        .query('typingIndicators')
        .withIndex('by_timestamp', (q) => q.lt('timestamp', cutoffTime))
        .take(50); // Limit cleanup to prevent long operations

      // Delete stale indicators individually to handle conflicts
      for (const indicator of staleIndicators) {
        try {
          await ctx.db.delete(indicator._id);
        } catch (error) {
          // Ignore delete conflicts during cleanup
          logger.debug('Conflict during typing indicator cleanup, ignoring', {
            indicatorId: indicator._id,
            error: String(error),
          });
        }
      }

      return { success: true };
    } catch (error) {
      logger.error('Typing indicator operation failed', {
        chatId: args.chatId,
        walletAddress: args.walletAddress,
        isTyping: args.isTyping,
        error: String(error),
      });

      // Return success to prevent frontend errors - typing indicators are non-critical
      return { success: true, warning: 'Partial failure in typing indicator' };
    }
  },
});

// Get users currently typing in a chat
export const getTypingUsers = query({
  args: {
    chatId: v.id('chats'),
    excludeWallet: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const validTime = now - 8000; // 8 seconds timeout for UI responsiveness

    try {
      // Get all active typing indicators for this chat
      const typingIndicators = await ctx.db
        .query('typingIndicators')
        .withIndex('by_chat', (q) => q.eq('chatId', args.chatId))
        .filter((q) =>
          q.and(
            q.eq(q.field('isActive'), true),
            q.gt(q.field('timestamp'), validTime)
          )
        )
        .collect();

      // Extract wallet addresses, excluding the requesting user
      const typingUsers = typingIndicators
        .filter((indicator) => indicator.walletAddress !== args.excludeWallet)
        .map((indicator) => indicator.walletAddress);

      return typingUsers;
    } catch (error) {
      logger.error('Failed to get typing users', {
        chatId: args.chatId,
        error: String(error),
      });

      // Return empty array on error to prevent UI issues
      return [];
    }
  },
});
