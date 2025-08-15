'use client';

import { api } from '@convex/_generated/api';
import { useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useAuthContext } from '@/components/providers/auth-provider';

export interface UsageMilestone {
  percentage: number;
  messageType: 'standard' | 'premium';
  remaining: number;
}

interface MilestoneToastOptions {
  milestone: UsageMilestone;
  showUpgradeButton?: boolean;
}

export function useMilestoneNotifications() {
  const router = useRouter();
  const { user } = useAuthContext();
  const notifiedMilestonesRef = useRef<Set<string>>(new Set());
  const lastUsageRef = useRef<{
    standardUsed: number;
    premiumUsed: number;
  }>({ standardUsed: 0, premiumUsed: 0 });

  // Get subscription data to monitor usage changes
  const subscription = useQuery(api.subscriptions.getSubscriptionStatus);

  const showMilestoneNotification = useCallback(
    ({ milestone, showUpgradeButton = true }: MilestoneToastOptions) => {
      const milestoneKey = `${milestone.messageType}-${milestone.percentage}`;
      
      // Prevent duplicate notifications for the same milestone
      if (notifiedMilestonesRef.current.has(milestoneKey)) {
        return;
      }
      
      notifiedMilestonesRef.current.add(milestoneKey);

      const messageTypeLabel = milestone.messageType === 'premium' ? 'Premium' : 'Standard';
      const title = `${milestone.percentage}% ${messageTypeLabel} Messages Used`;
      
      let description = `You have ${milestone.remaining} ${milestone.messageType} messages remaining.`;
      
      // Customize message based on percentage
      if (milestone.percentage >= 90) {
        description = `You're running low on ${milestone.messageType} messages! Only ${milestone.remaining} remaining.`;
      } else if (milestone.percentage >= 75) {
        description = `You've used most of your ${milestone.messageType} messages. ${milestone.remaining} remaining.`;
      } else if (milestone.percentage >= 50) {
        description = `You're halfway through your ${milestone.messageType} message limit. ${milestone.remaining} remaining.`;
      }

      // Show different toasts based on severity
      if (milestone.percentage >= 90) {
        toast.error(title, {
          description,
          duration: 8000,
          action: showUpgradeButton
            ? {
                label: 'Buy Credits',
                onClick: () => router.push('/subscription'),
              }
            : undefined,
        });
      } else if (milestone.percentage >= 75) {
        toast.warning(title, {
          description,
          duration: 6000,
          action: showUpgradeButton
            ? {
                label: 'Upgrade Plan',
                onClick: () => router.push('/subscription'),
              }
            : undefined,
        });
      } else {
        toast.info(title, {
          description,
          duration: 4000,
          action: showUpgradeButton
            ? {
                label: 'View Plans',
                onClick: () => router.push('/subscription'),
              }
            : undefined,
        });
      }
    },
    [router]
  );

  // Monitor subscription changes and detect milestone crossings
  useEffect(() => {
    if (!subscription || !user || subscription.isAdmin) return;

    const standardUsed = subscription?.messagesUsed || 0;
    const premiumUsed = subscription?.premiumMessagesUsed || 0;

    // Check if usage has increased (new message sent)
    const standardIncreased = standardUsed > lastUsageRef.current.standardUsed;
    const premiumIncreased = premiumUsed > lastUsageRef.current.premiumUsed;

    if (standardIncreased || premiumIncreased) {
      // Calculate usage percentages including credits
      const standardLimit = (subscription?.messagesLimit || 0) + (subscription?.messageCredits || 0);
      const premiumLimit = (subscription?.premiumMessagesLimit || 0) + (subscription?.premiumMessageCredits || 0);

      const standardPercentage = standardLimit > 0 ? (standardUsed / standardLimit) * 100 : 0;
      const premiumPercentage = premiumLimit > 0 ? (premiumUsed / premiumLimit) * 100 : 0;

      // Check milestones for standard messages
      if (standardIncreased) {
        const standardRemaining = Math.max(0, standardLimit - standardUsed);
        checkMilestone(standardPercentage, 'standard', standardRemaining);
      }

      // Check milestones for premium messages
      if (premiumIncreased) {
        const premiumRemaining = Math.max(0, premiumLimit - premiumUsed);
        checkMilestone(premiumPercentage, 'premium', premiumRemaining);
      }

      // Update last usage tracking
      lastUsageRef.current = {
        standardUsed,
        premiumUsed,
      };
    }
  }, [subscription, user]);

  const checkMilestone = useCallback((percentage: number, messageType: 'standard' | 'premium', remaining: number) => {
    const milestones = [50, 75, 90];
    
    for (const milestone of milestones) {
      if (percentage >= milestone && percentage < (milestone + 10)) { // 10% buffer for detection
        const milestoneKey = `${messageType}-${milestone}`;
        
        // Only show if we haven't notified about this milestone yet
        if (!notifiedMilestonesRef.current.has(milestoneKey)) {
          showMilestoneNotification({
            milestone: {
              percentage: milestone,
              messageType,
              remaining,
            },
          });
          break; // Only show the first milestone we hit
        }
      }
    }
  }, [showMilestoneNotification]);

  const clearNotifiedMilestones = useCallback(() => {
    notifiedMilestonesRef.current.clear();
  }, []);

  // Clear notifications at the start of each billing period
  const resetMilestoneNotifications = useCallback(() => {
    clearNotifiedMilestones();
    lastUsageRef.current = { standardUsed: 0, premiumUsed: 0 };
  }, [clearNotifiedMilestones]);

  return {
    showMilestoneNotification,
    clearNotifiedMilestones,
    resetMilestoneNotifications,
  };
}