'use client';

import { useState, useCallback, useEffect } from 'react';
import type { LiveNotification } from '@/components/notifications/live-notification';

interface UseNotificationsReturn {
  notifications: LiveNotification[];
  addNotification: (notification: Omit<LiveNotification, 'id'>) => string;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
  handleNotificationAction: (id: string, actionIndex: number) => void;
}

let notificationId = 0;

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);

  const addNotification = useCallback((notification: Omit<LiveNotification, 'id'>) => {
    const id = `notification-${++notificationId}`;
    const newNotification: LiveNotification = {
      ...notification,
      id,
      dismissible: notification.dismissible ?? true,
      priority: notification.priority ?? 'medium',
    };

    setNotifications((prev) => [newNotification, ...prev]);
    return id;
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const handleNotificationAction = useCallback((id: string, actionIndex: number) => {
    const notification = notifications.find((n) => n.id === id);
    if (notification?.actions?.[actionIndex]) {
      notification.actions[actionIndex].onClick();
      // Auto-dismiss after action unless it's a persistent notification
      if (notification.dismissible !== false) {
        dismissNotification(id);
      }
    }
  }, [notifications, dismissNotification]);

  return {
    notifications,
    addNotification,
    dismissNotification,
    clearAllNotifications,
    handleNotificationAction,
  };
}

// Preset notification creators for common use cases
export function createWelcomeNotification(userName?: string): Omit<LiveNotification, 'id'> {
  return {
    type: 'welcome',
    title: `Welcome to ANUBIS Chat${userName ? `, ${userName}` : ''}!`,
    message: 'Your AI companion is ready to assist you. Start a conversation to explore all available models and features.',
    badge: 'New User',
    duration: 8000,
    priority: 'high',
    actions: [
      {
        label: 'Start Chatting',
        variant: 'default',
        onClick: () => {
          // Navigate to chat or focus on chat input
          const chatInput = document.querySelector('[data-chat-input]') as HTMLElement;
          chatInput?.focus();
        },
      },
      {
        label: 'View Pricing',
        variant: 'outline',
        onClick: () => {
          window.location.href = '/pricing';
        },
      },
    ],
  };
}

export function createRenewalNotification(
  daysRemaining: number,
  tier: string,
  onRenewClick: () => void
): Omit<LiveNotification, 'id'> {
  const isUrgent = daysRemaining <= 3;
  const isWarning = daysRemaining <= 7;
  
  return {
    type: 'renewal',
    title: `Subscription ${isUrgent ? 'Expires Soon' : 'Renewal Reminder'}`,
    message: `Your ${tier} subscription ${daysRemaining <= 1 
      ? 'expires today' 
      : `expires in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`
    }. Renew now to continue enjoying premium features.`,
    badge: isUrgent ? 'Urgent' : 'Reminder',
    duration: 0, // Persistent
    priority: isUrgent ? 'urgent' : isWarning ? 'high' : 'medium',
    dismissible: !isUrgent, // Can't dismiss urgent renewals
    actions: [
      {
        label: 'Renew Now',
        variant: 'default',
        onClick: onRenewClick,
      },
      {
        label: 'View Details',
        variant: 'outline',
        onClick: () => {
          window.location.href = '/dashboard';
        },
      },
    ],
  };
}

export function createExpiryNotification(
  onUpgradeClick: () => void
): Omit<LiveNotification, 'id'> {
  return {
    type: 'warning',
    title: 'Subscription Expired',
    message: 'Your subscription has expired and you\'ve been moved to the free tier. Upgrade to restore your premium features.',
    badge: 'Expired',
    duration: 0, // Persistent
    priority: 'urgent',
    dismissible: false,
    actions: [
      {
        label: 'Upgrade Now',
        variant: 'default',
        onClick: onUpgradeClick,
      },
      {
        label: 'View Plans',
        variant: 'outline',
        onClick: () => {
          window.location.href = '/pricing';
        },
      },
    ],
  };
}

export function createUsageNotification(
  percentage: number,
  messageType: 'standard' | 'premium',
  remaining: number,
  onUpgradeClick: () => void
): Omit<LiveNotification, 'id'> {
  const isNearLimit = percentage >= 90;
  const type = messageType === 'premium' ? 'Premium' : 'Standard';
  
  return {
    type: isNearLimit ? 'warning' : 'info',
    title: `${type} Message Usage Alert`,
    message: `You've used ${percentage}% of your ${messageType} messages. ${remaining} messages remaining this cycle.`,
    badge: `${percentage}%`,
    duration: isNearLimit ? 0 : 6000,
    priority: isNearLimit ? 'high' : 'medium',
    actions: isNearLimit ? [
      {
        label: 'Upgrade Plan',
        variant: 'default',
        onClick: onUpgradeClick,
      },
      {
        label: 'Buy Credits',
        variant: 'outline',
        onClick: () => {
          window.location.href = '/pricing';
        },
      },
    ] : undefined,
  };
}

export function createEarlyRenewalNotification(
  newExpiryDate: string,
  tier: string
): Omit<LiveNotification, 'id'> {
  return {
    type: 'success',
    title: 'Subscription Renewed Successfully!',
    message: `Your ${tier} subscription has been extended. New expiry date: ${newExpiryDate}`,
    badge: 'Renewed',
    duration: 5000,
    priority: 'high',
    actions: [
      {
        label: 'View Dashboard',
        variant: 'outline',
        onClick: () => {
          window.location.href = '/dashboard';
        },
      },
    ],
  };
}