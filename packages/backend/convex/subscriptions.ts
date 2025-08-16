import { v } from 'convex/values';
import { internal } from './_generated/api';
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from './_generated/server';
import type { Id } from './_generated/dataModel';
import { getCurrentUser, requireAuth } from './authHelpers';
import { createModuleLogger } from './utils/logger';

// Create logger instance for this module
const logger = createModuleLogger('subscriptions');

// Subscription tier configurations with monthly and annual pricing
const SUBSCRIPTION_TIERS = {
  free: {
    messagesLimit: 50,
    premiumMessagesLimit: 0,
    priceSol: {
      monthly: 0,
      yearly: 0,
    },
    features: ['basic_chat', 'free_models_only'],
    availableModels: [
      'openrouter/openai/gpt-oss-20b:free',
      'openrouter/z-ai/glm-4.5-air:free',
      'openrouter/qwen/qwen3-coder:free',
      'openrouter/moonshotai/kimi-k2:free',
    ],
  },
  pro: {
    messagesLimit: 500,
    premiumMessagesLimit: 100,
    priceSol: {
      monthly: 0.05,
      yearly: 0.57, // 5% discount (12 months × 0.95)
    },
    features: [
      'free_and_standard_models',
      'limited_premium_access',
      'document_upload',
      'basic_agents',
      'chat_history',
    ],
    availableModels: [
      'openrouter/openai/gpt-oss-20b:free',
      'openrouter/z-ai/glm-4.5-air:free',
      'openrouter/qwen/qwen3-coder:free',
      'openrouter/moonshotai/kimi-k2:free',
      'gpt-5-nano',
      'gpt-4.1-mini',
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash',
    ],
  },
  pro_plus: {
    messagesLimit: 1000,
    premiumMessagesLimit: 300,
    priceSol: {
      monthly: 0.1,
      yearly: 1.14, // 5% discount (12 months × 0.95)
    },
    features: [
      'all_models_access',
      'full_premium_access',
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
      'gpt-5-nano',
      'gpt-5',
      'gpt-5-mini',
      'o4-mini',
      'gpt-4.1-mini',
      'openrouter/openai/gpt-oss-120b',
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash',
    ],
  },
};

// Model cost configurations (for internal tracking)
const MODEL_COSTS = {
  // OpenRouter free models (free tier)
  'openrouter/openai/gpt-oss-20b:free': {
    category: 'free',
    costPerMessage: 0,
  },
  'openrouter/z-ai/glm-4.5-air:free': {
    category: 'free',
    costPerMessage: 0,
  },
  'openrouter/qwen/qwen3-coder:free': {
    category: 'free',
    costPerMessage: 0,
  },
  'openrouter/moonshotai/kimi-k2:free': {
    category: 'free',
    costPerMessage: 0,
  },
  // Standard models (available to Pro+)
  'gpt-5-nano': { category: 'standard', costPerMessage: 0.002 },
  'gpt-4.1-mini': { category: 'standard', costPerMessage: 0.006 },
  'gemini-2.5-flash-lite': { category: 'standard', costPerMessage: 0.003 },
  'gemini-2.0-flash': { category: 'standard', costPerMessage: 0.004 },
  // Premium models (available to Pro+ only)
  'gpt-5': { category: 'premium', costPerMessage: 0.02 },
  'gpt-5-mini': { category: 'premium', costPerMessage: 0.01 },
  'o4-mini': { category: 'premium', costPerMessage: 0.008 },
  'openrouter/openai/gpt-oss-120b': { category: 'premium', costPerMessage: 0.015 },
  'gemini-2.5-pro': { category: 'premium', costPerMessage: 0.02 },
  'gemini-2.5-flash': { category: 'premium', costPerMessage: 0.01 },
};

// Safely normalize a user's subscription so fields are always defined
type Tier = keyof typeof SUBSCRIPTION_TIERS;
type BillingCycle = 'monthly' | 'yearly';
type SubscriptionShape = {
  tier: Tier;
  billingCycle: BillingCycle;
  messagesUsed: number;
  messagesLimit: number;
  premiumMessagesUsed: number;
  premiumMessagesLimit: number;
  messageCredits: number;
  premiumMessageCredits: number;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  planPriceSol: number;
  features: string[];
  subscriptionTxSignature: string;
};

