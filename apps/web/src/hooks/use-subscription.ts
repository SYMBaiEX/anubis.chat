'use client';

import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useMemo } from 'react';

export interface SubscriptionStatus {
  tier: 'free' | 'pro' | 'pro_plus';
  messagesUsed: number;
  messagesLimit: number;
  premiumMessagesUsed: number;
  premiumMessagesLimit: number;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  autoRenew: boolean;
  planPriceSol: number;
  features: string[];
}

export interface SubscriptionLimits {
  canSendMessage: boolean;
  canUsePremiumModel: boolean;
  canUploadLargeFiles: boolean;
  canAccessAdvancedFeatures: boolean;
  canUseAPI: boolean;
  messagesRemaining: number;
  premiumMessagesRemaining: number;
  daysUntilReset: number;
}

export interface UpgradePrompt {
  shouldShow: boolean;
  title: string;
  message: string;
  suggestedTier: 'pro' | 'pro_plus' | null;
  urgency: 'low' | 'medium' | 'high';
}

export function useSubscription() {
  const user = useQuery(api.users.getCurrentUserProfile);
  
  const subscription = useQuery(
    api.subscriptions.getSubscriptionStatus,
    user ? {} : 'skip'
  );

  const limits = useMemo((): SubscriptionLimits => {
    if (!subscription) {
      return {
        canSendMessage: false,
        canUsePremiumModel: false,
        canUploadLargeFiles: false,
        canAccessAdvancedFeatures: false,
        canUseAPI: false,
        messagesRemaining: 0,
        premiumMessagesRemaining: 0,
        daysUntilReset: 0,
      };
    }

    const messagesRemaining = Math.max(0, subscription.messagesLimit - subscription.messagesUsed);
    const premiumMessagesRemaining = Math.max(0, subscription.premiumMessagesLimit - subscription.premiumMessagesUsed);
    const msUntilReset = subscription.currentPeriodEnd - Date.now();
    const daysUntilReset = Math.max(0, Math.ceil(msUntilReset / (1000 * 60 * 60 * 24)));

    return {
      canSendMessage: messagesRemaining > 0,
      canUsePremiumModel: premiumMessagesRemaining > 0 && subscription.tier !== 'free',
      canUploadLargeFiles: subscription.tier === 'pro_plus',
      canAccessAdvancedFeatures: subscription.tier === 'pro_plus',
      canUseAPI: subscription.tier === 'pro_plus',
      messagesRemaining,
      premiumMessagesRemaining,
      daysUntilReset,
    };
  }, [subscription]);

  const upgradePrompt = useMemo((): UpgradePrompt => {
    if (!subscription) {
      return {
        shouldShow: false,
        title: '',
        message: '',
        suggestedTier: null,
        urgency: 'low',
      };
    }

    const usagePercentage = (subscription.messagesUsed / subscription.messagesLimit) * 100;
    const premiumUsagePercentage = subscription.premiumMessagesLimit > 0 
      ? (subscription.premiumMessagesUsed / subscription.premiumMessagesLimit) * 100 
      : 0;

    // Critical usage (>95%)
    if (usagePercentage >= 95) {
      return {
        shouldShow: true,
        title: 'Message Limit Reached',
        message: `You've used ${subscription.messagesUsed}/${subscription.messagesLimit} messages this month. Upgrade to continue chatting.`,
        suggestedTier: subscription.tier === 'free' ? 'pro' : 'pro_plus',
        urgency: 'high',
      };
    }

    // High premium usage (>90%)
    if (premiumUsagePercentage >= 90 && subscription.tier !== 'pro_plus') {
      return {
        shouldShow: true,
        title: 'Premium Messages Running Low',
        message: `You've used ${subscription.premiumMessagesUsed}/${subscription.premiumMessagesLimit} premium messages. Upgrade for unlimited access.`,
        suggestedTier: 'pro_plus',
        urgency: 'high',
      };
    }

    // Warning threshold (>75%)
    if (usagePercentage >= 75) {
      return {
        shouldShow: true,
        title: 'Usage Warning',
        message: `You've used ${Math.round(usagePercentage)}% of your monthly messages. Consider upgrading to avoid interruptions.`,
        suggestedTier: subscription.tier === 'free' ? 'pro' : 'pro_plus',
        urgency: 'medium',
      };
    }

    // Free tier encouragement (>50%)
    if (subscription.tier === 'free' && usagePercentage >= 50) {
      return {
        shouldShow: true,
        title: 'Enjoying ISIS Chat?',
        message: `You've used ${subscription.messagesUsed} messages. Upgrade to Pro for 30x more messages and premium AI models.`,
        suggestedTier: 'pro',
        urgency: 'low',
      };
    }

    return {
      shouldShow: false,
      title: '',
      message: '',
      suggestedTier: null,
      urgency: 'low',
    };
  }, [subscription]);

  return {
    subscription,
    limits,
    upgradePrompt,
    isLoading: subscription === undefined,
    error: null, // Add error handling if needed
  };
}

// Helper functions for feature gating
export function requiresPremium(feature: 'advanced_agents' | 'api_access' | 'large_files' | 'priority_support') {
  return feature === 'api_access' || feature === 'large_files' || feature === 'priority_support' ? 'pro_plus' : 'pro';
}

export function canAccessFeature(tier: string, feature: string): boolean {
  const tierLevel = tier === 'pro_plus' ? 2 : tier === 'pro' ? 1 : 0;
  const requiredTier = requiresPremium(feature as any);
  const requiredLevel = requiredTier === 'pro_plus' ? 2 : 1;
  
  return tierLevel >= requiredLevel;
}