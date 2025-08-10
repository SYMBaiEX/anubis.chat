import { v } from 'convex/values';
import { internalMutation, mutation, query } from './_generated/server';
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
    availableModels: [
      'gpt-4o-mini',
      'deepseek-chat',
      'deepseek-r1',
      'gpt-4o',
      'claude-3.5-sonnet',
    ],
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
    availableModels: [
      'gpt-4o-mini',
      'deepseek-chat',
      'deepseek-r1',
      'gpt-4o',
      'claude-3.5-sonnet',
    ],
  },
};

// Model cost configurations (for internal tracking)
const MODEL_COSTS = {
  'gpt-4o': { category: 'premium', costPerMessage: 0.0175 },
  'gpt-4o-mini': { category: 'standard', costPerMessage: 0.000_675 },
  'claude-3.5-sonnet': { category: 'premium', costPerMessage: 0.0165 },
  'deepseek-chat': { category: 'standard', costPerMessage: 0.001_235 },
  'deepseek-r1': { category: 'standard', costPerMessage: 0.002_325 },
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
        remaining: Number.POSITIVE_INFINITY,
        premiumRemaining: Number.POSITIVE_INFINITY,
      };
    }

    const tierConfig = SUBSCRIPTION_TIERS[user.subscription.tier];
    const modelConfig = MODEL_COSTS[args.model as keyof typeof MODEL_COSTS];

    // Check if model is available for tier
    if (!tierConfig.availableModels.includes(args.model)) {
      return {
        allowed: false,
        reason: 'Model not available for your subscription tier',
        suggestedUpgrade:
          user.subscription.tier === 'free' ? 'pro' : 'pro_plus',
      };
    }

    // Check message limits
    if (
      modelConfig?.category === 'premium' &&
      user.subscription.premiumMessagesUsed >=
        user.subscription.premiumMessagesLimit
    ) {
      return {
        allowed: false,
        reason: 'Premium message limit reached',
        remaining: 0,
        suggestedAction: 'upgrade',
      };
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
      remaining:
        user.subscription.messagesLimit - user.subscription.messagesUsed,
      premiumRemaining:
        modelConfig?.category === 'premium'
          ? user.subscription.premiumMessagesLimit -
            user.subscription.premiumMessagesUsed
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
          : (user.subscription?.premiumMessagesUsed ?? 0),
      },
    } as const;

    await ctx.db.patch(user._id, {
      ...updates,
      updatedAt: Date.now(),
    });
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
        messagesRemaining: Number.POSITIVE_INFINITY,
        premiumMessagesUsed: 0,
        premiumMessagesRemaining: Number.POSITIVE_INFINITY,
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
          : (user.subscription?.premiumMessagesUsed ?? 0),
      },
    } as const;

    await ctx.db.patch(user._id, {
      ...updates,
      updatedAt: Date.now(),
    });

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
      messagesRemaining:
        user.subscription.messagesLimit - updates.subscription.messagesUsed,
      premiumMessagesUsed: updates.subscription.premiumMessagesUsed,
      premiumMessagesRemaining: args.isPremiumModel
        ? user.subscription.premiumMessagesLimit -
          updates.subscription.premiumMessagesUsed
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
        messagesRemaining: Number.POSITIVE_INFINITY,
        premiumMessagesUsed: 0,
        premiumMessagesRemaining: Number.POSITIVE_INFINITY,
        isAdmin: true,
      };
    }

    const modelConfig = MODEL_COSTS[args.model as keyof typeof MODEL_COSTS];
    const isPremium = modelConfig?.category === 'premium';

    // Ensure subscription values are initialized properly
    const currentMessagesUsed = user.subscription?.messagesUsed ?? 0;
    const currentPremiumMessagesUsed =
      user.subscription?.premiumMessagesUsed ?? 0;
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

    await ctx.db.patch(user._id, {
      ...updates,
      updatedAt: Date.now(),
    });

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
    const usagePercent =
      ((user.subscription?.messagesUsed ?? 0) /
        (user.subscription?.messagesLimit ?? 1)) *
      100;

    if (usagePercent >= 80 && usagePercent < 90) {
      await ctx.db.insert('upgradeSuggestions', {
        userId: user._id,
        triggerType: 'usage_milestone',
        currentTier: user.subscription.tier,
        suggestedTier: user.subscription.tier === 'free' ? 'pro' : 'pro_plus',
        context: '80% of monthly messages used',
        shown: false,
        converted: false,
        createdAt: Date.now(),
      });
    }

    return {
      messagesUsed: updates.subscription.messagesUsed,
      messagesRemaining:
        user.subscription.messagesLimit - updates.subscription.messagesUsed,
      premiumMessagesUsed: updates.subscription.premiumMessagesUsed,
      premiumMessagesRemaining: isPremium
        ? user.subscription.premiumMessagesLimit -
          updates.subscription.premiumMessagesUsed
        : undefined,
    };
  },
});

