import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getCurrentUser, requireAuth } from './authHelpers';

// Subscription tier configurations
const SUBSCRIPTION_TIERS = {
  free: {
    messagesLimit: 50,
    premiumMessagesLimit: 0,
    priceSol: 0,
    features: ['basic_chat', 'limited_models'],
    availableModels: ['gpt-4o-mini', 'deepseek-chat'],
  },
  pro: {
    messagesLimit: 1500,
    premiumMessagesLimit: 100,
    priceSol: 0.05,
    features: [
      'unlimited_standard_models',
      'premium_model_access',
      'document_upload',
      'basic_agents',
      'chat_history',
    ],
    availableModels: ['gpt-4o-mini', 'deepseek-chat', 'deepseek-r1', 'gpt-4o', 'claude-3.5-sonnet'],
  },
  pro_plus: {
    messagesLimit: 3000,
    premiumMessagesLimit: 300,
    priceSol: 0.1,
    features: [
      'unlimited_standard_models',
      'enhanced_premium_access',
      'large_document_upload',
      'advanced_agents',
      'api_access',
      'priority_support',
      'unlimited_chats',
    ],
    availableModels: ['gpt-4o-mini', 'deepseek-chat', 'deepseek-r1', 'gpt-4o', 'claude-3.5-sonnet'],
  },
};

// Model cost configurations (for internal tracking)
const MODEL_COSTS = {
  'gpt-4o': { category: 'premium', costPerMessage: 0.0175 },
  'gpt-4o-mini': { category: 'standard', costPerMessage: 0.000675 },
  'claude-3.5-sonnet': { category: 'premium', costPerMessage: 0.0165 },
  'deepseek-chat': { category: 'standard', costPerMessage: 0.001235 },
  'deepseek-r1': { category: 'standard', costPerMessage: 0.002325 },
};

// Check if user can use a specific model
export const canUseModel = query({
  args: {
    model: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      return { allowed: false, reason: 'Authentication required' };
    }

    // Admins have unlimited access to all models
    if (user.role && user.role !== 'user') {
      return {
        allowed: true,
        isAdmin: true,
        remaining: Infinity,
        premiumRemaining: Infinity,
      };
    }

    const tierConfig = SUBSCRIPTION_TIERS[user.subscription.tier];
    const modelConfig = MODEL_COSTS[args.model as keyof typeof MODEL_COSTS];

    // Check if model is available for tier
    if (!tierConfig.availableModels.includes(args.model)) {
      return {
        allowed: false,
        reason: 'Model not available for your subscription tier',
        suggestedUpgrade: user.subscription.tier === 'free' ? 'pro' : 'pro_plus',
      };
    }

    // Check message limits
    if (modelConfig?.category === 'premium') {
      if (user.subscription.premiumMessagesUsed >= user.subscription.premiumMessagesLimit) {
        return {
          allowed: false,
          reason: 'Premium message limit reached',
          remaining: 0,
          suggestedAction: 'upgrade',
        };
      }
    }

    // Check total message limit
    if (user.subscription.messagesUsed >= user.subscription.messagesLimit) {
      return {
        allowed: false,
        reason: 'Monthly message limit reached',
        remaining: 0,
        suggestedAction: 'upgrade',
      };
    }

    return {
      allowed: true,
      remaining: user.subscription.messagesLimit - user.subscription.messagesUsed,
      premiumRemaining: modelConfig?.category === 'premium'
        ? user.subscription.premiumMessagesLimit - user.subscription.premiumMessagesUsed
        : undefined,
    };
  },
});

// Track message usage by wallet address (for HTTP actions)
export const trackMessageUsageByWallet = mutation({
  args: {
    walletAddress: v.string(),
    isPremiumModel: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Query user by wallet address
    const user = await ctx.db
      .query('users')
      .withIndex('by_wallet', (q) => q.eq('walletAddress', args.walletAddress))
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    // Update user's message counts
    const updates = {
      subscription: {
        ...user.subscription,
        messagesUsed: (user.subscription?.messagesUsed ?? 0) + 1,
        premiumMessagesUsed: args.isPremiumModel
          ? (user.subscription?.premiumMessagesUsed ?? 0) + 1
          : user.subscription?.premiumMessagesUsed ?? 0,
      },
    } as const;

    await ctx.db.patch(user._id, updates);
  },
});

