'use client';

import { UserProfile } from '@/components/auth/user-profile';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Card } from '@/components/ui/card';
import { useSubscription } from '@/hooks/use-subscription';
import { AlertTriangle, Loader } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AccountPage() {
  const { user, isLoading: authLoading } = useAuthContext();
  const { subscription, limits, upgradePrompt, isLoading: subscriptionLoading, error } = useSubscription();

  const isLoading = authLoading || subscriptionLoading;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-semibold text-2xl">Account</h1>
        <p className="text-muted-foreground">View and update your profile</p>
      </div>

      {/* Show upgrade prompt if needed */}
      {upgradePrompt && upgradePrompt.shouldShow && (
        <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
          <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            <strong>{upgradePrompt.title}</strong>
            <p className="mt-1 text-sm">{upgradePrompt.message}</p>
          </AlertDescription>
        </Alert>
      )}

      {/* Error state */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Unable to load subscription data. Please refresh the page.
          </AlertDescription>
        </Alert>
      )}

      <Card className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="mr-2 h-4 w-4 animate-spin" />
            <span className="text-muted-foreground text-sm">Loading account data...</span>
          </div>
        ) : user ? (
          <UserProfile 
            user={user} 
            subscription={subscription}
            limits={limits}
            upgradePrompt={upgradePrompt}
          />
        ) : (
          <div className="text-muted-foreground text-sm">No user loaded.</div>
        )}
      </Card>
    </div>
  );
}