// Process subscription payment (creates pending payment for verification)
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

    // Check if transaction signature already exists
    const existingPayment = await ctx.db
      .query('subscriptionPayments')
      .withIndex('by_signature', (q) => q.eq('txSignature', args.txSignature))
      .first();

    if (existingPayment) {
      if (existingPayment.status === 'confirmed') {
        throw new Error('Transaction has already been processed');
      }
      if (existingPayment.status === 'pending') {
        throw new Error('Transaction is already being verified');
      }
    }

    const now = Date.now();
    const periodEnd = now + 30 * 24 * 60 * 60 * 1000; // 30 days

    // Create pending payment record
    const paymentId = await ctx.db.insert('subscriptionPayments', {
      userId: user._id,
      tier: args.tier,
      amountSol: args.amountSol,
      amountUsd: args.tier === 'pro' ? 7 : 15, // Set USD amount based on tier
      txSignature: args.txSignature,
      paymentDate: now,
      periodStart: now,
      periodEnd,
      status: 'pending', // Pending verification
      createdAt: now,
      updatedAt: now,
    });

    // Return success but don't update subscription yet
    // Subscription will be updated after blockchain verification
    return {
      success: true,
      paymentId,
      tier: args.tier,
      status: 'pending',
      message: 'Payment submitted for verification',
    };
  },
});

