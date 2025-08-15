'use client';

import { useEffect } from 'react';
import { useMilestoneNotifications } from '@/hooks/useMilestoneNotifications';

/**
 * Provider component that monitors usage milestones and shows toaster notifications
 * Should be placed within the AuthProvider context to access user data
 */
export function MilestoneNotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize the milestone notifications hook
  // This will automatically monitor subscription changes and show notifications
  const { resetMilestoneNotifications } = useMilestoneNotifications();

  // Reset notifications on mount (e.g., on app restart or login)
  useEffect(() => {
    // Only reset if this is a fresh session
    // In a real app, you might want to persist notification state in localStorage
    const hasResetInSession = sessionStorage.getItem('milestones_reset');
    if (!hasResetInSession) {
      resetMilestoneNotifications();
      sessionStorage.setItem('milestones_reset', 'true');
    }
  }, [resetMilestoneNotifications]);

  // This component doesn't render anything itself, it just provides the milestone monitoring
  return <>{children}</>;
}