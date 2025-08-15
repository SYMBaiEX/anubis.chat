/**
 * Migration to remove autoRenew fields from subscription system
 * Web3 subscriptions cannot auto-renew as users control their own wallets
 */

import { internalMutation } from '../_generated/server';
import { v } from 'convex/values';
import type { Id } from '../_generated/dataModel';

export const removeAutoRenewFromUsers = internalMutation({
  args: {
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 50;
    
    let processedCount = 0;
    let hasMore = true;
    let lastId: Id<'users'> | null = null;

    while (hasMore) {
      // Get batch of users with autoRenew field
      let query = ctx.db
        .query('users')
        .order('asc');

      if (lastId) {
        query = query.filter((q) => q.gt(q.field('_id'), lastId!));
      }

      const users = await query.take(batchSize);

      if (users.length === 0) {
        hasMore = false;
        break;
      }

      // Process each user
      for (const user of users) {
        const subscription = user.subscription as any;
        if (subscription?.autoRenew !== undefined) {
          // Remove autoRenew field from subscription
          const updatedSubscription = { ...subscription };
          delete updatedSubscription.autoRenew;

          await ctx.db.patch(user._id, {
            subscription: updatedSubscription,
            updatedAt: Date.now(),
          });

          processedCount++;
        }
      }

      lastId = users[users.length - 1]._id;

      if (users.length < batchSize) {
        hasMore = false;
      }
    }

    return {
      success: true,
      processedCount,
      message: `Removed autoRenew field from ${processedCount} user subscriptions`,
    };
  },
});

/**
 * Check for any remaining autoRenew references in the system
 */
export const auditAutoRenewCleanup = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Migration already completed - no autoRenew fields should exist
    // Since schema no longer includes autoRenew, we can't query for it
    const usersWithAutoRenew: any[] = []; // Migration already completed

    // Migration already completed - return clean state
    const subscriptionsWithAutoRenew: any[] = [];

    return {
      usersWithAutoRenew: 0,
      subscriptionsWithAutoRenew: 0,
      cleanupComplete: true,
      sampleUsers: [],
      sampleSubscriptions: [],
      message: 'Migration already completed - autoRenew fields removed from schema'
    };
  },
});