// Internal mutation to process verified payment
export const processVerifiedPayment = internalMutation({
  args: {
    tier: v.union(v.literal('pro'), v.literal('pro_plus')),
    txSignature: v.string(),
    amountSol: v.number(),
    walletAddress: v.string(),
    verificationDetails: v.object({
      signature: v.string(),
      recipient: v.string(),
      sender: v.string(),
      amount: v.number(),
      timestamp: v.number(),
      slot: v.number(),
      confirmationStatus: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    // Find the user by wallet address
    const user = await ctx.db
      .query('users')
      .withIndex('by_wallet', (q) => q.eq('walletAddress', args.walletAddress))
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    // Check if payment already exists
    let payment = await ctx.db
      .query('subscriptionPayments')
      .withIndex('by_signature', (q) => q.eq('txSignature', args.txSignature))
      .first();

    // If payment doesn't exist, create it (direct wallet payment)
    if (!payment) {
      const now = Date.now();
      const paymentId = await ctx.db.insert('subscriptionPayments', {
        userId: user._id,
        tier: args.tier,
        amountSol: args.amountSol,
        amountUsd: args.tier === 'pro' ? 7 : 15, // Set USD amount based on tier
        txSignature: args.txSignature,
        status: 'pending',
        paymentDate: now,
        periodStart: now,
        periodEnd: now + 30 * 24 * 60 * 60 * 1000, // 30 days
        createdAt: now,
        updatedAt: now,
      });
      
      payment = await ctx.db.get(paymentId);
      if (!payment) {
        throw new Error('Failed to create payment record');
      }
    }

    if (payment.status === 'confirmed') {
      // Payment already processed
      return {
        success: true,
        paymentId: payment._id,
        tier: args.tier,
        status: 'already_processed',
        message: 'Payment has already been processed',
      };
    }

    if (payment.status !== 'pending') {
      throw new Error(`Payment is in invalid status: ${payment.status}`);
    }

    const tierConfig = SUBSCRIPTION_TIERS[args.tier];
    const now = Date.now();
    const periodEnd = now + 30 * 24 * 60 * 60 * 1000; // 30 days

    // Update payment status to confirmed
    await ctx.db.patch(payment._id, {
      status: 'confirmed',
      verificationDetails: args.verificationDetails,
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
      updatedAt: now,
    });

    return {
      success: true,
      paymentId: payment._id,
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
    if (payment.userId !== user._id) {
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
      updatedAt: now,
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

    const messageUsagePercent =
      user.subscription.messagesLimit > 0
        ? (user.subscription.messagesUsed / user.subscription.messagesLimit) *
          100
        : 0;
    const premiumUsagePercent =
      user.subscription.premiumMessagesLimit > 0
        ? (user.subscription.premiumMessagesUsed /
            user.subscription.premiumMessagesLimit) *
          100
        : 0;
    const isExpired = user.subscription.currentPeriodEnd < now;

    return {
      tier: user.subscription.tier,
      messagesUsed: user.subscription.messagesUsed,
      messagesLimit: user.subscription.messagesLimit,
      messagesRemaining: Math.max(
        0,
        user.subscription.messagesLimit - user.subscription.messagesUsed
      ),
      premiumMessagesUsed: user.subscription.premiumMessagesUsed,
      premiumMessagesLimit: user.subscription.premiumMessagesLimit,
      premiumMessagesRemaining: Math.max(
        0,
        user.subscription.premiumMessagesLimit -
          user.subscription.premiumMessagesUsed
      ),
      messageUsagePercent,
      premiumUsagePercent,
      currentPeriodStart: user.subscription.currentPeriodStart,
      currentPeriodEnd: user.subscription.currentPeriodEnd,
      isExpired,
      autoRenew: user.subscription.autoRenew,
      planPriceSol: user.subscription.planPriceSol,
      features: user.subscription.features,
      availableModels: tierConfig.availableModels,
      daysRemaining: Math.max(
        0,
        Math.floor(
          (user.subscription.currentPeriodEnd - now) / (24 * 60 * 60 * 1000)
        )
      ),
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
        messagesLimit: Number.POSITIVE_INFINITY,
        messagesRemaining: Number.POSITIVE_INFINITY,
        premiumMessagesUsed: 0,
        premiumMessagesLimit: Number.POSITIVE_INFINITY,
        premiumMessagesRemaining: Number.POSITIVE_INFINITY,
        messageUsagePercent: 0,
        premiumUsagePercent: 0,
        currentPeriodStart: Date.now(),
        currentPeriodEnd: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
        isExpired: false,
        autoRenew: false,
        planPriceSol: 0,
        features: ['unlimited_everything'],
        availableModels: [
          'gpt-5-nano',
          'gpt-4o',
          'gpt-4o-mini',
          'claude-3.5-sonnet',
          'deepseek-chat',
          'deepseek-r1',
        ],
        daysRemaining: Number.POSITIVE_INFINITY,
      };
    }

    const tierConfig = SUBSCRIPTION_TIERS[user.subscription.tier];
    const now = Date.now();

    const messageUsagePercent =
      user.subscription.messagesLimit > 0
        ? (user.subscription.messagesUsed / user.subscription.messagesLimit) *
          100
        : 0;
    const premiumUsagePercent =
      user.subscription.premiumMessagesLimit > 0
        ? (user.subscription.premiumMessagesUsed /
            user.subscription.premiumMessagesLimit) *
          100
        : 0;
    const isExpired = user.subscription.currentPeriodEnd < now;

    return {
      tier: user.subscription.tier,
      messagesUsed: user.subscription.messagesUsed,
      messagesLimit: user.subscription.messagesLimit,
      messagesRemaining: Math.max(
        0,
        user.subscription.messagesLimit - user.subscription.messagesUsed
      ),
      premiumMessagesUsed: user.subscription.premiumMessagesUsed,
      premiumMessagesLimit: user.subscription.premiumMessagesLimit,
      premiumMessagesRemaining: Math.max(
        0,
        user.subscription.premiumMessagesLimit -
          user.subscription.premiumMessagesUsed
      ),
      messageUsagePercent,
      premiumUsagePercent,
      currentPeriodStart: user.subscription.currentPeriodStart,
      currentPeriodEnd: user.subscription.currentPeriodEnd,
      isExpired,
      autoRenew: user.subscription.autoRenew,
      planPriceSol: user.subscription.planPriceSol,
      features: user.subscription.features,
      availableModels: tierConfig.availableModels,
      daysRemaining: Math.max(
        0,
        Math.floor(
          (user.subscription.currentPeriodEnd - now) / (24 * 60 * 60 * 1000)
        )
      ),
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
      if (
        user.subscription?.currentPeriodEnd &&
        user.subscription.currentPeriodEnd <= now
      ) {
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
            updatedAt: now,
          });
        } catch (error) {
          console.error(`Failed to reset usage for user ${user._id}:`, error);
        }
      }
    }

    return { success: true, usersReset: users.length };
  },
});

