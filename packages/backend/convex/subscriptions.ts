import { v } from 'convex/values';
import { internal } from './_generated/api';
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from './_generated/server';
import { getCurrentUser, requireAuth } from './authHelpers';

// Subscription tier configurations
const SUBSCRIPTION_TIERS = {
  free: {
    messagesLimit: 50,
    premiumMessagesLimit: 0,
    priceSol: 0,
    features: ['basic_chat', 'limited_models'],
    availableModels: [
      'openrouter/openai/gpt-oss-20b:free',
      'openrouter/z-ai/glm-4.5-air:free',
      'openrouter/qwen/qwen3-coder:free',
      'openrouter/moonshotai/kimi-k2:free',
    ],
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
      'openrouter/openai/gpt-oss-20b:free',
      'openrouter/z-ai/glm-4.5-air:free',
      'openrouter/qwen/qwen3-coder:free',
      'openrouter/moonshotai/kimi-k2:free',
      'gpt-5',
      'gpt-5-mini',
      'o4-mini',
      'gpt-4.1-mini',
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash',
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
      'openrouter/openai/gpt-oss-20b:free',
      'openrouter/z-ai/glm-4.5-air:free',
      'openrouter/qwen/qwen3-coder:free',
      'openrouter/moonshotai/kimi-k2:free',
      'gpt-5',
      'gpt-5-mini',
      'o4-mini',
      'gpt-4.1-mini',
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash',
    ],
  },
};

// Model cost configurations (for internal tracking)
const MODEL_COSTS = {
  // OpenRouter free models (standard)
  'openrouter/openai/gpt-oss-20b:free': {
    category: 'standard',
    costPerMessage: 0.0005,
  },
  'openrouter/z-ai/glm-4.5-air:free': {
    category: 'standard',
    costPerMessage: 0.0005,
  },
  'openrouter/qwen/qwen3-coder:free': {
    category: 'standard',
    costPerMessage: 0.0005,
  },
  'openrouter/moonshotai/kimi-k2:free': {
    category: 'standard',
    costPerMessage: 0.0005,
  },
  // OpenAI models (premium)
  'gpt-5': { category: 'premium', costPerMessage: 0.02 },
  'gpt-5-mini': { category: 'premium', costPerMessage: 0.01 },
  'o4-mini': { category: 'premium', costPerMessage: 0.008 },
  'gpt-4.1-mini': { category: 'premium', costPerMessage: 0.006 },
  // Google models
  'gemini-2.5-pro': { category: 'premium', costPerMessage: 0.02 },
  'gemini-2.5-flash': { category: 'premium', costPerMessage: 0.01 },
  'gemini-2.5-flash-lite': { category: 'standard', costPerMessage: 0.003 },
  'gemini-2.0-flash': { category: 'standard', costPerMessage: 0.004 },
};

// Safely normalize a user's subscription so fields are always defined
type Tier = keyof typeof SUBSCRIPTION_TIERS;
type SubscriptionShape = {
  tier: Tier;
  messagesUsed: number;
  messagesLimit: number;
  premiumMessagesUsed: number;
  premiumMessagesLimit: number;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  autoRenew: boolean;
  planPriceSol: number;
  features: string[];
};