// Track message usage (simplified for API middleware)
export const trackMessageUsage = mutation({
  args: {
    isPremiumModel: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireAuth(ctx);

    // User is guaranteed to exist due to requireAuth

    // Skip tracking for admins - they have unlimited usage
    if (user.role && user.role !== 'user') {
      return {
        messagesUsed: 0,
        messagesRemaining: Infinity,
        premiumMessagesUsed: 0,
        premiumMessagesRemaining: Infinity,
        isAdmin: true,
      };
    }

    // Update user's message counts
    const updates = {
      subscription: {
        ...user.subscription,
        messagesUsed: (user.subscription?.messagesUsed ?? 0) + 1,
        premiumMessagesUsed: args.isPremiumModel
          ? (user.subscription?.premiumMessagesUsed ?? 0) + 1
          : user.subscription?.premiumMessagesUsed ?? 0,
      },
    } as const;

    await ctx.db.patch(user._id, updates);

    // Track detailed usage
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateTimestamp = today.getTime();

    await ctx.db.insert('messageUsage', {
      userId: user._id,
      model: args.isPremiumModel ? 'premium' : 'standard',
      modelCategory: args.isPremiumModel ? 'premium' : 'standard',
      messageCount: 1,
      inputTokens: 0, // Not tracked in this version
      outputTokens: 0, // Not tracked in this version
      estimatedCost: args.isPremiumModel ? 0.015 : 0.001,
      date: dateTimestamp,
      createdAt: Date.now(),
    });

    return {
      messagesUsed: updates.subscription.messagesUsed,
      messagesRemaining: user.subscription.messagesLimit - updates.subscription.messagesUsed,
      premiumMessagesUsed: updates.subscription.premiumMessagesUsed,
      premiumMessagesRemaining: args.isPremiumModel
        ? user.subscription.premiumMessagesLimit - updates.subscription.premiumMessagesUsed
        : undefined,
    };
  },
});

// Track message usage with detailed model info (original function)
export const trackDetailedMessageUsage = mutation({
  args: {
    model: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireAuth(ctx);

    // User is guaranteed to exist due to requireAuth

    // Skip tracking for admins - they have unlimited usage
    if (user.role && user.role !== 'user') {
      return {
        messagesUsed: 0,
        messagesRemaining: Infinity,
        premiumMessagesUsed: 0,
        premiumMessagesRemaining: Infinity,
        isAdmin: true,
      };
    }

    const modelConfig = MODEL_COSTS[args.model as keyof typeof MODEL_COSTS];
    const isPremium = modelConfig?.category === 'premium';

    // Ensure subscription values are initialized properly
    const currentMessagesUsed = user.subscription?.messagesUsed ?? 0;
    const currentPremiumMessagesUsed = user.subscription?.premiumMessagesUsed ?? 0;
    const messagesLimit = user.subscription?.messagesLimit ?? 50;
    const premiumMessagesLimit = user.subscription?.premiumMessagesLimit ?? 0;
    
    // Update user's message counts
    const updates = {
      subscription: {
        ...user.subscription,
        messagesUsed: currentMessagesUsed + 1,
        messagesLimit,
        premiumMessagesLimit,
        premiumMessagesUsed: isPremium
          ? currentPremiumMessagesUsed + 1
          : currentPremiumMessagesUsed,
      },
    } as const;

    await ctx.db.patch(user._id, updates);

    // Track detailed usage
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateTimestamp = today.getTime();

    await ctx.db.insert('messageUsage', {
      userId: user._id,
      model: args.model,
      modelCategory: modelConfig?.category || 'standard',
      messageCount: 1,
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens,
      estimatedCost: modelConfig?.costPerMessage || 0,
      date: dateTimestamp,
      createdAt: Date.now(),
    });

    // Check if we should show upgrade prompt
    const usagePercent = ((user.subscription?.messagesUsed ?? 0) / (user.subscription?.messagesLimit ?? 1)) * 100;
    
    if (usagePercent >= 80 && usagePercent < 90) {
      await ctx.db.insert('upgradeSuggestions', {
        userId: user._id,
        triggerType: 'usage_milestone',
        currentTier: user.subscription.tier,
        suggestedTier: user.subscription.tier === 'free' ? 'pro' : 'pro_plus',
        context: `80% of monthly messages used`,
        shown: false,
        converted: false,
        createdAt: Date.now(),
      });
    }

    return {
      messagesUsed: updates.subscription.messagesUsed,
      messagesRemaining: user.subscription.messagesLimit - updates.subscription.messagesUsed,
      premiumMessagesUsed: updates.subscription.premiumMessagesUsed,
      premiumMessagesRemaining: isPremium
        ? user.subscription.premiumMessagesLimit - updates.subscription.premiumMessagesUsed
        : undefined,
    };
  },
});

