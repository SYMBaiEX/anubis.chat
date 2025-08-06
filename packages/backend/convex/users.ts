import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import { mutation, query } from './_generated/server';

// Get user by wallet address
export const getByWallet = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_wallet', (q) => q.eq('walletAddress', args.walletAddress))
      .unique();
  },
});

// Create or update user profile
export const upsert = mutation({
  args: {
    walletAddress: v.string(),
    publicKey: v.string(),
    displayName: v.optional(v.string()),
    avatar: v.optional(v.string()),
    preferences: v.optional(
      v.object({
        theme: v.union(v.literal('light'), v.literal('dark')),
        aiModel: v.string(),
        notifications: v.boolean(),
        language: v.optional(v.string()),
        temperature: v.optional(v.number()),
        maxTokens: v.optional(v.number()),
        streamResponses: v.optional(v.boolean()),
        saveHistory: v.optional(v.boolean()),
        compactMode: v.optional(v.boolean()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_wallet', (q) => q.eq('walletAddress', args.walletAddress))
      .unique();

    const now = Date.now();

    if (existing) {
      // Update existing user
      await ctx.db.patch(existing._id, {
        displayName: args.displayName ?? existing.displayName,
        avatar: args.avatar ?? existing.avatar,
        preferences: args.preferences ?? existing.preferences,
        lastActiveAt: now,
        isActive: true,
      });

      return await ctx.db.get(existing._id);
    }
    // Create new user
    const userId = await ctx.db.insert('users', {
      walletAddress: args.walletAddress,
      publicKey: args.publicKey,
      displayName: args.displayName,
      avatar: args.avatar,
      preferences: args.preferences ?? {
        theme: 'dark',
        aiModel: 'gpt-4o',
        notifications: true,
      },
      subscription: {
        tier: 'free',
        tokensUsed: 0,
        tokensLimit: 10_000,
        features: ['basic_chat', 'document_upload'],
      },
      createdAt: now,
      lastActiveAt: now,
      isActive: true,
    });

    return await ctx.db.get(userId);
  },
});

// Update user preferences
export const updatePreferences = mutation({
  args: {
    walletAddress: v.string(),
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
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_wallet', (q) => q.eq('walletAddress', args.walletAddress))
      .unique();

    if (!user) {
      throw new Error('User not found');
    }

    await ctx.db.patch(user._id, {
      preferences: {
        ...user.preferences,
        ...args.preferences,
      },
      lastActiveAt: Date.now(),
    });

    return await ctx.db.get(user._id);
  },
});

// Update user profile
export const updateProfile = mutation({
  args: {
    walletAddress: v.string(),
    displayName: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_wallet', (q) => q.eq('walletAddress', args.walletAddress))
      .unique();

    if (!user) {
      throw new Error('User not found');
    }

    await ctx.db.patch(user._id, {
      displayName: args.displayName ?? user.displayName,
      avatar: args.avatar ?? user.avatar,
      lastActiveAt: Date.now(),
    });

    return await ctx.db.get(user._id);
  },
});

// Get user usage statistics
export const getUsage = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_wallet', (q) => q.eq('walletAddress', args.walletAddress))
      .unique();

    if (!user) {
      return null;
    }

    // Get usage for current month
    const now = new Date();
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    ).getTime();

    const usage = await ctx.db
      .query('usage')
      .withIndex('by_user', (q) =>
        q.eq('userId', args.walletAddress).gte('createdAt', startOfMonth)
      )
      .collect();

    const totalTokens = usage.reduce(
      (sum, record) => sum + record.tokensUsed,
      0
    );
    const totalCost = usage.reduce(
      (sum, record) => sum + (record.cost || 0),
      0
    );

    return {
      user: {
        walletAddress: user.walletAddress,
        displayName: user.displayName,
        subscription: user.subscription,
        createdAt: user.createdAt,
        lastActiveAt: user.lastActiveAt,
      },
      usage: {
        currentMonth: {
          tokens: totalTokens,
          cost: totalCost,
          requests: usage.length,
        },
        limit: user.subscription.tokensLimit,
        remaining: Math.max(
          0,
          user.subscription.tokensLimit - user.subscription.tokensUsed
        ),
      },
    };
  },
});

// Track token usage
export const trackUsage = mutation({
  args: {
    userId: v.string(),
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
  },
  handler: async (ctx, args) => {
    // Record usage
    const usageId = await ctx.db.insert('usage', {
      userId: args.userId,
      operation: args.operation,
      model: args.model,
      tokensUsed: args.tokensUsed,
      cost: args.cost,
      duration: args.duration,
      success: args.success,
      createdAt: Date.now(),
      metadata: args.metadata,
    });

    // Update user's token count
    const user = await ctx.db
      .query('users')
      .withIndex('by_wallet', (q) => q.eq('walletAddress', args.userId))
      .unique();

    if (user) {
      await ctx.db.patch(user._id, {
        subscription: {
          ...user.subscription,
          tokensUsed: user.subscription.tokensUsed + args.tokensUsed,
        },
        lastActiveAt: Date.now(),
      });
    }

    return await ctx.db.get(usageId);
  },
});

// Deactivate user account
export const deactivate = mutation({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_wallet', (q) => q.eq('walletAddress', args.walletAddress))
      .unique();

    if (!user) {
      throw new Error('User not found');
    }

    await ctx.db.patch(user._id, {
      isActive: false,
      lastActiveAt: Date.now(),
    });

    return { success: true };
  },
});
