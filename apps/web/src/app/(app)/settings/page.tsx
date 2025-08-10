'use client';

import {
  AlertTriangle,
  Bell,
  CreditCard,
  Crown,
  Loader,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSubscription } from '@/hooks/use-subscription';

export default function SettingsPage() {
  const { user, isLoading: authLoading } = useAuthContext();
  const {
    subscription,
    limits,
    upgradePrompt,
    isLoading: subscriptionLoading,
    error,
  } = useSubscription();

  const isLoading = authLoading || subscriptionLoading;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader className="mx-auto mb-4 h-8 w-8 animate-spin" />
          <h2 className="font-semibold text-xl">Loading settings...</h2>
          <p className="text-muted-foreground">
            Please wait while we load your settings.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="font-semibold text-2xl">Settings</h1>
          <p className="text-muted-foreground">
            Manage your preferences and integrations
          </p>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Unable to load subscription data. Some features may not be
            available.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-semibold text-2xl">Settings</h1>
        <p className="text-muted-foreground">
          Manage your preferences and integrations
        </p>
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

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {/* Subscription Management */}
        <Card className="p-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-medium">Subscription</h2>
            <Crown className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="mb-4 text-muted-foreground text-sm">
            Manage your plan, billing, and usage.
          </p>
          <div className="mb-4 space-y-2">
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  (subscription?.tier || 'free') === 'free'
                    ? 'secondary'
                    : 'default'
                }
              >
                {subscription?.tier || 'free'} Plan
              </Badge>
              {subscription?.tier !== 'free' && subscription?.planPriceSol && (
                <Badge className="text-xs" variant="outline">
                  {subscription.planPriceSol} SOL/month
                </Badge>
              )}
            </div>
            <div className="text-muted-foreground text-xs">
              {subscription?.messagesUsed || 0} /{' '}
              {subscription?.messagesLimit || 0} messages used
            </div>
            {limits && !limits.canSendMessage && (
              <Badge className="text-xs" variant="destructive">
                Message limit reached
              </Badge>
            )}
          </div>
          <Button asChild size="sm">
            <Link href="/subscription">Manage subscription</Link>
          </Button>
        </Card>

        {/* Billing & Payments */}
        <Card className="p-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-medium">Billing</h2>
            <CreditCard className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="mb-4 text-muted-foreground text-sm">
            Payment methods and transaction history.
          </p>
          <div className="mb-4 space-y-1">
            {subscription?.tier !== 'free' &&
              subscription?.currentPeriodEnd && (
                <>
                  <div className="text-sm">
                    Next billing:{' '}
                    {new Date(
                      subscription.currentPeriodEnd
                    ).toLocaleDateString()}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {subscription?.daysRemaining ||
                      Math.max(
                        0,
                        Math.ceil(
                          (subscription.currentPeriodEnd - Date.now()) /
                            (1000 * 60 * 60 * 24)
                        )
                      )}{' '}
                    days remaining
                  </div>
                </>
              )}
            {(!subscription || subscription?.tier === 'free') && (
              <div className="text-muted-foreground text-sm">
                No active subscription
              </div>
            )}
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/billing">View billing</Link>
          </Button>
        </Card>

        {/* MCP Servers */}
        <Card className="p-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-medium">MCP Servers</h2>
            <Shield className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="mb-4 text-muted-foreground text-sm">
            Configure Model Context Protocol servers and tools.
          </p>
          <div className="mb-4">
            {subscription?.tier && subscription.tier !== 'free' ? (
              <Badge className="gap-1" variant="outline">
                <Crown className="h-3 w-3" />
                Premium features available
              </Badge>
            ) : (
              <Badge className="text-xs" variant="secondary">
                Basic MCP access
              </Badge>
            )}
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/mcp">Open MCP settings</Link>
          </Button>
        </Card>

        {/* Account Settings */}
        <Card className="p-6">
          <h2 className="mb-2 font-medium">Account</h2>
          <p className="mb-4 text-muted-foreground text-sm">
            Profile, security, and preferences.
          </p>
          <div className="mb-4 space-y-1">
            <div className="text-sm">
              {user?.displayName || 'No display name'}
            </div>
            <div className="text-muted-foreground text-xs">
              {user?.walletAddress
                ? `${user.walletAddress.slice(0, 8)}...${user.walletAddress.slice(-4)}`
                : 'No wallet connected'}
            </div>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/account">Manage account</Link>
          </Button>
        </Card>
      </div>

      {/* Preferences */}
      <Card className="p-6">
        <h2 className="mb-4 font-medium">Preferences</h2>
        <Tabs className="w-full" defaultValue="general">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
          </TabsList>
          <TabsContent className="space-y-4" value="general">
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Theme</h3>
              <div className="text-muted-foreground text-sm">
                Theme preferences are managed globally
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Language</h3>
              <div className="text-muted-foreground text-sm">
                English (US) - Additional languages coming soon
              </div>
            </div>
          </TabsContent>
          <TabsContent className="space-y-4" value="notifications">
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Usage Alerts</h3>
              <div className="text-muted-foreground text-sm">
                Get notified when approaching usage limits
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Billing Notifications</h3>
              <div className="text-muted-foreground text-sm">
                Receive billing and payment updates
              </div>
            </div>
          </TabsContent>
          <TabsContent className="space-y-4" value="subscription">
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Auto-renewal</h3>
              <div className="text-muted-foreground text-sm">
                {subscription?.autoRenew ? 'Enabled' : 'Disabled'} -
                {subscription?.tier !== 'free'
                  ? ' Your subscription will auto-renew'
                  : ' No active subscription'}
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Usage Tracking</h3>
              <div className="text-muted-foreground text-sm">
                Monitor message and premium model usage
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Feature Access</h3>
              <div className="space-y-1">
                <div className="text-sm">
                  • Workflows:{' '}
                  {subscription?.tier === 'pro_plus'
                    ? '✅ Available'
                    : '❌ Requires Pro+'}
                </div>
                <div className="text-sm">
                  • Premium Models:{' '}
                  {subscription?.tier && subscription.tier !== 'free'
                    ? '✅ Available'
                    : '❌ Requires Pro or Pro+'}
                </div>
                <div className="text-sm">
                  • API Access:{' '}
                  {subscription?.tier === 'pro_plus'
                    ? '✅ Available'
                    : '❌ Requires Pro+'}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
