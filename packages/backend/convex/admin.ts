import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// System health check
export const healthCheck = query({
  handler: async (ctx) => {
    const now = Date.now();

    // Get counts for all tables
    const [
      users,
      documents,
      chats,
      messages,
      usage,
      blacklistedTokens,
      nonces,
    ] = await Promise.all([
      ctx.db.query('users').collect(),
      ctx.db.query('documents').collect(),
      ctx.db.query('chats').collect(),
      ctx.db.query('messages').collect(),
      ctx.db.query('usage').collect(),
      ctx.db.query('blacklistedTokens').collect(),
      ctx.db.query('nonces').collect(),
    ]);

    // Calculate active users (last 24 hours)
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const activeUsers = users.filter((user) => (user.lastActiveAt ?? 0) > dayAgo);

    // Calculate storage usage
    const totalDocumentSize = documents.reduce(
      (sum, doc) => sum + (doc.metadata?.characterCount || doc.content.length),
      0
    );

    // Calculate token usage (last 30 days)
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
    const recentUsage = usage.filter((u) => u.createdAt > monthAgo);
    const totalTokensUsed = recentUsage.reduce(
      (sum, u) => sum + u.tokensUsed,
      0
    );

    return {
      timestamp: now,
      status: 'healthy',
      tables: {
        users: {
          total: users.length,
          active: activeUsers.length,
          inactive: users.length - activeUsers.length,
        },
        documents: {
          total: documents.length,
          totalSizeBytes: totalDocumentSize,
          averageSizeBytes: totalDocumentSize / Math.max(documents.length, 1),
        },
        chats: {
          total: chats.length,
          active: chats.filter((c) => c.isActive).length,
          archived: chats.filter((c) => !c.isActive).length,
        },
        messages: {
          total: messages.length,
          averagePerChat: messages.length / Math.max(chats.length, 1),
        },
        usage: {
          records: usage.length,
          tokensLast30Days: totalTokensUsed,
          averageTokensPerUser:
            totalTokensUsed / Math.max(activeUsers.length, 1),
        },
        auth: {
          blacklistedTokens: blacklistedTokens.length,
          activeNonces: nonces.length,
        },
      },
    };
  },
});

// Cleanup expired data
export const cleanupExpiredData = mutation({
  handler: async (ctx) => {
    const now = Date.now();

    // Clean up expired blacklisted tokens
    const expiredTokens = await ctx.db
      .query('blacklistedTokens')
      .withIndex('by_expires', (q) => q.lt('expiresAt', now))
      .collect();

    let tokensDeleted = 0;
    for (const token of expiredTokens) {
      await ctx.db.delete(token._id);
      tokensDeleted++;
    }

    // Clean up expired nonces
    const expiredNonces = await ctx.db
      .query('nonces')
      .withIndex('by_expires', (q) => q.lt('expiresAt', now))
      .collect();

    let noncesDeleted = 0;
    for (const nonce of expiredNonces) {
      await ctx.db.delete(nonce._id);
      noncesDeleted++;
    }

    // Clean up old usage records (keep last 90 days)
    const oldUsageThreshold = now - 90 * 24 * 60 * 60 * 1000;
    const oldUsageRecords = await ctx.db
      .query('usage')
      .filter((q) => q.lt(q.field('createdAt'), oldUsageThreshold))
      .collect();

    let usageDeleted = 0;
    for (const record of oldUsageRecords) {
      await ctx.db.delete(record._id);
      usageDeleted++;
    }

    return {
      cleaned: {
        expiredTokens: tokensDeleted,
        expiredNonces: noncesDeleted,
        oldUsageRecords: usageDeleted,
      },
      timestamp: now,
    };
  },
});