// Process subscription payment
export const processPayment = mutation({
  args: {
    tier: v.union(v.literal('pro'), v.literal('pro_plus')),
    txSignature: v.string(),
    amountSol: v.number(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireAuth(ctx);

    if (!user.isActive) {
      throw new Error('User account is inactive');
    }

    const tierConfig = SUBSCRIPTION_TIERS[args.tier];
    
    // Verify payment amount
    if (Math.abs(args.amountSol - tierConfig.priceSol) > 0.001) {
      throw new Error('Invalid payment amount');
    }

    const now = Date.now();
    const periodEnd = now + 30 * 24 * 60 * 60 * 1000; // 30 days

    // Create payment record
    const paymentId = await ctx.db.insert('subscriptionPayments', {
      userId: user.walletAddress!, // Keep wallet address for payment tracking
      tier: args.tier,
      amountSol: args.amountSol,
      txSignature: args.txSignature,
      paymentDate: now,
      periodStart: now,
      periodEnd: periodEnd,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });

    // Update user subscription
    await ctx.db.patch(user._id, {
      subscription: {
        ...user.subscription,
        tier: args.tier,
        messagesUsed: 0, // Reset on new subscription
        messagesLimit: tierConfig.messagesLimit,
        premiumMessagesUsed: 0,
        premiumMessagesLimit: tierConfig.premiumMessagesLimit,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        subscriptionTxSignature: args.txSignature,
        autoRenew: true,
        planPriceSol: tierConfig.priceSol,
        features: tierConfig.features,
      },
    });

    return {
      success: true,
      paymentId,
      tier: args.tier,
      periodEnd,
    };
  },
});

// Confirm payment after blockchain verification
export const confirmPayment = mutation({
  args: {
    txSignature: v.string(),
    confirmations: v.number(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireAuth(ctx);

    const payment = await ctx.db
      .query('subscriptionPayments')
      .withIndex('by_signature', (q) => q.eq('txSignature', args.txSignature))
      .first();

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Ensure the payment belongs to the authenticated user
    if (payment.userId !== user.walletAddress) {
      throw new Error('Payment access denied');
    }

    await ctx.db.patch(payment._id, {
      status: 'confirmed',
      confirmations: args.confirmations,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Initialize user subscription (for new users) - used by auth callback
export const initializeUserSubscription = mutation({
  args: {},
  handler: async (ctx, args) => {
    const { user } = await requireAuth(ctx);

    if (user && user.subscription) {
      // User already has subscription initialized
      return user.subscription;
    }

    // Initialize subscription for authenticated user
    const now = Date.now();
    const periodEnd = now + 30 * 24 * 60 * 60 * 1000; // 30 days
    const tierConfig = SUBSCRIPTION_TIERS.free;

    const subscription = {
      tier: 'free' as const,
      messagesUsed: 0,
      messagesLimit: tierConfig.messagesLimit,
      premiumMessagesUsed: 0,
      premiumMessagesLimit: tierConfig.premiumMessagesLimit,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      subscriptionTxSignature: '',
      autoRenew: false,
      planPriceSol: tierConfig.priceSol,
      features: tierConfig.features,
    };

    await ctx.db.patch(user._id, {
      subscription,
      lastActiveAt: now,
    });

    return subscription;
  },
});

// Get subscription status by wallet address (for HTTP actions)
export const getSubscriptionStatusByWallet = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    // Query user by wallet address
    const user = await ctx.db
      .query('users')
      .withIndex('by_wallet', (q) => q.eq('walletAddress', args.walletAddress))
      .first();

    if (!user) {
      return null;
    }

    const tierConfig = SUBSCRIPTION_TIERS[user.subscription.tier];
    const now = Date.now();
    
    const messageUsagePercent = user.subscription.messagesLimit > 0 
      ? (user.subscription.messagesUsed / user.subscription.messagesLimit) * 100 
      : 0;
    const premiumUsagePercent = user.subscription.premiumMessagesLimit > 0 
      ? (user.subscription.premiumMessagesUsed / user.subscription.premiumMessagesLimit) * 100 
      : 0;
    const isExpired = user.subscription.currentPeriodEnd < now;

    return {
      tier: user.subscription.tier,
      messagesUsed: user.subscription.messagesUsed,
      messagesLimit: user.subscription.messagesLimit,
      messagesRemaining: Math.max(0, user.subscription.messagesLimit - user.subscription.messagesUsed),
      premiumMessagesUsed: user.subscription.premiumMessagesUsed,
      premiumMessagesLimit: user.subscription.premiumMessagesLimit,
      premiumMessagesRemaining: Math.max(0, user.subscription.premiumMessagesLimit - user.subscription.premiumMessagesUsed),
      messageUsagePercent,
      premiumUsagePercent,
      currentPeriodStart: user.subscription.currentPeriodStart,
      currentPeriodEnd: user.subscription.currentPeriodEnd,
      isExpired,
      autoRenew: user.subscription.autoRenew,
      planPriceSol: user.subscription.planPriceSol,
      features: user.subscription.features,
      availableModels: tierConfig.availableModels,
      daysRemaining: Math.max(0, Math.floor((user.subscription.currentPeriodEnd - now) / (24 * 60 * 60 * 1000))),
    };
  },
});

// Get subscription status (for authenticated users)
export const getSubscriptionStatus = query({
  args: {},
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      return null;
    }

    // Admins have unlimited access
    if (user.role && user.role !== 'user') {
      return {
        tier: 'admin',
        isAdmin: true,
        messagesUsed: 0,
        messagesLimit: Infinity,
        messagesRemaining: Infinity,
        premiumMessagesUsed: 0,
        premiumMessagesLimit: Infinity,
        premiumMessagesRemaining: Infinity,
        messageUsagePercent: 0,
        premiumUsagePercent: 0,
        currentPeriodStart: Date.now(),
        currentPeriodEnd: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
        isExpired: false,
        autoRenew: false,
        planPriceSol: 0,
        features: ['unlimited_everything'],
        availableModels: ['gpt-5-nano', 'gpt-4o', 'gpt-4o-mini', 'claude-3.5-sonnet', 'deepseek-chat', 'deepseek-r1'],
        daysRemaining: Infinity,
      };
    }

    const tierConfig = SUBSCRIPTION_TIERS[user.subscription.tier];
    const now = Date.now();
    
    const messageUsagePercent = user.subscription.messagesLimit > 0 
      ? (user.subscription.messagesUsed / user.subscription.messagesLimit) * 100 
      : 0;
    const premiumUsagePercent = user.subscription.premiumMessagesLimit > 0 
      ? (user.subscription.premiumMessagesUsed / user.subscription.premiumMessagesLimit) * 100 
      : 0;
    const isExpired = user.subscription.currentPeriodEnd < now;

    return {
      tier: user.subscription.tier,
      messagesUsed: user.subscription.messagesUsed,
      messagesLimit: user.subscription.messagesLimit,
      messagesRemaining: Math.max(0, user.subscription.messagesLimit - user.subscription.messagesUsed),
      premiumMessagesUsed: user.subscription.premiumMessagesUsed,
      premiumMessagesLimit: user.subscription.premiumMessagesLimit,
      premiumMessagesRemaining: Math.max(0, user.subscription.premiumMessagesLimit - user.subscription.premiumMessagesUsed),
      messageUsagePercent,
      premiumUsagePercent,
      currentPeriodStart: user.subscription.currentPeriodStart,
      currentPeriodEnd: user.subscription.currentPeriodEnd,
      isExpired,
      autoRenew: user.subscription.autoRenew,
      planPriceSol: user.subscription.planPriceSol,
      features: user.subscription.features,
      availableModels: tierConfig.availableModels,
      daysRemaining: Math.max(0, Math.floor((user.subscription.currentPeriodEnd - now) / (24 * 60 * 60 * 1000))),
    };
  },
});

// Reset monthly usage (called by cron job)
export const resetMonthlyUsage = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Get all users whose billing period has ended
    const users = await ctx.db.query('users').collect();
    
    for (const user of users) {
      if (user.subscription?.currentPeriodEnd && user.subscription.currentPeriodEnd <= now) {
        // Reset usage for new period
        const periodEnd = now + 30 * 24 * 60 * 60 * 1000; // 30 days
        
        try {
          await ctx.db.patch(user._id, {
            subscription: {
              ...user.subscription,
              messagesUsed: 0,
              premiumMessagesUsed: 0,
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
            },
          });
        } catch (error) {
          console.error(`Failed to reset usage for user ${user._id}:`, error);
        }
      }
    }
    
    return { success: true, usersReset: users.length };
  },
});

