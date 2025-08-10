'use client';

import { AlertTriangle, Loader, Zap } from 'lucide-react';
import { UpgradeModal } from '@/components/auth/upgrade-modal';
import { UserProfile } from '@/components/auth/user-profile';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSubscription } from '@/hooks/use-subscription';
import { useUpgradeModal } from '@/hooks/use-upgrade-modal';

export default function AccountPage() {
  const { user, isLoading: authLoading } = useAuthContext();
  const {
    subscription,
    limits,
    upgradePrompt,
    isLoading: subscriptionLoading,
    error,
  } = useSubscription();
  const { isOpen, openModal, closeModal, suggestedTier } = useUpgradeModal();

  const isLoading = authLoading || subscriptionLoading;
  const showUpgradeButton =
    subscription &&
    subscription.tier !== 'pro_plus' &&
    subscription.tier !== 'admin';

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl">Account</h1>
          <p className="text-muted-foreground">View and update your profile</p>
        </div>
        {showUpgradeButton && (
          <Button
            className="gap-2"
            onClick={() =>
              openModal({
                tier: subscription.tier === 'pro' ? 'pro_plus' : 'pro',
                trigger: 'manual',
              })
            }
          >
            <Zap className="h-4 w-4" />
            Upgrade Account
          </Button>
        )}
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
            <span className="text-muted-foreground text-sm">
              Loading account data...
            </span>
          </div>
        ) : user ? (
          <UserProfile
            limits={limits}
            subscription={subscription}
            upgradePrompt={upgradePrompt}
            user={user}
          />
        ) : (
          <div className="text-muted-foreground text-sm">No user loaded.</div>
        )}
      </Card>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={isOpen}
        onClose={closeModal}
        suggestedTier={suggestedTier}
        trigger="manual"
      />
    </div>
  );
}
