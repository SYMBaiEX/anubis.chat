'use client';

import { AlertTriangle, Calendar, Crown, TrendingUp, Zap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { UpgradeModal } from '@/components/auth/upgrade-modal';
import { UsageIndicator } from '@/components/chat/usage-indicator';
import {
  useSubscriptionLimits,
  useSubscriptionStatus,
} from '@/components/providers/auth-provider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useUpgradeModal } from '@/hooks/use-upgrade-modal';
import { getModelsForTier, isPremiumModel } from '@/lib/constants/ai-models';

export default function SubscriptionPage() {
  const subscription = useSubscriptionStatus();
  const limits = useSubscriptionLimits();
  const { isOpen, openModal, closeModal, suggestedTier } = useUpgradeModal();
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | 'pro_plus'>(
    () => {
      const tier = subscription?.tier ?? 'free';
      return tier === 'admin'
        ? 'pro_plus'
        : (tier as 'free' | 'pro' | 'pro_plus');
    }
  );

  // Compute preview unconditionally to keep hook order stable between renders
  const preview = useMemo(() => {
    const list = getModelsForTier(selectedPlan);
    const standard = list.filter((m) => !isPremiumModel(m));
    const premium = list.filter((m) => isPremiumModel(m));
    return {
      standardPreview: standard.slice(0, 4),
      premiumPreview: premium.slice(0, 2),
      standardTotal: standard.length,
      premiumTotal: premium.length,
    };
  }, [selectedPlan]);

  useEffect(() => {
    if (!subscription) {
      return;
    }
    const tier = subscription.tier === 'admin' ? 'pro_plus' : subscription.tier;
    setSelectedPlan(tier as 'free' | 'pro' | 'pro_plus');
  }, [subscription, subscription?.tier]);

  if (!subscription) {
    return (
      <div className="flex items-center justify-center py-16">
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
      ? Math.round(
          (subscription.messagesUsed / subscription.messagesLimit) * 100
        )
      : 0;

  const _getTierColor = (tier: string) => {
    if (tier === 'pro_plus') {
      return 'text-purple-600 dark:text-purple-400';
    }
    if (tier === 'pro') {
      return 'text-blue-600 dark:text-blue-400';
    }
    return 'text-slate-600 dark:text-slate-400';
  };

  const _getTierBg = (tier: string) => {
    if (tier === 'pro_plus') {
      return 'bg-purple-100 dark:bg-purple-900';
    }
    if (tier === 'pro') {
      return 'bg-blue-100 dark:bg-blue-900';
    }
    return 'bg-slate-100 dark:bg-slate-800';
  };

  const _formatDate = (timestamp: number) => {
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
  const _models = getModelsForTier(tierForModels);

  const formatTierLabel = (tier: string): string => {
    switch (tier) {
      case 'pro_plus':
        return 'Pro+';
      case 'pro':
        return 'Pro';
      case 'free':
        return 'Free';
      default:
        return tier;
    }
  };

  return (
    <div className="w-full overflow-x-hidden bg-gradient-to-b from-primary/5 dark:from-primary/10">
      {/* Full-width header */}
      <div className="w-full p-4 md:p-6">
        <div className="mx-auto w-full max-w-6xl">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h1 className="whitespace-nowrap bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text font-semibold text-2xl text-transparent sm:text-3xl">
                Subscription Management
              </h1>
              <p className="text-muted-foreground">
                Manage your anubis.chat subscription and billing
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Constrained content */}
      <div className="mx-auto w-full max-w-6xl space-y-4 px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
        <Alerts
          currentPeriodEnd={subscription.currentPeriodEnd}
          daysRemaining={
            subscription.daysRemaining ?? limits?.daysUntilReset ?? 0
          }
          isExpiringSoon={isExpiringSoon}
          isNearLimit={isNearLimit}
          tierLabel={formatTierLabel(subscription.tier)}
          usagePercent={usagePercent}
        />

        <CurrentSubscriptionCard
          currentPeriodEnd={subscription.currentPeriodEnd}
          daysRemaining={
            subscription.daysRemaining ?? limits?.daysUntilReset ?? 0
          }
          onManage={() =>
            openModal({
              tier: subscription.tier === 'pro' ? 'pro_plus' : 'pro',
              trigger: 'manual',
            })
          }
          planPriceSol={
            subscription.tier !== 'free' ? subscription.planPriceSol : undefined
          }
          tier={subscription.tier}
          tierLabel={formatTierLabel(subscription.tier)}
        />

        <UsageOverview
          messagesLeft={limits?.messagesRemaining ?? 0}
          messagesUsed={subscription.messagesUsed}
          premiumMessagesUsed={subscription.premiumMessagesUsed}
          usagePercent={usagePercent}
        />

        <PlansGrid
          onSelectPlan={setSelectedPlan}
          onUpgrade={() => openModal({ tier: 'pro_plus', trigger: 'manual' })}
          preview={preview}
          selectedPlan={selectedPlan}
          subscriptionTier={subscription.tier}
        />

        {/* Upgrade Modal */}
        <UpgradeModal
          isOpen={isOpen}
          onClose={closeModal}
          suggestedTier={suggestedTier}
          trigger="manual"
        />
      </div>
    </div>
  );
}

type AlertsProps = {
  isExpiringSoon: boolean;
  isNearLimit: boolean;
  usagePercent: number;
  tierLabel: string;
  daysRemaining: number;
  currentPeriodEnd: number;
};

function Alerts({
  isExpiringSoon,
  isNearLimit,
  usagePercent,
  tierLabel,
  daysRemaining,
  currentPeriodEnd,
}: AlertsProps) {
  const formatDate = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {isExpiringSoon && (
        <Alert className="border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            Your {tierLabel} subscription expires in {daysRemaining} days on{' '}
            {formatDate(currentPeriodEnd)}.
          </AlertDescription>
        </Alert>
      )}
      {isNearLimit && (
        <Alert className="border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-900/20">
          <TrendingUp className="h-4 w-4 text-rose-600" />
          <AlertDescription>
            You've used {usagePercent}% of your monthly message allowance.
            Consider upgrading.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

type CurrentSubscriptionCardProps = {
  tier: 'free' | 'pro' | 'pro_plus' | 'admin';
  tierLabel: string;
  planPriceSol?: number;
  daysRemaining: number;
  currentPeriodEnd: number;
  onManage: () => void;
};

function CurrentSubscriptionCard({
  tier,
  tierLabel,
  planPriceSol,
  daysRemaining,
  currentPeriodEnd,
  onManage,
}: CurrentSubscriptionCardProps) {
  const getTierColor = (t: string) => {
    if (t === 'pro_plus') {
      return 'text-purple-600 dark:text-purple-400';
    }
    if (t === 'pro') {
      return 'text-blue-600 dark:text-blue-400';
    }
    return 'text-slate-600 dark:text-slate-400';
  };
  const getTierBg = (t: string) => {
    if (t === 'pro_plus') {
      return 'bg-purple-100 dark:bg-purple-900';
    }
    if (t === 'pro') {
      return 'bg-blue-100 dark:bg-blue-900';
    }
    return 'bg-slate-100 dark:bg-slate-800';
  };
  const formatDate = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  return (
    <Card className="p-4 ring-1 ring-primary/10 transition hover:ring-primary/20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg p-2 ${getTierBg(tier)}`}>
            <Crown className={`h-5 w-5 ${getTierColor(tier)}`} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold text-base leading-tight sm:text-lg">
                {tierLabel} Plan
              </h2>
              {planPriceSol !== undefined && (
                <Badge size="sm" variant="outline">
                  {planPriceSol} SOL/mo
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-xs leading-snug sm:text-sm">
              {tier === 'free' && 'Basic features with limited access'}
              {tier === 'pro' && 'Enhanced features with premium models'}
              {tier === 'pro_plus' && 'Full access including premium models'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground text-xs sm:text-sm">
          {tier !== 'free' && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                Renews {formatDate(currentPeriodEnd)} • {daysRemaining}d left
              </span>
            </div>
          )}
          <Button
            onClick={onManage}
            size="sm"
            variant={tier === 'pro_plus' ? 'outline' : 'default'}
          >
            {tier === 'free' && 'Upgrade'}
            {tier === 'pro' && 'Upgrade to Pro+'}
            {tier === 'pro_plus' && 'Manage Billing'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

type UsageOverviewProps = {
  messagesUsed: number;
  messagesLeft: number;
  premiumMessagesUsed: number;
  usagePercent: number;
};

function UsageOverview({
  messagesUsed,
  messagesLeft,
  premiumMessagesUsed,
  usagePercent,
}: UsageOverviewProps) {
  return (
    <Card className="p-3 ring-1 ring-border/50 transition hover:ring-primary/20">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4">
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-2">
          <div className="text-[11px] text-muted-foreground">Messages Used</div>
          <div className="font-semibold text-lg leading-tight">
            {messagesUsed}
          </div>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-2 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="text-[11px] text-muted-foreground">Messages Left</div>
          <div className="font-semibold text-lg leading-tight">
            {messagesLeft}
          </div>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="text-[11px] text-muted-foreground">Premium Used</div>
          <div className="font-semibold text-lg leading-tight">
            {premiumMessagesUsed}
          </div>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 dark:border-emerald-800 dark:bg-emerald-900/20">
          <div className="text-[11px] text-muted-foreground">Usage Rate</div>
          <div className="font-semibold text-lg leading-tight">
            {usagePercent}%
          </div>
        </div>
      </div>
      <div className="mt-3">
        <UsageIndicator showUpgrade={false} variant="compact" />
      </div>
    </Card>
  );
}

type PlansGridProps = {
  selectedPlan: 'free' | 'pro' | 'pro_plus';
  subscriptionTier: 'free' | 'pro' | 'pro_plus' | 'admin';
  preview: {
    standardPreview: { id: string; name: string }[];
    premiumPreview: { id: string; name: string }[];
    standardTotal: number;
    premiumTotal: number;
  };
  onSelectPlan: (plan: 'free' | 'pro' | 'pro_plus') => void;
  onUpgrade: () => void;
};

function PlansGrid({
  selectedPlan,
  subscriptionTier,
  preview,
  onSelectPlan,
  onUpgrade,
}: PlansGridProps) {
  return (
    <Card className="p-4 ring-1 ring-border/50 transition hover:ring-primary/20 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-base sm:text-lg">Plans</h3>
        {(subscriptionTier === 'free' || subscriptionTier === 'pro') && (
          <Button onClick={onUpgrade} size="sm">
            Upgrade to Pro+
          </Button>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <input
                checked={selectedPlan === 'free'}
                className="sr-only"
                id="plan-free"
                name="plan"
                onChange={() => onSelectPlan('free')}
                type="radio"
              />
              <label
                className={`group block cursor-pointer rounded-xl border p-4 transition-all ${selectedPlan === 'free' ? 'border-primary/40 bg-gradient-to-br from-primary/10 to-transparent ring-1 ring-primary/40' : 'border-border hover:shadow-sm hover:ring-1 hover:ring-primary/20'} h-full min-h-[10rem]`}
                htmlFor="plan-free"
              >
                <div className="flex h-full flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="font-semibold tracking-tight">Free</div>
                      {subscriptionTier === 'free' && (
                        <Badge size="sm" variant="outline">
                          Current
                        </Badge>
                      )}
                    </div>
                    <div className="font-semibold text-foreground text-sm">
                      $0
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Forever
                    </div>
                  </div>
                </div>
              </label>
            </div>
            <div>
              <input
                checked={selectedPlan === 'pro'}
                className="sr-only"
                id="plan-pro"
                name="plan"
                onChange={() => onSelectPlan('pro')}
                type="radio"
              />
              <label
                className={`group block cursor-pointer rounded-xl border p-4 transition-all ${selectedPlan === 'pro' ? 'border-primary/40 bg-gradient-to-br from-primary/10 to-transparent ring-1 ring-primary/40' : 'border-border hover:shadow-sm hover:ring-1 hover:ring-primary/20'} h-full min-h-[10rem]`}
                htmlFor="plan-pro"
              >
                <div className="flex h-full flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-blue-500" />
                        <div className="font-semibold tracking-tight">Pro</div>
                      </div>
                      {subscriptionTier === 'pro' && (
                        <Badge size="sm" variant="outline">
                          Current
                        </Badge>
                      )}
                    </div>
                    <div className="font-semibold text-foreground text-sm">
                      0.05 SOL
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      per month
                    </div>
                  </div>
                </div>
              </label>
            </div>
            <div>
              <input
                checked={selectedPlan === 'pro_plus'}
                className="sr-only"
                id="plan-pro-plus"
                name="plan"
                onChange={() => onSelectPlan('pro_plus')}
                type="radio"
              />
              <label
                className={`group block cursor-pointer rounded-xl border p-4 transition-all ${selectedPlan === 'pro_plus' ? 'border-primary/40 bg-gradient-to-br from-primary/10 to-transparent ring-1 ring-primary/40' : 'border-border hover:shadow-sm hover:ring-1 hover:ring-primary/20'} h-full min-h-[10rem]`}
                htmlFor="plan-pro-plus"
              >
                <div className="flex h-full flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-purple-500" />
                        <div className="font-semibold tracking-tight">Pro+</div>
                      </div>
                      {(subscriptionTier === 'pro_plus' ||
                        subscriptionTier === 'admin') && (
                        <Badge size="sm" variant="outline">
                          Current
                        </Badge>
                      )}
                    </div>
                    <div className="font-semibold text-foreground text-sm">
                      0.1 SOL
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      per month
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>
        <div>
          <h4 className="mb-2 font-medium">
            Features for{' '}
            {selectedPlan === 'pro_plus'
              ? 'Pro+'
              : selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}
          </h4>
          <div className="flex flex-wrap gap-1.5 text-[11px] sm:text-xs">
            {preview.standardTotal > 0 ? (
              preview.standardPreview.map((model) => (
                <Badge key={model.id} size="sm" variant="secondary">
                  {model.name}
                </Badge>
              ))
            ) : (
              <div className="text-muted-foreground">
                Basic models available
              </div>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs">
            {selectedPlan !== 'free' ? (
              preview.premiumTotal > 0 ? (
                preview.premiumPreview.map((model) => (
                  <Badge key={model.id} size="sm" variant="secondary">
                    {model.name} • Premium
                  </Badge>
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
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] sm:text-xs">
            <div className="rounded-xl border p-2">
              <div className="text-muted-foreground">Messages/month</div>
              <div className="font-medium">
                {selectedPlan === 'free' && '50'}
                {selectedPlan === 'pro' && '1,500'}
                {selectedPlan === 'pro_plus' && '3,000'}
              </div>
            </div>
            <div className="rounded-xl border p-2">
              <div className="text-muted-foreground">Premium messages</div>
              <div className="font-medium">
                {selectedPlan === 'free' && '—'}
                {selectedPlan === 'pro' && '100'}
                {selectedPlan === 'pro_plus' && '300'}
              </div>
            </div>
            <div className="rounded-xl border p-2">
              <div className="text-muted-foreground">Standard models</div>
              <div className="font-medium">{preview.standardTotal}</div>
            </div>
            <div className="rounded-xl border p-2">
              <div className="text-muted-foreground">Premium models</div>
              <div className="font-medium">{preview.premiumTotal}</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
