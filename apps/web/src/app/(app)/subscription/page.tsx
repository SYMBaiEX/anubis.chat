'use client';

import { useState } from 'react';
import { Crown, Check, Zap, Calendar, TrendingUp, AlertTriangle, CreditCard, Clock } from 'lucide-react';
import { useAuthContext, useSubscriptionStatus, useSubscriptionLimits, useUpgradePrompt } from '@/components/providers/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UsageIndicator } from '@/components/chat/usage-indicator';
import { UpgradePrompt } from '@/components/auth/upgrade-prompt';

export default function SubscriptionPage() {
  const { user } = useAuthContext();
  const subscription = useSubscriptionStatus();
  const limits = useSubscriptionLimits();
  const upgradePrompt = useUpgradePrompt();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (!subscription) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="font-semibold text-xl">Loading subscription...</h2>
          <p className="text-muted-foreground">Please wait while we load your subscription details.</p>
        </div>
      </div>
    );
  }

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
      day: 'numeric'
    });
  };

  const isExpiringSoon = subscription.daysRemaining <= 7 && subscription.tier !== 'free';
  const isNearLimit = subscription.messageUsagePercent >= 75;

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
            Your {subscription.tier} subscription expires in {subscription.daysRemaining} days on {formatDate(subscription.currentPeriodEnd)}. 
            {subscription.autoRenew ? ' Auto-renewal is enabled.' : ' Consider renewing to avoid service interruption.'}
          </AlertDescription>
        </Alert>
      )}

      {isNearLimit && (
        <Alert>
          <TrendingUp className="h-4 w-4" />
          <AlertDescription>
            You've used {Math.round(subscription.messageUsagePercent)}% of your monthly message allowance. 
            Consider upgrading to avoid hitting limits.
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
                <h2 className="font-bold text-2xl capitalize">{subscription.tier} Plan</h2>
                {subscription.tier !== 'free' && (
                  <Badge variant="outline">
                    {subscription.planPriceSol} SOL/month
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                {subscription.tier === 'free' && 'Basic features with limited access to AI models'}
                {subscription.tier === 'pro' && 'Enhanced features with premium model access'}
                {subscription.tier === 'pro_plus' && 'Full access to all features and unlimited premium models'}
              </p>
              {subscription.tier !== 'free' && (
                <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Renews {formatDate(subscription.currentPeriodEnd)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {subscription.daysRemaining} days remaining
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <Button 
              onClick={() => setShowUpgradeModal(true)}
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
        <h3 className="font-semibold text-lg mb-4">Usage Overview</h3>
        <UsageIndicator variant="detailed" showUpgrade={false} />
        
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="font-bold text-2xl">{subscription.messagesUsed}</div>
            <div className="text-muted-foreground text-sm">Messages Used</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-2xl">{subscription.messagesRemaining}</div>
            <div className="text-muted-foreground text-sm">Messages Left</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-2xl">{subscription.premiumMessagesUsed}</div>
            <div className="text-muted-foreground text-sm">Premium Used</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-2xl">{Math.round(subscription.messageUsagePercent)}%</div>
            <div className="text-muted-foreground text-sm">Usage Rate</div>
          </div>
        </div>
      </Card>

      {/* Features Comparison */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-6">Plan Features</h3>
        
        <div className="grid md:grid-cols-3 gap-6">
          {/* Free Plan */}
          <div className={`border rounded-lg p-4 ${subscription.tier === 'free' ? 'border-primary bg-primary/5' : 'border-border'}`}>
            <div className="text-center mb-4">
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
          <div className={`border rounded-lg p-4 ${subscription.tier === 'pro' ? 'border-primary bg-primary/5' : 'border-border'}`}>
            <div className="text-center mb-4">
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
              <Button className="w-full mt-4" onClick={() => setShowUpgradeModal(true)}>
                {subscription.tier === 'free' ? 'Upgrade to Pro' : 'Downgrade to Pro'}
              </Button>
            )}
          </div>

          {/* Pro+ Plan */}
          <div className={`border rounded-lg p-4 ${subscription.tier === 'pro_plus' ? 'border-primary bg-primary/5' : 'border-border'}`}>
            <div className="text-center mb-4">
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
              <Button className="w-full mt-4" onClick={() => setShowUpgradeModal(true)}>
                Upgrade to Pro+
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Available AI Models */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Available AI Models</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Standard Models</h4>
            <div className="space-y-1 text-sm">
              {subscription.availableModels?.filter(model => 
                !['gpt-4o', 'claude-3.5-sonnet', 'claude-sonnet-4'].includes(model)
              ).map(model => (
                <div key={model} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  {model}
                </div>
              )) || (
                <div className="text-muted-foreground">Basic models available</div>
              )}
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              Premium Models
              <Zap className="h-4 w-4 text-amber-500" />
            </h4>
            <div className="space-y-1 text-sm">
              {subscription.tier !== 'free' ? (
                subscription.availableModels?.filter(model => 
                  ['gpt-4o', 'claude-3.5-sonnet', 'claude-sonnet-4'].includes(model)
                ).map(model => (
                  <div key={model} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    {model}
                    <Badge variant="secondary" className="text-xs">Premium</Badge>
                  </div>
                )) || (
                  <div className="text-green-600">Premium models included</div>
                )
              ) : (
                <div className="text-muted-foreground">Requires Pro or Pro+ subscription</div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradePrompt
          prompt={upgradePrompt}
          variant="modal"
          onDismiss={() => setShowUpgradeModal(false)}
        />
      )}
    </div>
  );
}