function getSafeSubscription(user: {
  subscription?: Partial<SubscriptionShape> | Record<string, unknown>;
}): SubscriptionShape {
  // If user already has a subscription with a valid tier, normalize numeric fields
  const candidate = user.subscription as Partial<SubscriptionShape> | undefined;
  const validTier = (candidate?.tier ?? 'free') as Tier;
  const tierDefaults = SUBSCRIPTION_TIERS[validTier];
  const now = Date.now();
  return {
    tier: validTier,
    messagesUsed: candidate?.messagesUsed ?? 0,
    messagesLimit: candidate?.messagesLimit ?? tierDefaults.messagesLimit,
    premiumMessagesUsed: candidate?.premiumMessagesUsed ?? 0,
    premiumMessagesLimit:
      candidate?.premiumMessagesLimit ?? tierDefaults.premiumMessagesLimit,
    currentPeriodStart: candidate?.currentPeriodStart ?? now,
    currentPeriodEnd:
      candidate?.currentPeriodEnd ?? now + 30 * 24 * 60 * 60 * 1000,
    autoRenew: Boolean(candidate?.autoRenew),
    planPriceSol: candidate?.planPriceSol ?? tierDefaults.priceSol,
    features: candidate?.features ?? tierDefaults.features,
  };
}

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

    const sub = getSafeSubscription(user);
    const tierConfig = SUBSCRIPTION_TIERS[sub.tier];
    const modelConfig = MODEL_COSTS[args.model as keyof typeof MODEL_COSTS];

    // Check if model is available for tier
    if (!tierConfig.availableModels.includes(args.model)) {
      return {
        allowed: false,
        reason: 'Model not available for your subscription tier',
        suggestedUpgrade: sub.tier === 'free' ? 'pro' : 'pro_plus',
      };
    }

    // Check message limits
    if (
      modelConfig?.category === 'premium' &&
      sub.premiumMessagesUsed >= sub.premiumMessagesLimit
    ) {
      return {
        allowed: false,
        reason: 'Premium message limit reached',
        remaining: 0,
        suggestedAction: 'upgrade',
      };
    }

    // Check total message limit
    if (sub.messagesUsed >= sub.messagesLimit) {
      return {
        allowed: false,
        reason: 'Monthly message limit reached',
        remaining: 0,
        suggestedAction: 'upgrade',
      };
    }

    return {
      allowed: true,
      remaining: sub.messagesLimit - sub.messagesUsed,
      premiumRemaining:
        modelConfig?.category === 'premium'
          ? sub.premiumMessagesLimit - sub.premiumMessagesUsed
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
    const sub = getSafeSubscription(user);
    const updates = {
      subscription: {
        ...sub,
        messagesUsed: sub.messagesUsed + 1,
        premiumMessagesUsed: args.isPremiumModel
          ? sub.premiumMessagesUsed + 1
          : sub.premiumMessagesUsed,
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
    const sub = getSafeSubscription(user);
    const updates = {
      subscription: {
        ...sub,
        messagesUsed: sub.messagesUsed + 1,
        premiumMessagesUsed: args.isPremiumModel
          ? sub.premiumMessagesUsed + 1
          : sub.premiumMessagesUsed,
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
      modelCategory: (args.isPremiumModel ? 'premium' : 'standard') as
        | 'premium'
        | 'standard',
      messageCount: 1,
      inputTokens: 0, // Not tracked in this version
      outputTokens: 0, // Not tracked in this version
      estimatedCost: args.isPremiumModel ? 0.015 : 0.001,
      date: dateTimestamp,
      createdAt: Date.now(),
    });

    return {
      messagesUsed: updates.subscription.messagesUsed,
      messagesRemaining: sub.messagesLimit - updates.subscription.messagesUsed,
      premiumMessagesUsed: updates.subscription.premiumMessagesUsed,
      premiumMessagesRemaining: args.isPremiumModel
        ? sub.premiumMessagesLimit - updates.subscription.premiumMessagesUsed
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

    const sub = getSafeSubscription(user);
    const currentMessagesUsed = sub.messagesUsed;
    const currentPremiumMessagesUsed = sub.premiumMessagesUsed;
    const messagesLimit = sub.messagesLimit;
    const premiumMessagesLimit = sub.premiumMessagesLimit;

    // Update user's message counts
    const updates = {
      subscription: {
        ...sub,
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
      modelCategory: (modelConfig?.category ?? 'standard') as
        | 'premium'
        | 'standard',
      messageCount: 1,
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens,
      estimatedCost: modelConfig?.costPerMessage || 0,
      date: dateTimestamp,
      createdAt: Date.now(),
    });

    // Check if we should show upgrade prompt
    const usagePercent =
      (sub.messagesUsed / Math.max(1, sub.messagesLimit)) * 100;

    if (usagePercent >= 80 && usagePercent < 90) {
      await ctx.db.insert('upgradeSuggestions', {
        userId: user._id,
        triggerType: 'usage_milestone',
        currentTier: sub.tier,
        suggestedTier: sub.tier === 'free' ? 'pro' : 'pro_plus',
        context: '80% of monthly messages used',
        shown: false,
        converted: false,
        createdAt: Date.now(),
      });
    }

    return {
      messagesUsed: updates.subscription.messagesUsed,
      messagesRemaining: sub.messagesLimit - updates.subscription.messagesUsed,
      premiumMessagesUsed: updates.subscription.premiumMessagesUsed,
      premiumMessagesRemaining: isPremium
        ? sub.premiumMessagesLimit - updates.subscription.premiumMessagesUsed
        : undefined,
    };
  },
});

// Calculate prorated upgrade cost for Pro to Pro+ upgrade
export const calculateProratedUpgrade = query({
  args: {
    targetTier: v.union(v.literal('pro'), v.literal('pro_plus')),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      return null;
    }

    const sub = getSafeSubscription(user);
    const currentTier = sub.tier;
    const targetTier = args.targetTier;

    // Only support Pro to Pro+ proration for now
    if (currentTier !== 'pro' || targetTier !== 'pro_plus') {
      return {
        isProrated: false,
        fullPrice: SUBSCRIPTION_TIERS[targetTier].priceSol,
        proratedPrice: SUBSCRIPTION_TIERS[targetTier].priceSol,
        creditApplied: 0,
        daysRemaining: 0,
      };
    }

    const now = Date.now();
    const currentPeriodEnd = sub.currentPeriodEnd;
    const daysRemaining = Math.max(
      0,
      Math.ceil((currentPeriodEnd - now) / (1000 * 60 * 60 * 24))
    );

    // Calculate credit for unused Pro subscription
    const proPricePerDay = SUBSCRIPTION_TIERS.pro.priceSol / 30;
    const creditApplied = proPricePerDay * daysRemaining;

    // Calculate prorated price
    const fullPriceDifference =
      SUBSCRIPTION_TIERS.pro_plus.priceSol - SUBSCRIPTION_TIERS.pro.priceSol;
    const proratedPrice = Math.max(0, fullPriceDifference);

    return {
      isProrated: true,
      fullPrice: SUBSCRIPTION_TIERS[targetTier].priceSol,
      proratedPrice,
      creditApplied,
      daysRemaining,
      currentTier,
      targetTier,
    };
  },
});

