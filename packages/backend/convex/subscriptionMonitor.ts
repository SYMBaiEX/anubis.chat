/**
 * Subscription monitoring and automated actions for ANUBIS Chat
 * Handles Web3-specific subscription lifecycle: expiry detection, renewals, and free tier downgrades
 */

import { query, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';

/**
 * Query to check users who need renewal notifications or automatic downgrade
 * Returns users whose subscriptions expire within the notification window
 */
export const getUsersNeedingNotification = query({
  args: {
    daysAhead: v.optional(v.number()), // How many days ahead to check (default: 7)
  },
  handler: async (ctx, args) => {
    const daysAhead = args.daysAhead ?? 7;
    const now = Date.now();
    const notificationThreshold = now + (daysAhead * 24 * 60 * 60 * 1000);

    // Get all users with active paid subscriptions that expire within the notification window
    const usersNeedingNotification: any[] = [];
    
    // Process users in batches to avoid performance issues
    const BATCH_SIZE = 50;
    let hasMore = true;
    let lastId: Id<'users'> | null = null;

    while (hasMore) {
      let query = ctx.db
        .query('users')
        .order('asc');

      if (lastId) {
        query = query.filter((q) => q.gt(q.field('_id'), lastId!));
      }

      const users = await query.take(BATCH_SIZE);

      if (users.length === 0) {
        hasMore = false;
        break;
      }

      for (const user of users) {
        if (user.subscription?.tier && 
            user.subscription.tier !== 'free' &&
            user.subscription.currentPeriodEnd &&
            user.subscription.currentPeriodEnd <= notificationThreshold &&
            user.subscription.currentPeriodEnd > now) {
          
          const daysRemaining = Math.ceil((user.subscription.currentPeriodEnd - now) / (24 * 60 * 60 * 1000));
          
          usersNeedingNotification.push({
            userId: user._id,
            tier: user.subscription.tier,
            billingPeriod: user.subscription.billingCycle || 'monthly',
            daysRemaining,
            currentPeriodEnd: user.subscription.currentPeriodEnd,
            needsUrgentNotification: daysRemaining <= 3,
            needsWarningNotification: daysRemaining <= 7,
          });
        }
      }

      lastId = users[users.length - 1]._id;

      if (users.length < BATCH_SIZE) {
        hasMore = false;
      }
    }

    return usersNeedingNotification;
  },
});

/**
 * Query to check subscriptions that have expired and need downgrade
 */
export const getExpiredSubscriptions = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expiredSubscriptions: any[] = [];

    // Process users in batches
    const BATCH_SIZE = 50;
    let hasMore = true;
    let lastId: Id<'users'> | null = null;

    while (hasMore) {
      let query = ctx.db
        .query('users')
        .order('asc');

      if (lastId) {
        query = query.filter((q) => q.gt(q.field('_id'), lastId!));
      }

      const users = await query.take(BATCH_SIZE);

      if (users.length === 0) {
        hasMore = false;
        break;
      }

      for (const user of users) {
        if (user.subscription?.tier && 
            user.subscription.tier !== 'free' &&
            user.subscription.currentPeriodEnd &&
            user.subscription.currentPeriodEnd < now) {
          
          const daysExpired = Math.ceil((now - user.subscription.currentPeriodEnd) / (24 * 60 * 60 * 1000));
          
          expiredSubscriptions.push({
            userId: user._id,
            tier: user.subscription.tier,
            billingPeriod: user.subscription.billingCycle || 'monthly',
            daysExpired,
            currentPeriodEnd: user.subscription.currentPeriodEnd,
          });
        }
      }

      lastId = users[users.length - 1]._id;

      if (users.length < BATCH_SIZE) {
        hasMore = false;
      }
    }

    return expiredSubscriptions;
  },
});

/**
 * Internal mutation to downgrade expired subscriptions to free tier
 * Processes in batches to avoid OCC failures
 */
