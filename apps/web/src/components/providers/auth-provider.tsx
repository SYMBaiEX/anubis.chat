'use client';

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
} from 'react';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useAuthActions, useAuthToken } from '@convex-dev/auth/react';
import { useWallet } from '@/hooks/useWallet';
import type { AuthSession, User } from '@/lib/types/api';
import { createModuleLogger } from '@/lib/utils/logger';
import type { SubscriptionStatus, SubscriptionLimits, UpgradePrompt } from '@/hooks/use-subscription';

const log = createModuleLogger('auth-provider');

interface AuthContextValue {
  // Auth state
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  error: string | null;

  // Auth methods
  login: () => Promise<AuthSession | null>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
  clearError: () => void;

  // Wallet integration
  isWalletConnected: boolean;
  walletAddress: string | null;
  publicKey: string | null;

  // Subscription integration
  subscription: SubscriptionStatus | null;
  limits: SubscriptionLimits | null;
  upgradePrompt: UpgradePrompt;
  isSubscriptionLoading: boolean;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const user = useQuery(api.users.getCurrentUserProfile);
  const { signIn, signOut } = useAuthActions();
  const token = useAuthToken();
  const wallet = useWallet();

  // Subscription data from Convex
  const subscription = useQuery(
    api.subscriptions.getSubscriptionStatus,
    user ? {} : 'skip'
  );

  // Calculate subscription limits
  const limits = useMemo((): SubscriptionLimits | null => {
    if (!subscription) return null;

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

  // Calculate upgrade prompts
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

  // Refresh subscription data
  const refreshSubscription = async () => {
    // Force re-query of subscription data (Convex handles this automatically)
    // This is mainly for manual refresh scenarios
  };

  const contextValue: AuthContextValue = useMemo(
    () => ({
      // Auth state - using Convex Auth hooks directly
      isAuthenticated: !!user,
      isLoading: wallet.isConnecting,
      user: user as User | null,
      token: token,
      error: null,

      // Auth methods - using Convex Auth actions 
      login: async () => {
        // This would be handled by your existing wallet auth flow
        return { user: user as User, token: token || '', expiresAt: Date.now() + 3600000 };
      },
      logout: signOut,
      refreshToken: async () => token,
      clearError: () => {},

      // Wallet integration
      isWalletConnected: wallet.isConnected,
      walletAddress: wallet.publicKey?.toString() ?? null,
      publicKey: wallet.publicKey?.toString() ?? null,

      // Subscription integration
      subscription,
      limits,
      upgradePrompt,
      isSubscriptionLoading: subscription === undefined,
      refreshSubscription,
    }),
    [
      user,
      token,
      signOut,
      wallet.isConnecting,
      wallet.isConnected,
      wallet.publicKey,
      subscription,
      limits,
      upgradePrompt,
      refreshSubscription,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

// Convenience hooks for common use cases
// useCurrentUser is now imported directly from @convex-dev/auth/react

export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuthContext();
  return isAuthenticated;
}

// useAuthToken is now imported directly from @convex-dev/auth/react

// Subscription convenience hooks
export function useSubscriptionStatus(): SubscriptionStatus | null {
  const { subscription } = useAuthContext();
  return subscription;
}

export function useSubscriptionLimits(): SubscriptionLimits | null {
  const { limits } = useAuthContext();
  return limits;
}

export function useUpgradePrompt(): UpgradePrompt {
  const { upgradePrompt } = useAuthContext();
  return upgradePrompt;
}

export function useCanSendMessage(): boolean {
  const { limits } = useAuthContext();
  return limits?.canSendMessage ?? false;
}

export function useCanUsePremiumModel(): boolean {
  const { limits } = useAuthContext();
  return limits?.canUsePremiumModel ?? false;
}
