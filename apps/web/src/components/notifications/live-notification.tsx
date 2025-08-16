'use client';

import { AlertTriangle, CheckCircle, Clock, Info, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface NotificationAction {
  label: string;
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  onClick: () => void;
}

export interface LiveNotification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'renewal' | 'welcome';
  title: string;
  message: string;
  badge?: string;
  actions?: NotificationAction[];
  dismissible?: boolean;
  duration?: number; // ms, 0 for persistent
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

interface LiveNotificationProps {
  notification: LiveNotification;
  onDismiss: (id: string) => void;
  onAction?: (id: string, actionIndex: number) => void;
}

const getNotificationIcon = (type: LiveNotification['type']) => {
  switch (type) {
    case 'info':
      return <Info className="h-5 w-5" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5" />;
    case 'success':
      return <CheckCircle className="h-5 w-5" />;
    case 'renewal':
      return <Clock className="h-5 w-5" />;
    case 'welcome':
      return <Info className="h-5 w-5" />;
    default:
      return <Info className="h-5 w-5" />;
  }
};

const getNotificationColors = (type: LiveNotification['type']) => {
  switch (type) {
    case 'info':
      return {
        border: 'border-blue-200 dark:border-blue-800',
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        icon: 'text-blue-600 dark:text-blue-400',
        title: 'text-blue-900 dark:text-blue-100',
      };
    case 'warning':
      return {
        border: 'border-yellow-200 dark:border-yellow-800',
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        icon: 'text-yellow-600 dark:text-yellow-400',
        title: 'text-yellow-900 dark:text-yellow-100',
      };
    case 'success':
      return {
        border: 'border-green-200 dark:border-green-800',
        bg: 'bg-green-50 dark:bg-green-900/20',
        icon: 'text-green-600 dark:text-green-400',
        title: 'text-green-900 dark:text-green-100',
      };
    case 'renewal':
      return {
        border: 'border-orange-200 dark:border-orange-800',
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        icon: 'text-orange-600 dark:text-orange-400',
        title: 'text-orange-900 dark:text-orange-100',
      };
    case 'welcome':
      return {
        border: 'border-purple-200 dark:border-purple-800',
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        icon: 'text-purple-600 dark:text-purple-400',
        title: 'text-purple-900 dark:text-purple-100',
      };
    default:
      return {
        border: 'border-gray-200 dark:border-gray-800',
        bg: 'bg-gray-50 dark:bg-gray-900/20',
        icon: 'text-gray-600 dark:text-gray-400',
        title: 'text-gray-900 dark:text-gray-100',
      };
  }
};

export function LiveNotificationCard({
  notification,
  onDismiss,
  onAction,
}: LiveNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const colors = getNotificationColors(notification.type);

  useEffect(() => {
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onDismiss(notification.id), 300); // Allow fade animation
      }, notification.duration);

      return () => clearTimeout(timer);
    }
  }, [notification.duration, notification.id, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(notification.id), 300);
  };

  const handleAction = (actionIndex: number) => {
    onAction?.(notification.id, actionIndex);
  };

  return (
    <Card
      className={cn(
        'p-4 transition-all duration-300 ease-in-out',
        colors.border,
        colors.bg,
        isVisible
          ? 'translate-y-0 opacity-100'
          : '-translate-y-2 pointer-events-none opacity-0'
      )}
    >
      <div className="flex items-start space-x-3">
        <div className={cn('mt-0.5 flex-shrink-0', colors.icon)}>
          {getNotificationIcon(notification.type)}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h4 className={cn('font-semibold text-sm', colors.title)}>
                  {notification.title}
                </h4>
                {notification.badge && (
                  <Badge size="sm" variant="secondary">
                    {notification.badge}
                  </Badge>
                )}
              </div>
              <p className="text-gray-600 text-sm dark:text-gray-400">
                {notification.message}
              </p>
            </div>

            {notification.dismissible !== false && (
              <Button
                className="h-6 w-6 flex-shrink-0 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
                onClick={handleDismiss}
                size="sm"
                variant="ghost"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {notification.actions && notification.actions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {notification.actions.map((action, index) => (
                <Button
                  className="text-xs"
                  key={index}
                  onClick={() => handleAction(index)}
                  size="sm"
                  variant={action.variant || 'default'}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

interface LiveNotificationManagerProps {
  notifications: LiveNotification[];
  onDismiss: (id: string) => void;
  onAction?: (id: string, actionIndex: number) => void;
  maxVisible?: number;
  position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center';
}

export function LiveNotificationManager({
  notifications,
  onDismiss,
  onAction,
  maxVisible = 5,
  position = 'top-right',
}: LiveNotificationManagerProps) {
  // Sort by priority (urgent > high > medium > low) and then by creation time
  const sortedNotifications = [...notifications]
    .sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority || 'medium'];
      const bPriority = priorityOrder[b.priority || 'medium'];

      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }

      // If same priority, newer notifications first
      return 0; // Assuming notifications array is already in chronological order
    })
    .slice(0, maxVisible);

  const getPositionClasses = () => {
    const base = 'fixed z-50 pointer-events-none';
    switch (position) {
      case 'top-right':
        return `${base} top-4 right-4`;
      case 'top-left':
        return `${base} top-4 left-4`;
      case 'bottom-right':
        return `${base} bottom-4 right-4`;
      case 'bottom-left':
        return `${base} bottom-4 left-4`;
      case 'top-center':
        return `${base} top-4 left-1/2 transform -translate-x-1/2`;
      default:
        return `${base} top-4 right-4`;
    }
  };

  if (sortedNotifications.length === 0) {
    return null;
  }

  return (
    <div className={getPositionClasses()}>
      <div className="pointer-events-auto w-80 max-w-sm space-y-2">
        {sortedNotifications.map((notification) => (
          <LiveNotificationCard
            key={notification.id}
            notification={notification}
            onAction={onAction}
            onDismiss={onDismiss}
          />
        ))}
      </div>
    </div>
  );
}
