'use client';

import { useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { useAuthContext } from '@/components/providers/auth-provider';
import { useNotifications, createRenewalNotification, createExpiryNotification } from './use-notifications';

interface UseSubscriptionNotificationsOptions {
  enabled?: boolean;
  checkInterval?: number; // minutes
}

export function useSubscriptionNotifications({
  enabled = true,
  checkInterval = 60, // Check every hour by default
}: UseSubscriptionNotificationsOptions = {}) {
  const { user } = useAuthContext();
  const { addNotification } = useNotifications();

  // Get user's subscription status
  const subscriptionStatus = useQuery(
    api.subscriptionMonitor.getUserSubscriptionStatus,
    user?._id ? { userId: user._id as Id<'users'> } : 'skip'
  );

  useEffect(() => {
    if (!enabled || !subscriptionStatus || !user) {
      return;
    }

    // Handle expired subscription notification
    if (subscriptionStatus.needsExpiryNotification) {
      const expiryNotification = createExpiryNotification(() => {
        // Navigate to pricing page for upgrade
        window.location.href = '/pricing';
      });

      addNotification(expiryNotification);
      return; // Don't show renewal notifications for expired subs
    }

    // Handle renewal notifications for active subscriptions
    if (subscriptionStatus.needsRenewalNotification && subscriptionStatus.daysRemaining > 0) {
      const renewalNotification = createRenewalNotification(
        subscriptionStatus.daysRemaining,
        subscriptionStatus.tier,
        () => {
          // Navigate to pricing page for renewal
          window.location.href = '/pricing';
        }
      );

      addNotification(renewalNotification);
    }
  }, [
    enabled,
    subscriptionStatus?.needsExpiryNotification,
    subscriptionStatus?.needsRenewalNotification,
    subscriptionStatus?.daysRemaining,
    subscriptionStatus?.tier,
    user,
    addNotification,
  ]);

  // Set up periodic checking (optional - mainly for long-running sessions)
  useEffect(() => {
    if (!enabled || checkInterval <= 0) {
      return;
    }

    const intervalId = setInterval(() => {
      // The useQuery will automatically refetch when the component re-renders
      // This interval just ensures we're checking regularly
    }, checkInterval * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [enabled, checkInterval]);

  return {
    subscriptionStatus,
    isLoading: subscriptionStatus === undefined,
    hasActiveSubscription: subscriptionStatus?.isActive ?? false,
    needsRenewal: subscriptionStatus?.needsRenewalNotification ?? false,
    needsUrgentRenewal: subscriptionStatus?.needsUrgentRenewal ?? false,
    isExpired: subscriptionStatus?.isExpired ?? false,
  };
}

/**
 * Hook specifically for showing welcome notifications to new users
 */
export function useWelcomeNotification() {
  const { user } = useAuthContext();
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!user) return;

    // Check if this is a new user (created within last 24 hours)
    const userCreationTime = user.createdAt || Date.now();
    const isNewUser = (Date.now() - userCreationTime) < 24 * 60 * 60 * 1000;
    
    // Check if we've already shown the welcome message
    const hasSeenWelcome = localStorage.getItem(`welcome-shown-${user._id}`);

    if (isNewUser && !hasSeenWelcome) {
      // Create welcome notification
      const welcomeNotification = {
        type: 'welcome' as const,
        title: 'Welcome to ANUBIS Chat!',
        message: 'Your AI companion is ready to assist you. Start a conversation to explore all available models and features.',
        badge: 'New User',
        duration: 8000,
        priority: 'high' as const,
        actions: [
          {
            label: 'Start Chatting',
            variant: 'default' as const,
            onClick: () => {
              // Focus on chat input if available
              const chatInput = document.querySelector('[data-chat-input]') as HTMLElement;
              chatInput?.focus();
            },
          },
          {
            label: 'View Pricing',
            variant: 'outline' as const,
            onClick: () => {
              window.location.href = '/pricing';
            },
          },
        ],
      };

      addNotification(welcomeNotification);
      
      // Mark as shown
      localStorage.setItem(`welcome-shown-${user._id}`, 'true');
    }
  }, [user, addNotification]);
}