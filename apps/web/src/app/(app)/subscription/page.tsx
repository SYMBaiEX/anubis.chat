'use client';

import { AlertTriangle, Calendar, Check, Clock, Crown, TrendingUp, Zap } from 'lucide-react';
import { UpgradeModal } from '@/components/auth/upgrade-modal';
import { UsageIndicator } from '@/components/chat/usage-indicator';
import {
  useAuthContext,
  useSubscriptionLimits,
  useSubscriptionStatus,
  useUpgradePrompt,
} from '@/components/providers/auth-provider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useUpgradeModal } from '@/hooks/use-upgrade-modal';
import { getModelsForTier, isPremiumModel } from '@/lib/constants/ai-models';

export default function SubscriptionPage() {
  const { user } = useAuthContext();
  const subscription = useSubscriptionStatus();
  const limits = useSubscriptionLimits();
  const upgradePrompt = useUpgradePrompt();
  const { isOpen, openModal, closeModal, suggestedTier } = useUpgradeModal();

  if (!subscription) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="font-semibold text-xl">Loading subscription...</h2>
          <p className="text-muted-foreground">
            Please wait while we load your subscription details.
          </p>
        </div>
      </div>
    );
  }

  const usagePercent =
    subscription.messagesLimit > 0
      ? Math.round((subscription.messagesUsed / subscription.messagesLimit) * 100)
      : 0;

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free':
        return 'text-slate-600 dark:text-slate-400';
      case 'pro':
        return 'text-blue-600 dark:text-blue-400';
      case 'pro_plus':
        return 'text-purple-600 dark:text-purple-400';
      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  const getTierBg = (tier: string) => {
    switch (tier) {
      case 'free':
        return 'bg-slate-100 dark:bg-slate-800';
      case 'pro':
        return 'bg-blue-100 dark:bg-blue-900';
      case 'pro_plus':
        return 'bg-purple-100 dark:bg-purple-900';
      default:
        return 'bg-slate-100 dark:bg-slate-800';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isExpiringSoon =
    subscription.tier !== 'free' &&
    (subscription.daysRemaining ?? Number.POSITIVE_INFINITY) <= 7;
  const isNearLimit = usagePercent >= 75;

  const tierForModels: 'free' | 'pro' | 'pro_plus' =
    subscription.tier === 'admin'
      ? 'pro_plus'
      : (subscription.tier as 'free' | 'pro' | 'pro_plus');
  const models = getModelsForTier(tierForModels);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl">Subscription Management</h1>
          <p className="text-muted-foreground">
            Manage your ISIS Chat subscription and billing
          </p>
        </div>
      </div>

      {/* Alerts */}
      {isExpiringSoon && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your {subscription.tier} subscription expires in{' '}
            {subscription.daysRemaining ?? limits?.daysUntilReset ?? 0} days on{' '}
            {formatDate(subscription.currentPeriodEnd)}.
            {subscription.autoRenew
              ? ' Auto-renewal is enabled.'
              : ' Consider renewing to avoid service interruption.'}
          </AlertDescription>
        </Alert>
      )}

      {isNearLimit && (
        <Alert>
          <TrendingUp className="h-4 w-4" />
          <AlertDescription>
            You've used {usagePercent}% of your
            monthly message allowance. Consider upgrading to avoid hitting
            limits.
          </AlertDescription>
        </Alert>
      )}

      {/* Current Subscription */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`rounded-xl p-3 ${getTierBg(subscription.tier)}`}>
              <Crown className={`h-6 w-6 ${getTierColor(subscription.tier)}`} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="font-bold text-2xl capitalize">
                  {subscription.tier} Plan
                </h2>
                {subscription.tier !== 'free' && (
                  <Badge variant="outline">
                    {subscription.planPriceSol} SOL/month
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                {subscription.tier === 'free' &&
                  'Basic features with limited access to AI models'}
                {subscription.tier === 'pro' &&
                  'Enhanced features with premium model access'}
                {subscription.tier === 'pro_plus' &&
                  'Full access to all features and unlimited premium models'}
              </p>
              {subscription.tier !== 'free' && (
                <div className="mt-2 flex items-center gap-4 text-muted-foreground text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Renews {formatDate(subscription.currentPeriodEnd)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {subscription.daysRemaining ?? limits?.daysUntilReset ?? 0} days remaining
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <Button
              onClick={() =>
                openModal({
                  tier: subscription.tier === 'pro' ? 'pro_plus' : 'pro',
                  trigger: 'manual',
                })
              }
              variant={subscription.tier === 'pro_plus' ? 'outline' : 'default'}
            >
              {subscription.tier === 'free' && 'Upgrade Plan'}
              {subscription.tier === 'pro' && 'Upgrade to Pro+'}
              {subscription.tier === 'pro_plus' && 'Manage Billing'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Usage Overview */}
      <Card className="p-6">
        <h3 className="mb-4 font-semibold text-lg">Usage Overview</h3>
        <UsageIndicator showUpgrade={false} variant="detailed" />

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="text-center">
            <div className="font-bold text-2xl">
              {subscription.messagesUsed}
            </div>
            <div className="text-muted-foreground text-sm">Messages Used</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-2xl">
              {limits?.messagesRemaining ?? 0}
            </div>
            <div className="text-muted-foreground text-sm">Messages Left</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-2xl">
              {subscription.premiumMessagesUsed}
            </div>
            <div className="text-muted-foreground text-sm">Premium Used</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-2xl">
              {usagePercent}%
            </div>
            <div className="text-muted-foreground text-sm">Usage Rate</div>
          </div>
        </div>
      </Card>

      {/* Features Comparison */}
      <Card className="p-6">
        <h3 className="mb-6 font-semibold text-lg">Plan Features</h3>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Free Plan */}
          <div
            className={`rounded-lg border p-4 ${subscription.tier === 'free' ? 'border-primary bg-primary/5' : 'border-border'}`}
          >
            <div className="mb-4 text-center">
              <h4 className="font-semibold text-lg">Free</h4>
              <div className="font-bold text-2xl">$0</div>
              <div className="text-muted-foreground text-sm">Forever</div>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                50 messages/month
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Basic AI models
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Chat history
              </li>
              <li className="text-muted-foreground">No premium models</li>
              <li className="text-muted-foreground">Limited document upload</li>
            </ul>
          </div>

          {/* Pro Plan */}
          <div
            className={`rounded-lg border p-4 ${subscription.tier === 'pro' ? 'border-primary bg-primary/5' : 'border-border'}`}
          >
            <div className="mb-4 text-center">
              <h4 className="font-semibold text-lg">Pro</h4>
              <div className="font-bold text-2xl">0.05 SOL</div>
              <div className="text-muted-foreground text-sm">per month</div>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                1,500 messages/month
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                100 premium messages
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                All AI models
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Document upload
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Priority support
              </li>
            </ul>
            {subscription.tier !== 'pro' && (
              <Button
                className="mt-4 w-full"
                onClick={() => openModal({ tier: 'pro', trigger: 'manual' })}
              >
                {subscription.tier === 'free'
                  ? 'Upgrade to Pro'
                  : 'Downgrade to Pro'}
              </Button>
            )}
          </div>

          {/* Pro+ Plan */}
          <div
            className={`rounded-lg border p-4 ${subscription.tier === 'pro_plus' ? 'border-primary bg-primary/5' : 'border-border'}`}
          >
            <div className="mb-4 text-center">
              <h4 className="font-semibold text-lg">Pro+</h4>
              <div className="font-bold text-2xl">0.1 SOL</div>
              <div className="text-muted-foreground text-sm">per month</div>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                3,000 messages/month
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                300 premium messages
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                All AI models
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Large file uploads
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                API access
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Advanced features
              </li>
            </ul>
            {subscription.tier !== 'pro_plus' && (
              <Button
                className="mt-4 w-full"
                onClick={() =>
                  openModal({ tier: 'pro_plus', trigger: 'manual' })
                }
              >
                Upgrade to Pro+
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Available AI Models */}
      <Card className="p-6">
        <h3 className="mb-4 font-semibold text-lg">Available AI Models</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="mb-2 font-medium">Standard Models</h4>
            <div className="space-y-1 text-sm">
              {models.filter((m) => !isPremiumModel(m)).length > 0 ? (
                models
                  .filter((m) => !isPremiumModel(m))
                  .map((model) => (
                    <div className="flex items-center gap-2" key={model.id}>
                      <Check className="h-4 w-4 text-green-500" />
                      {model.name}
                    </div>
                  ))
              ) : (
                <div className="text-muted-foreground">Basic models available</div>
              )}
            </div>
          </div>
          <div>
            <h4 className="mb-2 flex items-center gap-2 font-medium">
              Premium Models
              <Zap className="h-4 w-4 text-amber-500" />
            </h4>
            <div className="space-y-1 text-sm">
              {subscription.tier !== 'free' ? (
                models.filter((m) => isPremiumModel(m)).length > 0 ? (
                  models
                    .filter((m) => isPremiumModel(m))
                    .map((model) => (
                      <div className="flex items-center gap-2" key={model.id}>
                        <Check className="h-4 w-4 text-green-500" />
                        {model.name}
                        <Badge className="text-xs" variant="secondary">
                          Premium
                        </Badge>
                      </div>
                    ))
                ) : (
                  <div className="text-green-600">Premium models included</div>
                )
              ) : (
                <div className="text-muted-foreground">
                  Requires Pro or Pro+ subscription
                </div>
              )}
            </div>
          </div>
        </div>
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
