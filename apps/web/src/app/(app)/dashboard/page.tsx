'use client';

import { Bot, Calendar, Crown, MessageSquare, TrendingUp, Zap } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { UsageIndicator } from '@/components/chat/usage-indicator';
import {
  useAuthContext,
  useSubscriptionLimits,
  useSubscriptionStatus,
} from '@/components/providers/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useUpdateUserProfile } from '@/hooks/convex/useUsers';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuthContext();
  const subscription = useSubscriptionStatus();
  const limits = useSubscriptionLimits();
  const [isEditingName, setIsEditingName] = useState(false);
  const [pendingName, setPendingName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [localDisplayName, setLocalDisplayName] = useState<string | null>(null);
  const { mutate: updateProfile } = useUpdateUserProfile();

  useEffect(() => {
    setPendingName(user?.displayName ?? '');
    setLocalDisplayName(user?.displayName ?? null);
  }, [user?.displayName]);

  const formatTierLabel = (tier?: string): string => {
    switch (tier) {
      case 'pro_plus':
        return 'Pro+';
      case 'pro':
        return 'Pro';
      case 'free':
        return 'Free';
      case 'admin':
        return 'Admin';
      default:
        return tier ?? 'Free';
    }
  };

  return (
    <div className="w-full bg-gradient-to-b from-primary/5 dark:from-primary/10">
      {/* Full-width Header Strip */}
      <div className="w-full p-3 sm:p-4 md:p-6 lg:p-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text font-semibold text-2xl text-transparent sm:text-3xl md:text-4xl">
              Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {subscription && (
              <Badge className="hidden sm:inline-flex" variant="outline">
                {formatTierLabel(subscription.tier)}
              </Badge>
            )}
            <Button asChild className="flex-1 sm:flex-initial" size="sm">
              <Link href="/chat">
                <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                <span className="hidden sm:inline">Open Chat</span>
                <span className="sm:hidden">Chat</span>
              </Link>
            </Button>
            <Button
              asChild
              className="flex-1 sm:flex-initial"
              size="sm"
              variant="secondary"
            >
              <Link href="/agents">
                <Bot className="mr-1.5 h-3.5 w-3.5" />
                <span className="hidden sm:inline">Agents</span>
                <span className="sm:hidden">Agents</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Constrained content container */}
      <div className="mx-auto w-full max-w-6xl space-y-4 p-3 sm:space-y-5 sm:p-4 md:space-y-6 md:p-6 lg:space-y-6">
        <div className="flex items-center gap-2">
          {localDisplayName && !isEditingName ? (
            <p className="text-muted-foreground text-sm sm:text-base">
              Welcome,{' '}
              <span className="font-medium text-foreground">
                {localDisplayName}
              </span>
            </p>
          ) : isEditingName ? (
            <form
              className="flex w-full max-w-sm items-center gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!pendingName.trim()) return;
                try {
                  setSavingName(true);
                  const result: any = await updateProfile({
                    displayName: pendingName.trim(),
                  });
                  if (result?.success === false) {
                    toast.error(
                      result.error?.message || 'Failed to update username'
                    );
                    return;
                  }
                  setLocalDisplayName(pendingName.trim());
                  setIsEditingName(false);
                  toast.success('Username updated');
                } finally {
                  setSavingName(false);
                }
              }}
            >
              <Input
                aria-label="Username"
                className="h-8"
                maxLength={40}
                onChange={(e) => setPendingName(e.target.value)}
                placeholder="Enter a username"
                required
                value={pendingName}
              />
              <Button
                className="h-8"
                disabled={savingName}
                size="sm"
                type="submit"
              >
                Save
              </Button>
              <Button
                className="h-8"
                onClick={() => {
                  setIsEditingName(false);
                  setPendingName(user?.displayName ?? '');
                }}
                size="sm"
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground text-sm sm:text-base">
                Welcome
              </p>
              <Button
                className="h-7 px-2 text-xs"
                onClick={() => setIsEditingName(true)}
                variant="secondary"
              >
                Set Username
              </Button>
            </div>
          )}
        </div>
        {/* Subscription Status Card - Responsive */}
        {subscription && (
          <Card className="p-3 transition-colors hover:ring-1 hover:ring-primary/20 sm:p-4 md:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div
                  className={cn(
                    'rounded-md p-1.5 sm:p-2',
                    subscription.tier === 'free'
                      ? 'bg-slate-100 dark:bg-slate-800'
                      : subscription.tier === 'pro'
                        ? 'bg-blue-100 dark:bg-blue-900'
                        : 'bg-purple-100 dark:bg-purple-900'
                  )}
                >
                  <Crown
                    className={cn(
                      'h-4 w-4 sm:h-5 sm:w-5',
                      subscription.tier === 'free'
                        ? 'text-slate-600 dark:text-slate-400'
                        : subscription.tier === 'pro'
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-purple-600 dark:text-purple-400'
                    )}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <h2 className="font-semibold text-sm sm:text-base md:text-lg">
                      {formatTierLabel(subscription.tier)} Plan
                    </h2>
                    {subscription.tier !== 'free' && (
                      <Badge
                        className="text-[10px] sm:text-xs"
                        variant="outline"
                      >
                        {subscription.planPriceSol} SOL/mo
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground sm:text-xs md:text-sm">
                    {subscription.tier === 'free' &&
                      'Basic features with limited access'}
                    {subscription.tier === 'pro' &&
                      'Enhanced features with premium model access'}
                    {subscription.tier === 'pro_plus' &&
                      'Full access to all features and models'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-xs sm:text-sm">
                  {subscription.messagesUsed} / {subscription.messagesLimit}
                </div>
                <div className="text-[10px] text-muted-foreground sm:text-xs">
                  messages used
                </div>
              </div>
            </div>
            <div className="mt-3">
              <UsageIndicator
                showUpgrade={subscription.tier !== 'pro_plus'}
                variant="detailed"
              />
            </div>
          </Card>
        )}

        {/* Quick Stats - Responsive Grid */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 md:grid-cols-4 md:gap-4">
          {/* Messages Card */}
          <Card className="border-primary/30 bg-primary/10 p-2.5 transition-colors hover:ring-1 hover:ring-primary/30 sm:p-3 md:p-4 dark:bg-primary/15">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-[11px] text-muted-foreground sm:text-xs md:text-sm">
                  Messages
                </h3>
                <p className="font-bold text-lg sm:text-xl md:text-2xl">
                  {subscription?.messagesUsed || 0}
                </p>
              </div>
              <span className="rounded-md bg-gradient-to-br from-primary/30 to-transparent p-1">
                <MessageSquare className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
              </span>
            </div>
            <div className="mt-1.5 sm:mt-2">
              <Progress
                className="h-1 sm:h-1.5"
                value={
                  subscription
                    ? (subscription.messagesUsed / subscription.messagesLimit) *
                      100
                    : 0
                }
              />
            </div>
          </Card>

          {/* Premium Card */}
          <Card className="border-accent/30 bg-accent/10 p-2.5 transition-colors hover:ring-1 hover:ring-accent/30 sm:p-3 md:p-4 dark:bg-accent/15">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-[11px] text-muted-foreground sm:text-xs md:text-sm">
                  Premium
                </h3>
                <p className="font-bold text-lg sm:text-xl md:text-2xl">
                  {subscription?.premiumMessagesUsed || 0}
                </p>
              </div>
              <span className="rounded-md bg-gradient-to-br from-accent/30 to-transparent p-1">
                <Zap className="h-3.5 w-3.5 text-accent sm:h-4 sm:w-4" />
              </span>
            </div>
            <div className="mt-1.5 sm:mt-2">
              <Progress
                className="h-1 sm:h-1.5"
                value={
                  subscription && subscription.premiumMessagesLimit > 0
                    ? (subscription.premiumMessagesUsed /
                        subscription.premiumMessagesLimit) *
                      100
                    : 0
                }
              />
            </div>
          </Card>

          {/* Days Left Card */}
          <Card className="border-secondary/30 bg-secondary/10 p-2.5 transition-colors hover:ring-1 hover:ring-secondary/30 sm:p-3 md:p-4 dark:bg-secondary/15">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-[11px] text-muted-foreground sm:text-xs md:text-sm">
                  Days Left
                </h3>
                <p className="font-bold text-lg sm:text-xl md:text-2xl">
                  {subscription?.daysRemaining || 0}
                </p>
              </div>
              <span className="rounded-md bg-gradient-to-br from-secondary/30 to-transparent p-1">
                <Calendar className="h-3.5 w-3.5 text-secondary-foreground sm:h-4 sm:w-4" />
              </span>
            </div>
          </Card>

          {/* Usage Card */}
          <Card className="border-primary/30 bg-primary/10 p-2.5 transition-colors hover:ring-1 hover:ring-primary/30 sm:p-3 md:p-4 dark:bg-primary/15">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-[11px] text-muted-foreground sm:text-xs md:text-sm">
                  Usage
                </h3>
                <p className="font-bold text-lg sm:text-xl md:text-2xl">
                  {subscription && subscription.messagesLimit > 0
                    ? Math.round(
                        (subscription.messagesUsed /
                          subscription.messagesLimit) *
                          100
                      )
                    : 0}
                  %
                </p>
              </div>
              <span className="rounded-md bg-gradient-to-br from-primary/30 to-transparent p-1">
                <TrendingUp className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
              </span>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