// Initialize model quotas (run once during setup)
export const initializeModelQuotas = mutation({
  args: {},
  handler: async (ctx) => {
    const quotas = [
      // Free tier
      { tier: 'free' as const, model: 'gpt-4o-mini', modelCategory: 'standard' as const, monthlyLimit: -1, isAvailable: true, priority: 1, costPerMessage: 0.000675 },
      { tier: 'free' as const, model: 'deepseek-chat', modelCategory: 'standard' as const, monthlyLimit: -1, isAvailable: true, priority: 2, costPerMessage: 0.001235 },
      { tier: 'free' as const, model: 'gpt-4o', modelCategory: 'premium' as const, monthlyLimit: 0, isAvailable: false, priority: 0, costPerMessage: 0.0175 },
      { tier: 'free' as const, model: 'claude-3.5-sonnet', modelCategory: 'premium' as const, monthlyLimit: 0, isAvailable: false, priority: 0, costPerMessage: 0.0165 },
      
      // Pro tier
      { tier: 'pro' as const, model: 'gpt-4o-mini', modelCategory: 'standard' as const, monthlyLimit: -1, isAvailable: true, priority: 1, costPerMessage: 0.000675 },
      { tier: 'pro' as const, model: 'deepseek-chat', modelCategory: 'standard' as const, monthlyLimit: -1, isAvailable: true, priority: 2, costPerMessage: 0.001235 },
      { tier: 'pro' as const, model: 'deepseek-r1', modelCategory: 'standard' as const, monthlyLimit: -1, isAvailable: true, priority: 3, costPerMessage: 0.002325 },
      { tier: 'pro' as const, model: 'gpt-4o', modelCategory: 'premium' as const, monthlyLimit: 100, isAvailable: true, priority: 4, costPerMessage: 0.0175 },
      { tier: 'pro' as const, model: 'claude-3.5-sonnet', modelCategory: 'premium' as const, monthlyLimit: 100, isAvailable: true, priority: 5, costPerMessage: 0.0165 },
      
      // Pro+ tier
      { tier: 'pro_plus' as const, model: 'gpt-4o-mini', modelCategory: 'standard' as const, monthlyLimit: -1, isAvailable: true, priority: 1, costPerMessage: 0.000675 },
      { tier: 'pro_plus' as const, model: 'deepseek-chat', modelCategory: 'standard' as const, monthlyLimit: -1, isAvailable: true, priority: 2, costPerMessage: 0.001235 },
      { tier: 'pro_plus' as const, model: 'deepseek-r1', modelCategory: 'standard' as const, monthlyLimit: -1, isAvailable: true, priority: 3, costPerMessage: 0.002325 },
      { tier: 'pro_plus' as const, model: 'gpt-4o', modelCategory: 'premium' as const, monthlyLimit: 300, isAvailable: true, priority: 4, costPerMessage: 0.0175 },
      { tier: 'pro_plus' as const, model: 'claude-3.5-sonnet', modelCategory: 'premium' as const, monthlyLimit: 300, isAvailable: true, priority: 5, costPerMessage: 0.0165 },
    ];

    for (const quota of quotas) {
      await ctx.db.insert('modelQuotas', {
        ...quota,
        updatedAt: Date.now(),
      });
    }

    return { success: true, quotasCreated: quotas.length };
  },
});