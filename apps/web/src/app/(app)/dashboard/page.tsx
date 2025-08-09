'use client';

import { Bot, MessageSquare, Settings, User, Crown, TrendingUp, Calendar, Zap } from 'lucide-react';
import Link from 'next/link';
import { useAuthContext, useSubscriptionStatus, useSubscriptionLimits } from '@/components/providers/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { UsageIndicator } from '@/components/chat/usage-indicator';

export default function DashboardPage() {
  const { user } = useAuthContext();
  const subscription = useSubscriptionStatus();
  const limits = useSubscriptionLimits();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome{user?.displayName ? `, ${user.displayName}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/chat">
              <MessageSquare className="mr-2 h-4 w-4" />
              Open Chat
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/agents/new">
              <Bot className="mr-2 h-4 w-4" />
              Create Agent
            </Link>
          </Button>
        </div>
      </div>

      {/* Subscription Status Card */}
      {subscription && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${
                subscription.tier === 'free' ? 'bg-slate-100 dark:bg-slate-800' :
                subscription.tier === 'pro' ? 'bg-blue-100 dark:bg-blue-900' :
                'bg-purple-100 dark:bg-purple-900'
              }`}>
                <Crown className={`h-5 w-5 ${
                  subscription.tier === 'free' ? 'text-slate-600 dark:text-slate-400' :
                  subscription.tier === 'pro' ? 'text-blue-600 dark:text-blue-400' :
                  'text-purple-600 dark:text-purple-400'
                }`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-lg capitalize">{subscription.tier} Plan</h2>
                  {subscription.tier !== 'free' && (
                    <Badge variant="outline" className="text-xs">
                      ${subscription.planPriceSol} SOL/month
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-sm">
                  {subscription.tier === 'free' && 'Basic features with limited access'}
                  {subscription.tier === 'pro' && 'Enhanced features with premium model access'}
                  {subscription.tier === 'pro_plus' && 'Full access to all features and models'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium text-sm">
                {subscription.messagesUsed} / {subscription.messagesLimit}
              </div>
              <div className="text-muted-foreground text-xs">messages used</div>
            </div>
          </div>
          <div className="mt-4">
            <UsageIndicator variant="detailed" showUpgrade={subscription.tier !== 'pro_plus'} />
          </div>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Quick Stats */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Messages</h3>
              <p className="font-bold text-2xl">{subscription?.messagesUsed || 0}</p>
            </div>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2">
            <Progress 
              value={subscription ? (subscription.messagesUsed / subscription.messagesLimit) * 100 : 0} 
              className="h-2" 
            />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Premium</h3>
              <p className="font-bold text-2xl">{subscription?.premiumMessagesUsed || 0}</p>
            </div>
            <Zap className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <Progress 
              value={subscription && subscription.premiumMessagesLimit > 0 
                ? (subscription.premiumMessagesUsed / subscription.premiumMessagesLimit) * 100 
                : 0
              } 
              className="h-2" 
            />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Days Left</h3>
              <p className="font-bold text-2xl">{subscription?.daysRemaining || 0}</p>
            </div>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Usage</h3>
              <p className="font-bold text-2xl">{subscription ? Math.round(subscription.messageUsagePercent) : 0}%</p>
            </div>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium">Profile</h2>
              <p className="text-muted-foreground text-sm">
                Manage your account
              </p>
            </div>
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="mt-4">
            <Button asChild size="sm" variant="ghost">
              <Link href="/account">View profile</Link>
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium">Settings</h2>
              <p className="text-muted-foreground text-sm">
                Preferences and options
              </p>
            </div>
            <Settings className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Badge variant="secondary">MCP</Badge>
            <Badge variant="secondary">Agents</Badge>
            {subscription?.tier !== 'free' && (
              <Badge variant="outline" className="gap-1">
                <Crown className="h-3 w-3" />
                Premium
              </Badge>
            )}
          </div>
          <div className="mt-4">
            <Button asChild size="sm" variant="ghost">
              <Link href="/settings">Open settings</Link>
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium">Subscription</h2>
              <p className="text-muted-foreground text-sm">
                Billing and plans
              </p>
            </div>
            <Crown className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Badge variant={subscription?.tier === 'free' ? 'secondary' : 'default'}>
              {subscription?.tier || 'Free'} Plan
            </Badge>
          </div>
          <div className="mt-4">
            <Button asChild size="sm" variant="ghost">
              <Link href="/subscription">Manage plan</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