function getSafeSubscription(user: {
  subscription?: Partial<SubscriptionShape> | Record<string, unknown>;
}): SubscriptionShape {
  // If user already has a subscription with a valid tier, normalize numeric fields
  const candidate = user.subscription as Partial<SubscriptionShape> | undefined;
  const validTier = (candidate?.tier ?? 'free') as Tier;
  const billingCycle = (candidate?.billingCycle ?? 'monthly') as BillingCycle;
  const tierDefaults = SUBSCRIPTION_TIERS[validTier];
  const now = Date.now();
  const periodDuration = billingCycle === 'yearly' 
    ? 365 * 24 * 60 * 60 * 1000  // 365 days
    : 30 * 24 * 60 * 60 * 1000;   // 30 days
  
  return {
    tier: validTier,
    billingCycle,
    messagesUsed: candidate?.messagesUsed ?? 0,
    messagesLimit: candidate?.messagesLimit ?? tierDefaults.messagesLimit,
    premiumMessagesUsed: candidate?.premiumMessagesUsed ?? 0,
    premiumMessagesLimit:
      candidate?.premiumMessagesLimit ?? tierDefaults.premiumMessagesLimit,
    messageCredits: candidate?.messageCredits ?? 0,
    premiumMessageCredits: candidate?.premiumMessageCredits ?? 0,
    currentPeriodStart: candidate?.currentPeriodStart ?? now,
    currentPeriodEnd:
      candidate?.currentPeriodEnd ?? now + periodDuration,
    planPriceSol: candidate?.planPriceSol ?? 
      (typeof tierDefaults.priceSol === 'object' 
        ? tierDefaults.priceSol[billingCycle] 
        : tierDefaults.priceSol) ?? 0,
    features: candidate?.features ?? tierDefaults.features,
    subscriptionTxSignature:
      typeof candidate?.subscriptionTxSignature === 'string'
        ? candidate.subscriptionTxSignature
        : '',
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

    // Calculate total available messages (plan + credits)
    const totalStandardAvailable =
      sub.messagesLimit - sub.messagesUsed + sub.messageCredits;
    const totalPremiumAvailable =
      sub.premiumMessagesLimit -
      sub.premiumMessagesUsed +
      sub.premiumMessageCredits;

    // Check premium message availability (for premium models)
    if (modelConfig?.category === 'premium' && totalPremiumAvailable <= 0) {
      return {
        allowed: false,
        reason: 'Premium message limit reached',
        remaining: totalStandardAvailable,
        premiumRemaining: 0,
        suggestedAction:
          totalStandardAvailable <= 0 ? 'upgrade' : 'buy_credits',
      };
    }

    // Check total standard message availability
    if (totalStandardAvailable <= 0) {
      return {
        allowed: false,
        reason: 'Message limit reached',
        remaining: 0,
        premiumRemaining:
          modelConfig?.category === 'premium'
            ? totalPremiumAvailable
            : undefined,
        suggestedAction: 'buy_credits',
      };
    }

    return {
      allowed: true,
      remaining: totalStandardAvailable,
      premiumRemaining:
        modelConfig?.category === 'premium' ? totalPremiumAvailable : undefined,
      planMessagesRemaining: sub.messagesLimit - sub.messagesUsed,
      planPremiumRemaining: sub.premiumMessagesLimit - sub.premiumMessagesUsed,
      creditMessagesRemaining: sub.messageCredits,
      creditPremiumRemaining: sub.premiumMessageCredits,
    };
  },
});

// Get user's subscription payment history
export const getSubscriptionPayments = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    const limit = args.limit || 20;

    const payments = await ctx.db
      .query('subscriptionPayments')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(limit);

    return payments.map((p) => ({
      id: p._id,
      tier: p.tier,
      amountSol: p.amountSol,
      status: p.status,
      txSignature: p.txSignature,
      paymentDate: p.paymentDate,
      periodStart: p.periodStart,
      periodEnd: p.periodEnd,
    }));
  },
});

