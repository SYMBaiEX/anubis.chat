'use client';

import {
  Bot,
  Calendar,
  Crown,
  MessageSquare,
  Settings,
  TrendingUp,
  User,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { UsageIndicator } from '@/components/chat/usage-indicator';
import {
  useAuthContext,
  useSubscriptionLimits,
  useSubscriptionStatus,
} from '@/components/providers/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuthContext();
  const subscription = useSubscriptionStatus();
  const limits = useSubscriptionLimits();

  return (
    <div className="space-y-3 p-3 sm:space-y-4 sm:p-4 md:space-y-5 md:p-5 lg:p-6">
      {/* Header - Responsive */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-semibold text-lg sm:text-xl md:text-2xl">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Welcome{user?.displayName ? `, ${user.displayName}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
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
            <Link href="/agents/new">
              <Bot className="mr-1.5 h-3.5 w-3.5" />
              <span className="hidden sm:inline">Create Agent</span>
              <span className="sm:hidden">Agent</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Subscription Status Card - Responsive */}
      {subscription && (
        <Card className="p-3 sm:p-4 md:p-5">
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
                  <h2 className="font-semibold text-sm capitalize sm:text-base md:text-lg">
                    {subscription.tier} Plan
                  </h2>
                  {subscription.tier !== 'free' && (
                    <Badge className="text-[10px] sm:text-xs" variant="outline">
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
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 md:grid-cols-4 md:gap-4">
        {/* Messages Card */}
        <Card className="p-2.5 sm:p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-[11px] text-muted-foreground sm:text-xs md:text-sm">
                Messages
              </h3>
              <p className="font-bold text-lg sm:text-xl md:text-2xl">
                {subscription?.messagesUsed || 0}
              </p>
            </div>
            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground sm:h-4 sm:w-4" />
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
        <Card className="p-2.5 sm:p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-[11px] text-muted-foreground sm:text-xs md:text-sm">
                Premium
              </h3>
              <p className="font-bold text-lg sm:text-xl md:text-2xl">
                {subscription?.premiumMessagesUsed || 0}
              </p>
            </div>
            <Zap className="h-3.5 w-3.5 text-amber-500 sm:h-4 sm:w-4" />
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
        <Card className="p-2.5 sm:p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-[11px] text-muted-foreground sm:text-xs md:text-sm">
                Days Left
              </h3>
              <p className="font-bold text-lg sm:text-xl md:text-2xl">
                {subscription?.daysRemaining || 0}
              </p>
            </div>
            <Calendar className="h-3.5 w-3.5 text-muted-foreground sm:h-4 sm:w-4" />
          </div>
        </Card>

        {/* Usage Card */}
        <Card className="p-2.5 sm:p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-[11px] text-muted-foreground sm:text-xs md:text-sm">
                Usage
              </h3>
              <p className="font-bold text-lg sm:text-xl md:text-2xl">
                {subscription
                  ? Math.round(subscription.messageUsagePercent)
                  : 0}
                %
              </p>
            </div>
            <TrendingUp className="h-3.5 w-3.5 text-green-500 sm:h-4 sm:w-4" />
          </div>
        </Card>
      </div>

      {/* Quick Actions - Responsive Grid */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 md:gap-4 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium text-sm sm:text-base">Profile</h2>
              <p className="text-[11px] text-muted-foreground sm:text-xs md:text-sm">
                Manage your account
              </p>
            </div>
            <User className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />
          </div>
          <div className="mt-3">
            <Button
              asChild
              className="w-full sm:w-auto"
              size="sm"
              variant="ghost"
            >
              <Link href="/account">View profile</Link>
            </Button>
          </div>
        </Card>

        {/* Settings Card */}
        <Card className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium text-sm sm:text-base">Settings</h2>
              <p className="text-[11px] text-muted-foreground sm:text-xs md:text-sm">
                Preferences and options
              </p>
            </div>
            <Settings className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <Badge className="text-[10px] sm:text-xs" variant="secondary">
              MCP
            </Badge>
            <Badge className="text-[10px] sm:text-xs" variant="secondary">
              Agents
            </Badge>
            {subscription?.tier !== 'free' && (
              <Badge
                className="gap-0.5 text-[10px] sm:text-xs"
                variant="outline"
              >
                <Crown className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                Premium
              </Badge>
            )}
          </div>
          <div className="mt-3">
            <Button
              asChild
              className="w-full sm:w-auto"
              size="sm"
              variant="ghost"
            >
              <Link href="/settings">Open settings</Link>
            </Button>
          </div>
        </Card>

        {/* Subscription Card */}
        <Card className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium text-sm sm:text-base">Subscription</h2>
              <p className="text-[11px] text-muted-foreground sm:text-xs md:text-sm">
                Billing and plans
              </p>
            </div>
            <Crown className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />
          </div>
          <div className="mt-3">
            <Button
              asChild
              className="w-full sm:w-auto"
              size="sm"
              variant="ghost"
            >
              <Link href="/subscription">Manage plan</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
