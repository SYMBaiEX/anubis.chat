'use client';

import React, { createContext, type ReactNode, useContext } from 'react';
import { LiveNotificationManager } from '@/components/notifications/live-notification';
import { useNotifications } from '@/hooks/use-notifications';
import {
  useSubscriptionNotifications,
  useWelcomeNotification,
} from '@/hooks/use-subscription-notifications';

const NotificationContext = createContext<ReturnType<
  typeof useNotifications
> | null>(null);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const notificationManager = useNotifications();

  // Initialize subscription and welcome notifications
  useSubscriptionNotifications();
  useWelcomeNotification();

  return (
    <NotificationContext.Provider value={notificationManager}>
      {children}
      <LiveNotificationManager
        maxVisible={5}
        notifications={notificationManager.notifications}
        onAction={notificationManager.handleNotificationAction}
        onDismiss={notificationManager.dismissNotification}
        position="top-right"
      />
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotificationContext must be used within a NotificationProvider'
    );
  }
  return context;
}