// Process subscription payment (creates pending payment for verification)
export const processPayment = mutation({
  args: {
    tier: v.union(v.literal('pro'), v.literal('pro_plus')),
    txSignature: v.string(),
    amountSol: v.number(),
    isProrated: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireAuth(ctx);

    if (!user.isActive) {
      throw new Error('User account is inactive');
    }

    const tierConfig = SUBSCRIPTION_TIERS[args.tier];
    let expectedAmount = tierConfig.priceSol;

    // Handle prorated upgrade from Pro to Pro+
    const sub = getSafeSubscription(user);
    if (args.isProrated && sub.tier === 'pro' && args.tier === 'pro_plus') {
      expectedAmount =
        SUBSCRIPTION_TIERS.pro_plus.priceSol - SUBSCRIPTION_TIERS.pro.priceSol;
    }

    // Verify payment amount
    if (Math.abs(args.amountSol - expectedAmount) > 0.001) {
      throw new Error(
        `Invalid payment amount. Expected: ${expectedAmount} SOL, received: ${args.amountSol} SOL`
      );
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

// Internal query to get payment by signature (for duplicate checking)
export const getPaymentBySignature = internalQuery({
  args: { txSignature: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('subscriptionPayments')
      .withIndex('by_signature', (q) => q.eq('txSignature', args.txSignature))
      .first();
  },
});

// Internal mutation to process verified payment
export const processVerifiedPayment = internalMutation({
  args: {
    tier: v.union(v.literal('pro'), v.literal('pro_plus')),
    txSignature: v.string(),
    amountSol: v.number(),
    walletAddress: v.string(),
    isProrated: v.optional(v.boolean()),
    verificationDetails: v.object({
      signature: v.string(),
      recipient: v.string(),
      sender: v.string(),
      amount: v.number(),
      timestamp: v.number(),
      slot: v.number(),
      confirmationStatus: v.string(),
    }),
    referralCode: v.optional(v.string()),
    referralPayoutTx: v.optional(v.string()),
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
      // Payment already processed - return success to avoid double processing
      // But ensure user subscription is up to date
      const sub = getSafeSubscription(user);
      if (
        sub.tier !== args.tier ||
        sub.subscriptionTxSignature !== args.txSignature
      ) {
        // Subscription might be out of sync - update it
        const tierConfig = SUBSCRIPTION_TIERS[args.tier];
        await ctx.db.patch(user._id, {
          subscription: {
            ...sub,
            tier: args.tier,
            subscriptionTxSignature: args.txSignature,
            messagesLimit: tierConfig.messagesLimit,
            premiumMessagesLimit: tierConfig.premiumMessagesLimit,
            planPriceSol: tierConfig.priceSol,
            features: tierConfig.features,
          },
          updatedAt: Date.now(),
        });
      }

      return {
        success: true,
        paymentId: payment._id,
        tier: args.tier,
        status: 'already_processed',
        message:
          'Payment has already been processed and user subscription updated',
      };
    }

    if (payment.status !== 'pending') {
      throw new Error(`Payment is in invalid status: ${payment.status}`);
    }

    const tierConfig = SUBSCRIPTION_TIERS[args.tier];
    const now = Date.now();

    // For prorated upgrades, maintain the current billing period
    let periodEnd = now + 30 * 24 * 60 * 60 * 1000; // Default: 30 days from now
    let periodStart = now;
    let resetUsage = true;

    // Handle prorated upgrade from Pro to Pro+
    const sub = getSafeSubscription(user);
    if (args.isProrated && sub.tier === 'pro' && args.tier === 'pro_plus') {
      // Keep the existing billing period for prorated upgrades
      periodStart = sub.currentPeriodStart;
      periodEnd = sub.currentPeriodEnd;
      resetUsage = false; // Don't reset usage counters for mid-cycle upgrades
    }

    // Update payment status to confirmed
    await ctx.db.patch(payment._id, {
      status: 'confirmed',
      verificationDetails: args.verificationDetails,
      updatedAt: now,
    });

    // Update user subscription
    await ctx.db.patch(user._id, {
      subscription: {
        ...sub,
        tier: args.tier,
        messagesUsed: resetUsage ? 0 : sub.messagesUsed,
        messagesLimit: tierConfig.messagesLimit,
        premiumMessagesUsed: resetUsage ? 0 : sub.premiumMessagesUsed,
        premiumMessagesLimit: tierConfig.premiumMessagesLimit,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        subscriptionTxSignature: args.txSignature,
        autoRenew: true,
        planPriceSol: tierConfig.priceSol,
        features: tierConfig.features,
      },
      updatedAt: now,
    });

    // Process referral payout - check BOTH explicit referral code AND permanent referrer relationship
    // This ensures referrals earn on EVERY payment (monthly renewals, upgrades, additional purchases)
    let referralProcessed = false;

    // First check if user has a permanent referrer (from claimReferral or initial attribution)
    if (user.referredBy && user.referredByCode) {
      const referredByCode: string = user.referredByCode;
      try {
        // Get referral code record to get current commission rate
        const referralCodeRecord = await ctx.db
          .query('referralCodes')
          .withIndex('by_code', (q) => q.eq('code', referredByCode))
          .first();

        if (referralCodeRecord?.isActive) {
          // Calculate commission amount
          const commissionRate = referralCodeRecord.currentCommissionRate;
          const commissionAmount = args.amountSol * commissionRate;

          // Get referrer wallet address
          const referrer = await ctx.db.get(user.referredBy);

          if (referrer?.walletAddress) {
            // Create referral payout record
            await ctx.db.insert('referralPayouts', {
              paymentId: payment._id,
              referralCode: referredByCode,
              referrerId: user.referredBy,
              referrerWalletAddress: referrer.walletAddress,
              referredUserId: user._id,
              paymentAmount: args.amountSol,
              commissionRate,
              commissionAmount,
              payoutTxSignature: args.referralPayoutTx || 'PENDING_RECURRING',
              status: args.referralPayoutTx ? 'paid' : 'pending',
              paidAt: args.referralPayoutTx ? now : undefined,
              createdAt: now,
            });

            // Update referrer stats using internal mutation
            await ctx.runMutation(internal.referrals.updateReferrerStats, {
              referrerId: user.referredBy,
              referralCode: referredByCode,
              commissionAmount,
            });

            referralProcessed = true;
          }
        }
      } catch (_referralError) {}
    }

    // Also process explicit referral code if provided (for backward compatibility and first-time conversions)
    if (args.referralCode && args.referralPayoutTx && !referralProcessed) {
      const referralCode: string = args.referralCode;
      try {
        // Check for referral attribution
        const attribution = await ctx.db
          .query('referralAttributions')
          .withIndex('by_referred_wallet', (q) =>
            q.eq('referredWalletAddress', args.walletAddress)
          )
          .filter((q) => q.eq(q.field('referralCode'), referralCode))
          .filter((q) => q.eq(q.field('status'), 'attributed'))
          .first();

        if (attribution) {
          // Get referral code record to get current commission rate
          const referralCodeRecord = await ctx.db
            .query('referralCodes')
            .withIndex('by_code', (q) => q.eq('code', referralCode))
            .first();

          if (referralCodeRecord) {
            // Calculate commission amount
            const commissionRate = referralCodeRecord.currentCommissionRate;
            const commissionAmount = args.amountSol * commissionRate;

            // Get referrer wallet address
            const referrer = await ctx.db.get(referralCodeRecord.userId);

            if (referrer?.walletAddress) {
              // Create referral payout record
              await ctx.db.insert('referralPayouts', {
                paymentId: payment._id,
                referralCode,
                referrerId: referralCodeRecord.userId,
                referrerWalletAddress: referrer.walletAddress,
                referredUserId: user._id,
                paymentAmount: args.amountSol,
                commissionRate,
                commissionAmount,
                payoutTxSignature: args.referralPayoutTx,
                status: 'paid',
                paidAt: now,
                createdAt: now,
              });

              // Update referrer stats using internal mutation
              await ctx.runMutation(internal.referrals.updateReferrerStats, {
                referrerId: referralCodeRecord.userId,
                referralCode,
                commissionAmount,
              });

              // Mark attribution as converted
              await ctx.db.patch(attribution._id, {
                status: 'converted',
                convertedAt: now,
              });

              // If this is the first conversion, update user with permanent referrer relationship
              if (!user.referredBy) {
                await ctx.db.patch(user._id, {
                  referredBy: referralCodeRecord.userId,
                  referredByCode: args.referralCode,
                  referredAt: now,
                });
              }
            }
          }
        }
      } catch (_referralError) {}
    }

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
  handler: async (ctx, _args) => {
    const { user } = await requireAuth(ctx);

    if (user?.subscription) {
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

    const sub = getSafeSubscription(user);
    const tierConfig = SUBSCRIPTION_TIERS[sub.tier];
    const now = Date.now();

    const messageUsagePercent =
      sub.messagesLimit > 0 ? (sub.messagesUsed / sub.messagesLimit) * 100 : 0;
    const premiumUsagePercent =
      sub.premiumMessagesLimit > 0
        ? (sub.premiumMessagesUsed / sub.premiumMessagesLimit) * 100
        : 0;
    const isExpired = sub.currentPeriodEnd < now;

    return {
      tier: sub.tier,
      messagesUsed: sub.messagesUsed,
      messagesLimit: sub.messagesLimit,
      messagesRemaining: Math.max(0, sub.messagesLimit - sub.messagesUsed),
      premiumMessagesUsed: sub.premiumMessagesUsed,
      premiumMessagesLimit: sub.premiumMessagesLimit,
      premiumMessagesRemaining: Math.max(
        0,
        sub.premiumMessagesLimit - sub.premiumMessagesUsed
      ),
      messageUsagePercent,
      premiumUsagePercent,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
      isExpired,
      autoRenew: sub.autoRenew,
      planPriceSol: sub.planPriceSol,
      features: sub.features,
      availableModels: tierConfig.availableModels,
      daysRemaining: Math.max(
        0,
        Math.floor((sub.currentPeriodEnd - now) / (24 * 60 * 60 * 1000))
      ),
    };
  },
});

// Get subscription status (for authenticated users)
export const getSubscriptionStatus = query({
  args: {},
  handler: async (ctx, _args) => {
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

    const sub = getSafeSubscription(user);
    const tierConfig = SUBSCRIPTION_TIERS[sub.tier];
    const now = Date.now();

    const messageUsagePercent =
      sub.messagesLimit > 0 ? (sub.messagesUsed / sub.messagesLimit) * 100 : 0;
    const premiumUsagePercent =
      sub.premiumMessagesLimit > 0
        ? (sub.premiumMessagesUsed / sub.premiumMessagesLimit) * 100
        : 0;
    const isExpired = sub.currentPeriodEnd < now;

    return {
      tier: sub.tier,
      messagesUsed: sub.messagesUsed,
      messagesLimit: sub.messagesLimit,
      messagesRemaining: Math.max(0, sub.messagesLimit - sub.messagesUsed),
      premiumMessagesUsed: sub.premiumMessagesUsed,
      premiumMessagesLimit: sub.premiumMessagesLimit,
      premiumMessagesRemaining: Math.max(
        0,
        sub.premiumMessagesLimit - sub.premiumMessagesUsed
      ),
      messageUsagePercent,
      premiumUsagePercent,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
      isExpired,
      autoRenew: sub.autoRenew,
      planPriceSol: sub.planPriceSol,
      features: sub.features,
      availableModels: tierConfig.availableModels,
      daysRemaining: Math.max(
        0,
        Math.floor((sub.currentPeriodEnd - now) / (24 * 60 * 60 * 1000))
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
        } catch (_error) {}
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