// Track message usage by wallet address (for HTTP actions) - updated with proper Convex patterns
export const trackMessageUsageByWallet = mutation({
  args: {
    walletAddress: v.string(),
    isPremiumModel: v.boolean(),
    model: v.optional(v.string()),
    inputTokens: v.optional(v.number()),
    outputTokens: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Query user by wallet address using proper Convex patterns
    const user = await ctx.db
      .query('users')
      .withIndex('by_wallet', (q) => q.eq('walletAddress', args.walletAddress))
      .unique();

    if (!user) {
      logger.error('User not found for wallet tracking', { 
        walletAddress: args.walletAddress 
      });
      throw new Error(`User not found for wallet address: ${args.walletAddress}`);
    }

    logger.debug('Processing message usage tracking', { 
      userId: user._id, 
      isPremiumModel: args.isPremiumModel, 
      model: args.model,
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens
    });
    

    // Update user's message counts using proper consumption hierarchy
    const sub = getSafeSubscription(user);
    
    // Calculate available messages
    const planMessagesAvailable = Math.max(0, sub.messagesLimit - sub.messagesUsed);
    const planPremiumAvailable = Math.max(0, sub.premiumMessagesLimit - sub.premiumMessagesUsed);
    
    let updates: { subscription: SubscriptionShape };
    
    if (args.isPremiumModel) {
      // For premium models, consume from plan premium messages first, then premium credits
      if (planPremiumAvailable > 0) {
        // Use plan premium messages first
        updates = {
          subscription: {
            ...sub,
            messagesUsed: sub.messagesUsed + 1,
            premiumMessagesUsed: sub.premiumMessagesUsed + 1,
          },
        };
      } else if (sub.premiumMessageCredits > 0) {
        // Fall back to premium credits
        updates = {
          subscription: {
            ...sub,
            messagesUsed: sub.messagesUsed + 1,
            premiumMessageCredits: sub.premiumMessageCredits - 1,
          },
        };
      } else {
        throw new Error('No premium messages or credits available');
      }
    } else {
      // For standard models, consume from plan messages first, then standard credits
      if (planMessagesAvailable > 0) {
        updates = {
          subscription: {
            ...sub,
            messagesUsed: sub.messagesUsed + 1,
          },
        };
      } else if (sub.messageCredits > 0) {
        // Fall back to message credits
        updates = {
          subscription: {
            ...sub,
            messageCredits: sub.messageCredits - 1,
          },
        };
      } else {
        throw new Error('No standard messages or credits available');
      }
    }

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
    model: v.optional(v.string()),
    inputTokens: v.optional(v.number()),
    outputTokens: v.optional(v.number()),
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

    // Update user's message counts using proper consumption hierarchy
    const sub = getSafeSubscription(user);
    
    // Calculate available messages
    const planMessagesAvailable = Math.max(0, sub.messagesLimit - sub.messagesUsed);
    const planPremiumAvailable = Math.max(0, sub.premiumMessagesLimit - sub.premiumMessagesUsed);
    
    let updates: { subscription: SubscriptionShape };
    
    if (args.isPremiumModel) {
      // For premium models, consume from plan premium messages first, then premium credits
      if (planPremiumAvailable > 0) {
        // Use plan premium messages first
        updates = {
          subscription: {
            ...sub,
            messagesUsed: sub.messagesUsed + 1,
            premiumMessagesUsed: sub.premiumMessagesUsed + 1,
          },
        };
      } else if (sub.premiumMessageCredits > 0) {
        // Fall back to premium credits
        updates = {
          subscription: {
            ...sub,
            messagesUsed: sub.messagesUsed + 1,
            premiumMessageCredits: sub.premiumMessageCredits - 1,
          },
        };
      } else {
        throw new Error('No premium messages or credits available');
      }
    } else {
      // For standard models, consume from plan messages first, then standard credits
      if (planMessagesAvailable > 0) {
        updates = {
          subscription: {
            ...sub,
            messagesUsed: sub.messagesUsed + 1,
          },
        };
      } else if (sub.messageCredits > 0) {
        // Fall back to message credits
        updates = {
          subscription: {
            ...sub,
            messageCredits: sub.messageCredits - 1,
          },
        };
      } else {
        throw new Error('No standard messages or credits available');
      }
    }

    await ctx.db.patch(user._id, {
      ...updates,
      updatedAt: Date.now(),
    });

    // Track detailed usage
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateTimestamp = today.getTime();

    // Track detailed usage following Convex patterns from Context7
    await ctx.db.insert('messageUsage', {
      userId: user._id,
      model: args.model || (args.isPremiumModel ? 'premium' : 'standard'),
      modelCategory: (args.isPremiumModel ? 'premium' : 'standard') as
        | 'premium'
        | 'standard',
      messageCount: 1,
      inputTokens: args.inputTokens || 0,
      outputTokens: args.outputTokens || 0,
      estimatedCost: args.isPremiumModel ? 0.015 : 0.001,
      date: dateTimestamp,
      createdAt: Date.now(),
    });

    // Calculate remaining messages with credits
    const updatedSub = updates.subscription;
    const totalStandardRemaining = Math.max(0, updatedSub.messagesLimit - updatedSub.messagesUsed) + (updatedSub.messageCredits || 0);
    const totalPremiumRemaining = Math.max(0, updatedSub.premiumMessagesLimit - updatedSub.premiumMessagesUsed) + (updatedSub.premiumMessageCredits || 0);

    logger.debug('Message usage tracking completed', { 
      messagesUsed: updatedSub.messagesUsed, 
      messagesRemaining: totalStandardRemaining, 
      premiumMessagesUsed: updatedSub.premiumMessagesUsed,
      premiumMessagesRemaining: totalPremiumRemaining
    });
    
    return {
      messagesUsed: updatedSub.messagesUsed,
      messagesRemaining: totalStandardRemaining,
      premiumMessagesUsed: updatedSub.premiumMessagesUsed,
      premiumMessagesRemaining: args.isPremiumModel ? totalPremiumRemaining : undefined,
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

    // Update user's message counts using consumption hierarchy
    const sub = getSafeSubscription(user);

    // Calculate plan messages available (not used yet)
    const planMessagesAvailable = Math.max(
      0,
      sub.messagesLimit - sub.messagesUsed
    );
    const planPremiumAvailable = Math.max(
      0,
      sub.premiumMessagesLimit - sub.premiumMessagesUsed
    );

    let updates: {
      subscription: SubscriptionShape;
    };

    if (isPremium) {
      // For premium models, consume from plan premium messages first, then premium credits
      if (planPremiumAvailable > 0) {
        // Use plan premium messages first
        updates = {
          subscription: {
            ...sub,
            messagesUsed: sub.messagesUsed + 1,
            premiumMessagesUsed: sub.premiumMessagesUsed + 1,
          },
        };
      } else if (sub.premiumMessageCredits > 0) {
        // Fall back to premium credits
        updates = {
          subscription: {
            ...sub,
            messagesUsed: sub.messagesUsed + 1,
            premiumMessageCredits: sub.premiumMessageCredits - 1,
          },
        };
      } else {
        throw new Error('No premium messages or credits available');
      }
    } else if (planMessagesAvailable > 0) {
      // For standard models, consume from plan messages first, then standard credits
      updates = {
        subscription: {
          ...sub,
          messagesUsed: sub.messagesUsed + 1,
        },
      };
    } else if (sub.messageCredits > 0) {
      // Fall back to message credits
      updates = {
        subscription: {
          ...sub,
          messageCredits: sub.messageCredits - 1,
        },
      };
    } else {
      throw new Error('No standard messages or credits available');
    }

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

    // Calculate remaining messages based on updated subscription
    const totalStandardRemaining =
      Math.max(
        0,
        updates.subscription.messagesLimit - updates.subscription.messagesUsed
      ) + updates.subscription.messageCredits;
    const totalPremiumRemaining =
      Math.max(
        0,
        updates.subscription.premiumMessagesLimit -
          updates.subscription.premiumMessagesUsed
      ) + updates.subscription.premiumMessageCredits;

    return {
      messagesUsed: updates.subscription.messagesUsed,
      messagesRemaining: totalStandardRemaining,
      premiumMessagesUsed: updates.subscription.premiumMessagesUsed,
      premiumMessagesRemaining: isPremium ? totalPremiumRemaining : undefined,
      planMessagesRemaining: Math.max(
        0,
        updates.subscription.messagesLimit - updates.subscription.messagesUsed
      ),
      planPremiumRemaining: Math.max(
        0,
        updates.subscription.premiumMessagesLimit -
          updates.subscription.premiumMessagesUsed
      ),
      creditMessagesRemaining: updates.subscription.messageCredits,
      creditPremiumRemaining: updates.subscription.premiumMessageCredits,
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

    // Get the billing cycle to use for price calculations
    const billingCycle = sub.billingCycle || 'monthly';
    
    // Get prices based on billing cycle
    const getPrice = (tier: 'pro' | 'pro_plus') => {
      const tierPrices = SUBSCRIPTION_TIERS[tier].priceSol;
      return typeof tierPrices === 'object' 
        ? tierPrices[billingCycle]
        : tierPrices;
    };
    
    const targetPrice = getPrice(targetTier);
    
    // Only support Pro to Pro+ proration for now
    if (currentTier !== 'pro' || targetTier !== 'pro_plus') {
      return {
        isProrated: false,
        fullPrice: targetPrice,
        proratedPrice: targetPrice,
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
    const proPrice = getPrice('pro');
    const proPlusPrice = getPrice('pro_plus');
    const periodDays = billingCycle === 'yearly' ? 365 : 30;
    const proPricePerDay = proPrice / periodDays;
    const creditApplied = proPricePerDay * daysRemaining;

    // Calculate prorated price - user pays only for the remaining period difference
    const dailyPriceDifference = (proPlusPrice - proPrice) / periodDays;
    const proratedPrice = Math.max(0, dailyPriceDifference * daysRemaining);

    return {
      isProrated: true,
      fullPrice: targetPrice,
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
    billingCycle: v.optional(v.union(v.literal('monthly'), v.literal('yearly'))),
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
    const billingCycle = args.billingCycle || 'monthly';
    let expectedAmount = typeof tierConfig.priceSol === 'object' 
      ? tierConfig.priceSol[billingCycle]
      : tierConfig.priceSol;

    // Handle prorated upgrade from Pro to Pro+
    const sub = getSafeSubscription(user);
    if (args.isProrated && sub.tier === 'pro' && args.tier === 'pro_plus') {
      const proPriceValue = typeof SUBSCRIPTION_TIERS.pro.priceSol === 'object'
        ? SUBSCRIPTION_TIERS.pro.priceSol[billingCycle]
        : SUBSCRIPTION_TIERS.pro.priceSol;
      const proPlusPriceValue = typeof SUBSCRIPTION_TIERS.pro_plus.priceSol === 'object'
        ? SUBSCRIPTION_TIERS.pro_plus.priceSol[billingCycle]
        : SUBSCRIPTION_TIERS.pro_plus.priceSol;
      expectedAmount = proPlusPriceValue - proPriceValue;
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
    const periodDuration = billingCycle === 'yearly' 
      ? 365 * 24 * 60 * 60 * 1000  // 365 days
      : 30 * 24 * 60 * 60 * 1000;   // 30 days
    const periodEnd = now + periodDuration;

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
    billingCycle: v.optional(v.union(v.literal('monthly'), v.literal('yearly'))),
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
      const billingCycle = args.billingCycle || 'monthly';
      const periodDuration = billingCycle === 'yearly' 
        ? 365 * 24 * 60 * 60 * 1000  // 365 days
        : 30 * 24 * 60 * 60 * 1000;   // 30 days
      
      const paymentId = await ctx.db.insert('subscriptionPayments', {
        userId: user._id,
        tier: args.tier,
        amountSol: args.amountSol,
        amountUsd: args.tier === 'pro' ? 7 : 15, // Set USD amount based on tier
        txSignature: args.txSignature,
        status: 'pending',
        paymentDate: now,
        periodStart: now,
        periodEnd: now + periodDuration,
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
      if (sub.tier !== args.tier) {
        // Subscription might be out of sync - update it
        const tierConfig = SUBSCRIPTION_TIERS[args.tier];
        const billingCycle = args.billingCycle || sub.billingCycle || 'monthly';
        await ctx.db.patch(user._id, {
          subscription: {
            ...sub,
            tier: args.tier,
            billingCycle,
            subscriptionTxSignature: args.txSignature,
            messagesLimit: tierConfig.messagesLimit,
            premiumMessagesLimit: tierConfig.premiumMessagesLimit,
            planPriceSol: typeof tierConfig.priceSol === 'object' 
              ? tierConfig.priceSol[billingCycle]
              : tierConfig.priceSol,
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
    const billingCycle = args.billingCycle || 'monthly';
    const now = Date.now();

    // Calculate period duration based on billing cycle
    const periodDuration = billingCycle === 'yearly' 
      ? 365 * 24 * 60 * 60 * 1000  // 365 days
      : 30 * 24 * 60 * 60 * 1000;   // 30 days
    
    const sub = getSafeSubscription(user);
    let periodEnd = now + periodDuration;
    let periodStart = now;
    let resetUsage = true;

    // Handle different renewal scenarios
    if (args.isProrated && sub.tier === 'pro' && args.tier === 'pro_plus') {
      // Keep the existing billing period and billing cycle for prorated upgrades
      periodStart = sub.currentPeriodStart;
      periodEnd = sub.currentPeriodEnd;
      resetUsage = false; // Don't reset usage counters for mid-cycle upgrades
    } else if (sub.tier === args.tier && sub.currentPeriodEnd > now) {
      // Early renewal: same tier, subscription still active
      // Stack the new period onto the existing end date
      periodStart = sub.currentPeriodStart; // Keep original start
      periodEnd = sub.currentPeriodEnd + periodDuration; // Add new period to existing end
      resetUsage = false; // Don't reset usage for early renewals
    } else if (sub.currentPeriodEnd > now) {
      // Tier change with active subscription: start from current end date
      periodStart = sub.currentPeriodEnd;
      periodEnd = sub.currentPeriodEnd + periodDuration;
      resetUsage = true; // Reset usage for tier changes
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
        billingCycle: args.isProrated ? sub.billingCycle : billingCycle, // Keep existing cycle for prorated, use new for fresh
        messagesUsed: resetUsage ? 0 : sub.messagesUsed,
        messagesLimit: tierConfig.messagesLimit,
        premiumMessagesUsed: resetUsage ? 0 : sub.premiumMessagesUsed,
        premiumMessagesLimit: tierConfig.premiumMessagesLimit,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        subscriptionTxSignature: args.txSignature,
        planPriceSol: typeof tierConfig.priceSol === 'object' 
          ? tierConfig.priceSol[billingCycle]
          : tierConfig.priceSol,
        features: tierConfig.features,
      },
      updatedAt: now,
    });

    // Process referral payout. Referrers earn commission on payments, but we only
    // increment the referrer's totalReferrals on the first-ever subscription conversion
    // for the referred user, not on upgrades/renewals.
    let referralProcessed = false;
    let isFirstConversionForUser = false;

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

          // Determine if this is the user's first confirmed subscription payment
          // Exclude the current payment being processed and only check for other confirmed payments
          const priorPayments = await ctx.db
            .query('subscriptionPayments')
            .withIndex('by_user', (q) => q.eq('userId', user._id))
            .filter((q) => q.eq(q.field('status'), 'confirmed'))
            .filter((q) => q.neq(q.field('_id'), payment._id))
            .collect();
          isFirstConversionForUser = priorPayments.length === 0;

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
              referredUserId: user._id,
              isFirstConversion: isFirstConversionForUser,
            });

            referralProcessed = true;
          }
        }
      } catch (_referralError) {
        // Intentionally ignore referral errors to avoid blocking payment processing
      }
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

            // Determine if this is the user's first confirmed subscription payment
            // Exclude the current payment being processed and only check for other confirmed payments
            const priorPayments = await ctx.db
              .query('subscriptionPayments')
              .withIndex('by_user', (q) => q.eq('userId', user._id))
              .filter((q) => q.eq(q.field('status'), 'confirmed'))
              .filter((q) => q.neq(q.field('_id'), payment._id))
              .collect();
            isFirstConversionForUser = priorPayments.length === 0;

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
                referredUserId: user._id,
                isFirstConversion: isFirstConversionForUser,
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
      } catch (_referralError) {
        // Intentionally ignore referral errors to avoid blocking payment processing
      }
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
      billingCycle: 'monthly' as BillingCycle,
      messagesUsed: 0,
      messagesLimit: tierConfig.messagesLimit,
      premiumMessagesUsed: 0,
      premiumMessagesLimit: tierConfig.premiumMessagesLimit,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      subscriptionTxSignature: '',
      planPriceSol: typeof tierConfig.priceSol === 'object'
        ? tierConfig.priceSol.monthly
        : tierConfig.priceSol,
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
      messageCredits: sub.messageCredits,
      messagesRemaining: Math.max(0, sub.messagesLimit - sub.messagesUsed),
      premiumMessagesUsed: sub.premiumMessagesUsed,
      premiumMessagesLimit: sub.premiumMessagesLimit,
      premiumMessageCredits: sub.premiumMessageCredits,
      premiumMessagesRemaining: Math.max(
        0,
        sub.premiumMessagesLimit - sub.premiumMessagesUsed
      ),
      messageUsagePercent,
      premiumUsagePercent,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
      isExpired,
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
      messageCredits: sub.messageCredits,
      messagesRemaining: Math.max(0, sub.messagesLimit - sub.messagesUsed),
      premiumMessagesUsed: sub.premiumMessagesUsed,
      premiumMessagesLimit: sub.premiumMessagesLimit,
      premiumMessageCredits: sub.premiumMessageCredits,
      premiumMessagesRemaining: Math.max(
        0,
        sub.premiumMessagesLimit - sub.premiumMessagesUsed
      ),
      messageUsagePercent,
      premiumUsagePercent,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
      isExpired,
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

    // Process users in batches to avoid OCC failures
    const BATCH_SIZE = 10;
    let hasMore = true;
    let lastId: Id<'users'> | null = null;
    let totalProcessed = 0;
    let totalReset = 0;

    while (hasMore) {
      // Get a batch of users
      let query = ctx.db.query('users').order('asc');
      if (lastId) {
        // Continue from where we left off
        query = query.filter((q) => q.gt(q.field('_id'), lastId!));
      }
      
      const batch = await query.take(BATCH_SIZE);
      
      if (batch.length === 0) {
        hasMore = false;
        break;
      }

      // Process this batch
      for (const user of batch) {
        totalProcessed++;
        if (
          user.subscription?.currentPeriodEnd &&
          user.subscription.currentPeriodEnd <= now
        ) {
          const periodDuration = user.subscription.billingCycle === 'yearly' 
            ? 365 * 24 * 60 * 60 * 1000  // 365 days for annual
            : 30 * 24 * 60 * 60 * 1000;   // 30 days for monthly
          const periodEnd = now + periodDuration;
          
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
            totalReset++;
          } catch (_error) {
            // ignore individual failures and continue
          }
        }
        lastId = user._id;
      }
      
      // If we got fewer than BATCH_SIZE, we're done
      if (batch.length < BATCH_SIZE) {
        hasMore = false;
      }
    }

    return { success: true, usersReset: totalReset };
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

    await Promise.all(
      quotas.map((quota) =>
        ctx.db.insert('modelQuotas', {
          ...quota,
          updatedAt: Date.now(),
        })
      )
    );

    return { success: true, quotasCreated: quotas.length };
  },
});

// =============================================================================
// Message Credits System
// =============================================================================

// Message credit pack configuration
const MESSAGE_CREDIT_PACK = {
  standard: {
    standardCredits: 150,
    premiumCredits: 25,
    priceSOL: 0.025,
  },
};

// Process message credit purchase (creates pending purchase for verification)
export const purchaseMessageCredits = mutation({
  args: {
    packType: v.literal('standard'),
    txSignature: v.string(),
    amountSol: v.number(),
    numberOfPacks: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireAuth(ctx);

    if (!user.isActive) {
      throw new Error('User account is inactive');
    }

    const packConfig = MESSAGE_CREDIT_PACK[args.packType];
    const numberOfPacks = args.numberOfPacks || 1;
    const expectedAmount = packConfig.priceSOL * numberOfPacks;

    // Verify payment amount
    if (Math.abs(args.amountSol - expectedAmount) > 0.001) {
      throw new Error(
        `Invalid payment amount. Expected: ${expectedAmount} SOL, received: ${args.amountSol} SOL`
      );
    }

    // Check if transaction signature already exists
    const existingPurchase = await ctx.db
      .query('messageCreditPurchases')
      .withIndex('by_signature', (q) => q.eq('txSignature', args.txSignature))
      .first();

    if (existingPurchase) {
      if (existingPurchase.status === 'confirmed') {
        throw new Error('Transaction has already been processed');
      }
      if (existingPurchase.status === 'pending') {
        throw new Error('Transaction is already being verified');
      }
    }

    const now = Date.now();

    // Create pending purchase record
    const purchaseId = await ctx.db.insert('messageCreditPurchases', {
      userId: user._id,
      packType: args.packType,
      standardCredits: packConfig.standardCredits * numberOfPacks,
      premiumCredits: packConfig.premiumCredits * numberOfPacks,
      priceSOL: args.amountSol,
      txSignature: args.txSignature,
      status: 'pending', // Pending verification
      createdAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      purchaseId,
      packType: args.packType,
      standardCredits: packConfig.standardCredits * numberOfPacks,
      premiumCredits: packConfig.premiumCredits * numberOfPacks,
      status: 'pending',
      message: 'Purchase submitted for verification',
    };
  },
});

// Internal mutation to process verified message credit purchase
export const processVerifiedMessageCreditPurchase = internalMutation({
  args: {
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
    referralCode: v.optional(v.string()),
    referralPayoutTx: v.optional(v.string()),
    // Optional extras to allow fallback record creation when client didn't pre-create purchase
    packType: v.optional(v.literal('standard')),
    numberOfPacks: v.optional(v.number()),
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

    // Check if purchase already exists
    let purchase = await ctx.db
      .query('messageCreditPurchases')
      .withIndex('by_signature', (q) => q.eq('txSignature', args.txSignature))
      .first();

    // Fallback: if there is no pre-created purchase record (direct wallet flow), create one now
    if (!purchase) {
      const packConfig = MESSAGE_CREDIT_PACK[args.packType ?? 'standard'];
      const numberOfPacks =
        args.numberOfPacks ??
        Math.max(1, Math.round(args.amountSol / packConfig.priceSOL));
      const now = Date.now();
      const createdId = await ctx.db.insert('messageCreditPurchases', {
        userId: user._id,
        packType: (args.packType ?? 'standard') as 'standard',
        standardCredits: packConfig.standardCredits * numberOfPacks,
        premiumCredits: packConfig.premiumCredits * numberOfPacks,
        priceSOL: args.amountSol,
        txSignature: args.txSignature,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      });
      purchase = await ctx.db.get(createdId);
      if (!purchase) {
        throw new Error('Failed to create message credit purchase record');
      }
    }

    if (purchase.status === 'confirmed') {
      return {
        success: true,
        purchaseId: purchase._id,
        status: 'already_processed',
        message: 'Purchase has already been processed and credits added',
      };
    }

    if (purchase.status !== 'pending') {
      throw new Error(`Purchase is in invalid status: ${purchase.status}`);
    }

    const now = Date.now();

    // Update purchase status to confirmed
    await ctx.db.patch(purchase._id, {
      status: 'confirmed',
      verificationDetails: args.verificationDetails,
      updatedAt: now,
    });

    // Add message credits to user's subscription
    const sub = getSafeSubscription(user);
    await ctx.db.patch(user._id, {
      subscription: {
        ...sub,
        messageCredits: sub.messageCredits + purchase.standardCredits,
        premiumMessageCredits:
          sub.premiumMessageCredits + purchase.premiumCredits,
      },
      updatedAt: now,
    });

    // Process referral payout for message credit purchases
    let referralProcessed = false;

    // Check if user has a permanent referrer (from claimReferral or initial attribution)
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
            // Create referral payout record for message credit purchase
            // Note: Using purchase ID string representation since paymentId expects subscriptionPayments ID
            await ctx.db.insert('referralPayouts', {
              // Using purchase ID string for message credit referrals (schema accepts string)
              paymentId: purchase._id,
              referralCode: referredByCode,
              referrerId: user.referredBy,
              referrerWalletAddress: referrer.walletAddress,
              referredUserId: user._id,
              paymentAmount: args.amountSol,
              commissionRate,
              commissionAmount,
              payoutTxSignature: args.referralPayoutTx || 'PENDING_CREDITS',
              status: args.referralPayoutTx ? 'paid' : 'pending',
              paidAt: args.referralPayoutTx ? now : undefined,
              createdAt: now,
            });

            // Update referrer stats using internal mutation (no increment on referral count for credits)
            await ctx.runMutation(internal.referrals.updateReferrerStats, {
              referrerId: user.referredBy,
              referralCode: referredByCode,
              commissionAmount,
              referredUserId: user._id,
              isFirstConversion: false, // Message credits don't count as new conversions
            });

            referralProcessed = true;
          }
        }
      } catch (_referralError) {
        // Intentionally ignore referral errors to avoid blocking credit processing
      }
    }

    return {
      success: true,
      purchaseId: purchase._id,
      standardCreditsAdded: purchase.standardCredits,
      premiumCreditsAdded: purchase.premiumCredits,
      referralProcessed,
    };
  },
});