// Check payment verification status
export const checkPaymentStatus = query({
  args: {
    txSignature: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireAuth(ctx);

    const payment = await ctx.db
      .query('subscriptionPayments')
      .withIndex('by_signature', (q) => q.eq('txSignature', args.txSignature))
      .first();

    if (!payment) {
      return { status: 'not_found' };
    }

    // Ensure the payment belongs to the authenticated user
    if (payment.userId !== user._id) {
      throw new Error('Payment access denied');
    }

    return {
      status: payment.status,
      tier: payment.tier,
      amountSol: payment.amountSol,
      paymentDate: payment.paymentDate,
      verificationDetails: payment.verificationDetails || null,
    };
  },
});

// Initialize model quotas (run once during setup)
export const initializeModelQuotas = mutation({
  args: {},
  handler: async (ctx) => {
    const quotas = [
      // Free tier
      {
        tier: 'free' as const,
        model: 'gpt-4o-mini',
        modelCategory: 'standard' as const,
        monthlyLimit: -1,
        isAvailable: true,
        priority: 1,
        costPerMessage: 0.000_675,
      },
      {
        tier: 'free' as const,
        model: 'deepseek-chat',
        modelCategory: 'standard' as const,
        monthlyLimit: -1,
        isAvailable: true,
        priority: 2,
        costPerMessage: 0.001_235,
      },
      {
        tier: 'free' as const,
        model: 'gpt-4o',
        modelCategory: 'premium' as const,
        monthlyLimit: 0,
        isAvailable: false,
        priority: 0,
        costPerMessage: 0.0175,
      },
      {
        tier: 'free' as const,
        model: 'claude-3.5-sonnet',
        modelCategory: 'premium' as const,
        monthlyLimit: 0,
        isAvailable: false,
        priority: 0,
        costPerMessage: 0.0165,
      },

      // Pro tier
      {
        tier: 'pro' as const,
        model: 'gpt-4o-mini',
        modelCategory: 'standard' as const,
        monthlyLimit: -1,
        isAvailable: true,
        priority: 1,
        costPerMessage: 0.000_675,
      },
      {
        tier: 'pro' as const,
        model: 'deepseek-chat',
        modelCategory: 'standard' as const,
        monthlyLimit: -1,
        isAvailable: true,
        priority: 2,
        costPerMessage: 0.001_235,
      },
      {
        tier: 'pro' as const,
        model: 'deepseek-r1',
        modelCategory: 'standard' as const,
        monthlyLimit: -1,
        isAvailable: true,
        priority: 3,
        costPerMessage: 0.002_325,
      },
      {
        tier: 'pro' as const,
        model: 'gpt-4o',
        modelCategory: 'premium' as const,
        monthlyLimit: 100,
        isAvailable: true,
        priority: 4,
        costPerMessage: 0.0175,
      },
      {
        tier: 'pro' as const,
        model: 'claude-3.5-sonnet',
        modelCategory: 'premium' as const,
        monthlyLimit: 100,
        isAvailable: true,
        priority: 5,
        costPerMessage: 0.0165,
      },

      // Pro+ tier
      {
        tier: 'pro_plus' as const,
        model: 'gpt-4o-mini',
        modelCategory: 'standard' as const,
        monthlyLimit: -1,
        isAvailable: true,
        priority: 1,
        costPerMessage: 0.000_675,
      },
      {
        tier: 'pro_plus' as const,
        model: 'deepseek-chat',
        modelCategory: 'standard' as const,
        monthlyLimit: -1,
        isAvailable: true,
        priority: 2,
        costPerMessage: 0.001_235,
      },
      {
        tier: 'pro_plus' as const,
        model: 'deepseek-r1',
        modelCategory: 'standard' as const,
        monthlyLimit: -1,
        isAvailable: true,
        priority: 3,
        costPerMessage: 0.002_325,
      },
      {
        tier: 'pro_plus' as const,
        model: 'gpt-4o',
        modelCategory: 'premium' as const,
        monthlyLimit: 300,
        isAvailable: true,
        priority: 4,
        costPerMessage: 0.0175,
      },
      {
        tier: 'pro_plus' as const,
        model: 'claude-3.5-sonnet',
        modelCategory: 'premium' as const,
        monthlyLimit: 300,
        isAvailable: true,
        priority: 5,
        costPerMessage: 0.0165,
      },
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