// Get system statistics
export const getSystemStats = query({
  handler: async (ctx) => {
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

    const [users, documents, chats, messages, usage] = await Promise.all([
      ctx.db.query('users').collect(),
      ctx.db.query('documents').collect(),
      ctx.db.query('chats').collect(),
      ctx.db.query('messages').collect(),
      ctx.db.query('usage').collect(),
    ]);

    // User activity
    const usersLast24h = users.filter((u) => u.lastActiveAt > dayAgo).length;
    const usersLast7d = users.filter((u) => u.lastActiveAt > weekAgo).length;
    const usersLast30d = users.filter((u) => u.lastActiveAt > monthAgo).length;

    // Content creation
    const docsLast24h = documents.filter((d) => d.createdAt > dayAgo).length;
    const docsLast7d = documents.filter((d) => d.createdAt > weekAgo).length;
    const docsLast30d = documents.filter((d) => d.createdAt > monthAgo).length;

    // Chat activity
    const chatsLast24h = chats.filter((c) => c.createdAt > dayAgo).length;
    const chatsLast7d = chats.filter((c) => c.createdAt > weekAgo).length;
    const chatsLast30d = chats.filter((c) => c.createdAt > monthAgo).length;

    // Message activity
    const messagesLast24h = messages.filter((m) => m.createdAt > dayAgo).length;
    const messagesLast7d = messages.filter((m) => m.createdAt > weekAgo).length;
    const messagesLast30d = messages.filter(
      (m) => m.createdAt > monthAgo
    ).length;

    // Token usage
    const usageLast24h = usage.filter((u) => u.createdAt > dayAgo);
    const usageLast7d = usage.filter((u) => u.createdAt > weekAgo);
    const usageLast30d = usage.filter((u) => u.createdAt > monthAgo);

    const tokensLast24h = usageLast24h.reduce(
      (sum, u) => sum + u.tokensUsed,
      0
    );
    const tokensLast7d = usageLast7d.reduce((sum, u) => sum + u.tokensUsed, 0);
    const tokensLast30d = usageLast30d.reduce(
      (sum, u) => sum + u.tokensUsed,
      0
    );

    // Model usage distribution
    const modelUsage = usage.reduce(
      (acc, u) => {
        acc[u.model] = (acc[u.model] || 0) + u.tokensUsed;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      timestamp: now,
      users: {
        total: users.length,
        last24h: usersLast24h,
        last7d: usersLast7d,
        last30d: usersLast30d,
      },
      documents: {
        total: documents.length,
        last24h: docsLast24h,
        last7d: docsLast7d,
        last30d: docsLast30d,
      },
      chats: {
        total: chats.length,
        active: chats.filter((c) => c.isActive).length,
        last24h: chatsLast24h,
        last7d: chatsLast7d,
        last30d: chatsLast30d,
      },
      messages: {
        total: messages.length,
        last24h: messagesLast24h,
        last7d: messagesLast7d,
        last30d: messagesLast30d,
      },
      tokenUsage: {
        total: usage.reduce((sum, u) => sum + u.tokensUsed, 0),
        last24h: tokensLast24h,
        last7d: tokensLast7d,
        last30d: tokensLast30d,
        byModel: modelUsage,
      },
    };
  },
});

// Emergency functions for data management

// Deactivate all user accounts (emergency use)
export const emergencyDeactivateAllUsers = mutation({
  args: { confirmationCode: v.string() },
  handler: async (ctx, args) => {
    // Simple security check - in production this would be more sophisticated
    if (args.confirmationCode !== 'EMERGENCY_DEACTIVATE_ALL') {
      throw new Error('Invalid confirmation code');
    }

    const users = await ctx.db.query('users').collect();
    let deactivated = 0;

    for (const user of users) {
      if (user.isActive) {
        await ctx.db.patch(user._id, { isActive: false });
        deactivated++;
      }
    }

    return { deactivated, timestamp: Date.now() };
  },
});

// Archive all inactive chats
export const archiveInactiveChats = mutation({
  args: { inactiveDays: v.number() },
  handler: async (ctx, args) => {
    const threshold = Date.now() - args.inactiveDays * 24 * 60 * 60 * 1000;

    const inactiveChats = await ctx.db
      .query('chats')
      .filter((q) =>
        q.and(
          q.eq(q.field('isActive'), true),
          q.or(
            q.lt(q.field('lastMessageAt'), threshold),
            q.and(
              q.eq(q.field('lastMessageAt'), undefined),
              q.lt(q.field('createdAt'), threshold)
            )
          )
        )
      )
      .collect();

    let archived = 0;
    for (const chat of inactiveChats) {
      await ctx.db.patch(chat._id, { isActive: false });
      archived++;
    }

    return { archived, threshold, timestamp: Date.now() };
  },
});