// Get user's message credit purchase history
export const getMessageCreditPurchases = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    const limit = args.limit || 20;

    const purchases = await ctx.db
      .query('messageCreditPurchases')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(limit);

    return purchases.map((purchase) => ({
      id: purchase._id,
      packType: purchase.packType,
      standardCredits: purchase.standardCredits,
      premiumCredits: purchase.premiumCredits,
      priceSOL: purchase.priceSOL,
      status: purchase.status,
      txSignature: purchase.txSignature,
      createdAt: purchase.createdAt,
    }));
  },
});

// Summarize total purchased vs remaining message credits for progress tracking
export const getMessageCreditsSummary = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    // Aggregate confirmed purchases (bounded take to a reasonable max)
    const purchases = await ctx.db
      .query('messageCreditPurchases')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(1000);

    let totalStandardPurchased = 0;
    let totalPremiumPurchased = 0;
    for (const purchase of purchases) {
      if (purchase.status === 'confirmed') {
        totalStandardPurchased += purchase.standardCredits;
        totalPremiumPurchased += purchase.premiumCredits;
      }
    }

    const sub = getSafeSubscription(user);
    return {
      totalStandardPurchased,
      totalPremiumPurchased,
      standardRemaining: sub.messageCredits,
      premiumRemaining: sub.premiumMessageCredits,
    };
  },
});

