'use client';

import React, { createContext, useContext, type ReactNode } from 'react';
import { LiveNotificationManager } from '@/components/notifications/live-notification';
import { useNotifications } from '@/hooks/use-notifications';
import { useSubscriptionNotifications, useWelcomeNotification } from '@/hooks/use-subscription-notifications';

const NotificationContext = createContext<ReturnType<typeof useNotifications> | null>(null);

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
        notifications={notificationManager.notifications}
        onDismiss={notificationManager.dismissNotification}
        onAction={notificationManager.handleNotificationAction}
        maxVisible={5}
        position="top-right"
      />
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}