export const downgradeExpiredSubscriptions = internalMutation({
  args: {
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 10;
    const now = Date.now();

    let processedCount = 0;
    let hasMore = true;
    let lastId: Id<'users'> | null = null;

    while (hasMore) {
      // Get batch of users with expired subscriptions
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

      // Process each user with expired subscription
      for (const user of users) {
        if (user.subscription?.tier && 
            user.subscription.tier !== 'free' &&
            user.subscription.currentPeriodEnd &&
            user.subscription.currentPeriodEnd < now) {
          
          // Downgrade to free tier
          const updatedSubscription = {
            ...user.subscription,
            tier: 'free' as const,
            billingCycle: 'monthly' as const, // Reset to monthly for consistency
            currentPeriodStart: now,
            currentPeriodEnd: now + (30 * 24 * 60 * 60 * 1000), // 30 days from now
            messagesUsed: 0,
            premiumMessagesUsed: 0,
          };

          await ctx.db.patch(user._id, {
            subscription: updatedSubscription,
            updatedAt: now,
          });

          processedCount++;
        }
      }

      lastId = users[users.length - 1]._id;

      // If we got fewer than the batch size, we're done
      if (users.length < batchSize) {
        hasMore = false;
      }
    }

    return {
      success: true,
      processedCount,
      message: `Downgraded ${processedCount} expired subscriptions to free tier`,
    };
  },
});

/**
 * Query to get user's current subscription status for notifications
 */
export const getUserSubscriptionStatus = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user?.subscription) {
      return null;
    }

    const subscription = user.subscription;
    const now = Date.now();
    const daysRemaining = subscription.currentPeriodEnd ? 
      Math.ceil((subscription.currentPeriodEnd - now) / (24 * 60 * 60 * 1000)) : 0;

    return {
      tier: subscription.tier,
      billingPeriod: subscription.billingCycle || 'monthly',
      currentPeriodEnd: subscription.currentPeriodEnd || now,
      daysRemaining,
      isActive: subscription.currentPeriodEnd ? subscription.currentPeriodEnd > now : false,
      isExpired: subscription.currentPeriodEnd ? subscription.currentPeriodEnd <= now : true,
      needsRenewalNotification: daysRemaining <= 7 && daysRemaining > 0,
      needsUrgentRenewal: daysRemaining <= 3 && daysRemaining > 0,
      needsExpiryNotification: subscription.currentPeriodEnd ? 
        subscription.currentPeriodEnd <= now && subscription.tier !== 'free' : false,
    };
  },
});

/**
 * Helper function to perform subscription maintenance logic
 */
async function performMaintenanceLogic(ctx: any, batchSize: number) {
  const now = Date.now();
  const expiredUsers: any[] = [];
  let processedCount = 0;
  let hasMore = true;

  while (hasMore) {
    // Query for users with expired subscriptions
    const users = await ctx.db
      .query('users')
      .filter((q: any) => 
        q.and(
          q.neq(q.field('subscription'), undefined),
          q.neq(q.field('subscription.tier'), 'free'),
          q.lt(q.field('subscription.expiresAt'), now)
        )
      )
      .take(batchSize);

    if (users.length === 0) {
      hasMore = false;
      break;
    }

    if (users.length < batchSize) {
      hasMore = false;
    }

    for (const user of users) {
      // Downgrade to free tier
      const updatedSubscription = {
        ...user.subscription,
        tier: 'free' as const,
        status: 'inactive' as const,
        downgradedAt: now,
      };

      await ctx.db.patch(user._id, {
        subscription: updatedSubscription,
        updatedAt: now,
      });

      expiredUsers.push(user._id);
      processedCount++;
    }
  }

  return {
    success: true,
    processedCount,
    message: `Downgraded ${processedCount} expired subscriptions to free tier`,
  };
}

/**
 * Internal mutation to check and process all subscription actions
 * This can be called by a cron job or scheduled function
 */
export const processSubscriptionMaintenance = internalMutation({
  args: {},
  handler: async (ctx) => {
    try {
      const maintenanceResult = await performMaintenanceLogic(ctx, 10);

      return {
        success: true,
        downgradedSubscriptions: maintenanceResult.processedCount,
        message: 'Subscription maintenance completed successfully',
      };
    } catch (error) {
      console.error('Subscription maintenance failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Subscription maintenance failed',
      };
    }
  },
});