// Check message credit purchase status
export const checkMessageCreditPurchaseStatus = query({
  args: {
    txSignature: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireAuth(ctx);

    const purchase = await ctx.db
      .query('messageCreditPurchases')
      .withIndex('by_signature', (q) => q.eq('txSignature', args.txSignature))
      .first();

    if (!purchase) {
      return { status: 'not_found' };
    }

    // Ensure the purchase belongs to the authenticated user
    if (purchase.userId !== user._id) {
      throw new Error('Purchase access denied');
    }

    return {
      status: purchase.status,
      packType: purchase.packType,
      standardCredits: purchase.standardCredits,
      premiumCredits: purchase.premiumCredits,
      priceSOL: purchase.priceSOL,
      createdAt: purchase.createdAt,
      verificationDetails: purchase.verificationDetails || null,
    };
  },
});

// Get usage forecasting data based on historical usage patterns
export const getUsageForecasting = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    // Admins have unlimited usage
    if (user.role && user.role !== 'user') {
      return {
        isAdmin: true,
        daysUntilStandardExhausted: Number.POSITIVE_INFINITY,
        daysUntilPremiumExhausted: Number.POSITIVE_INFINITY,
        recommendedAction: 'none',
      };
    }

    const sub = getSafeSubscription(user);
    const now = Date.now();
    
    // Get usage data from the last 30 days
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    const recentUsage = await ctx.db
      .query('messageUsage')
      .withIndex('by_user_date', (q) => 
        q.eq('userId', user._id).gte('date', thirtyDaysAgo)
      )
      .collect();

    if (recentUsage.length === 0) {
      // No usage history, return basic info
      const daysInPeriod = Math.ceil(
        (sub.currentPeriodEnd - now) / (24 * 60 * 60 * 1000)
      );
      
      return {
        isAdmin: false,
        daysUntilStandardExhausted: daysInPeriod,
        daysUntilPremiumExhausted: daysInPeriod,
        averageDailyStandard: 0,
        averageDailyPremium: 0,
        recommendedAction: 'none',
        periodEndsAt: sub.currentPeriodEnd,
      };
    }

    // Calculate daily usage averages
    const daysWithUsage = new Set(recentUsage.map(u => u.date)).size;
    const standardUsage = recentUsage
      .filter(u => u.modelCategory === 'standard')
      .reduce((sum, u) => sum + u.messageCount, 0);
    const premiumUsage = recentUsage
      .filter(u => u.modelCategory === 'premium')
      .reduce((sum, u) => sum + u.messageCount, 0);
    
    const avgDailyStandard = daysWithUsage > 0 ? standardUsage / daysWithUsage : 0;
    const avgDailyPremium = daysWithUsage > 0 ? premiumUsage / daysWithUsage : 0;

    // Calculate total available messages (plan + credits)
    const totalStandardAvailable = Math.max(0, sub.messagesLimit - sub.messagesUsed) + sub.messageCredits;
    const totalPremiumAvailable = Math.max(0, sub.premiumMessagesLimit - sub.premiumMessagesUsed) + sub.premiumMessageCredits;

    // Forecast when credits will be exhausted
    let daysUntilStandardExhausted = Number.POSITIVE_INFINITY;
    let daysUntilPremiumExhausted = Number.POSITIVE_INFINITY;

    if (avgDailyStandard > 0) {
      daysUntilStandardExhausted = Math.floor(totalStandardAvailable / avgDailyStandard);
    }

    if (avgDailyPremium > 0) {
      daysUntilPremiumExhausted = Math.floor(totalPremiumAvailable / avgDailyPremium);
    }

    // Determine recommended action
    let recommendedAction = 'none';
    const daysUntilPeriodEnd = Math.ceil((sub.currentPeriodEnd - now) / (24 * 60 * 60 * 1000));
    
    if (daysUntilStandardExhausted < 7) {
      recommendedAction = 'buy_credits';
    } else if (daysUntilStandardExhausted < daysUntilPeriodEnd * 0.5) {
      recommendedAction = 'consider_upgrade';
    } else if (sub.tier === 'free' && avgDailyStandard > sub.messagesLimit / 30) {
      recommendedAction = 'upgrade';
    }

    return {
      isAdmin: false,
      daysUntilStandardExhausted,
      daysUntilPremiumExhausted,
      averageDailyStandard: Math.round(avgDailyStandard * 10) / 10,
      averageDailyPremium: Math.round(avgDailyPremium * 10) / 10,
      recommendedAction,
      periodEndsAt: sub.currentPeriodEnd,
      totalStandardAvailable,
      totalPremiumAvailable,
    };
  },
});
