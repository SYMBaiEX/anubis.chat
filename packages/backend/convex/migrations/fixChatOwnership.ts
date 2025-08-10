/**
 * Migration to fix chat ownership - convert from wallet addresses to user IDs
 * This ensures proper data isolation when users change wallets or use different auth methods
 */

import { v } from 'convex/values';
import { internal } from '../_generated/api';
import { internalMutation } from '../_generated/server';

export const migrateChatsToUserIds = internalMutation({
  args: {
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 100;
    let processed = 0;
    let updated = 0;
    let errors = 0;

    // Get all chats that need migration
    const chats = await ctx.db.query('chats').take(batchSize);

    for (const chat of chats) {
      processed++;

      try {
        // Check if ownerId is already a user ID (starts with specific pattern)
        // Convex IDs typically have a specific format
        if (chat.ownerId.includes('|') || chat.ownerId.length > 50) {
          // This looks like it might already be a user ID, skip
          continue;
        }

        // Find the user by wallet address
        const user = await ctx.db
          .query('users')
          .withIndex('by_wallet', (q) => q.eq('walletAddress', chat.ownerId))
          .first();

        if (user) {
          // Update the chat to use the actual user ID
          await ctx.db.patch(chat._id, {
            ownerId: user._id,
            updatedAt: Date.now(),
          });
          updated++;
        } else {
          console.warn(`No user found for wallet address: ${chat.ownerId}`);
          errors++;
        }
      } catch (error) {
        console.error(`Error migrating chat ${chat._id}:`, error);
        errors++;
      }
    }

    return {
      processed,
      updated,
      errors,
      hasMore: chats.length === batchSize,
    };
  },
});

export const runFullMigration = internalMutation({
  args: {},
  handler: async (ctx) => {
    let totalProcessed = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    let hasMore = true;

    while (hasMore) {
      const result = await ctx.runMutation(
        internal.migrations.fixChatOwnership.migrateChatsToUserIds,
        { batchSize: 100 }
      );
      totalProcessed += result.processed;
      totalUpdated += result.updated;
      totalErrors += result.errors;
      hasMore = result.hasMore;

      // Add a small delay to avoid overwhelming the database
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log('Migration completed:', {
      totalProcessed,
      totalUpdated,
      totalErrors,
    });

    return {
      totalProcessed,
      totalUpdated,
      totalErrors,
    };
  },
});
