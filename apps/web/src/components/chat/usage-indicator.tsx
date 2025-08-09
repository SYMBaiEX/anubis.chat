'use client';

import React, { useState } from 'react';
import { BarChart3, Crown, Info, MessageCircle, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PaymentModal } from '@/components/auth/payment-modal';
import { useSubscription } from '@/hooks/use-subscription';
import { cn } from '@/lib/utils';

interface UsageIndicatorProps {
  variant?: 'compact' | 'detailed' | 'minimal';
  showUpgrade?: boolean;
  className?: string;
}

export function UsageIndicator({ 
  variant = 'compact', 
  showUpgrade = true, 
  className 
}: UsageIndicatorProps) {
  const { subscription, limits, upgradePrompt } = useSubscription();
  const [showPayment, setShowPayment] = useState(false);

  if (!subscription) {
    return null;
  }

  const usagePercentage = Math.round((subscription.messagesUsed / subscription.messagesLimit) * 100);
  const premiumUsagePercentage = subscription.premiumMessagesLimit > 0
    ? Math.round((subscription.premiumMessagesUsed / subscription.premiumMessagesLimit) * 100)
    : 0;

  const getUsageColor = (percentage: number) => {
    if (percentage >= 95) return 'text-red-600 dark:text-red-400';
    if (percentage >= 75) return 'text-amber-600 dark:text-amber-400';
    if (percentage >= 50) return 'text-blue-600 dark:text-blue-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getProgressVariant = (percentage: number): 'default' | 'destructive' | 'secondary' => {
    if (percentage >= 90) return 'destructive';
    return 'default';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  if (variant === 'minimal') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              'flex items-center gap-2 text-sm',
              getUsageColor(usagePercentage),
              className
            )}>
              <MessageCircle className="h-4 w-4" />
              <span className="font-medium">
                {formatNumber(limits.messagesRemaining)}
              </span>
              {subscription.tier !== 'free' && limits.premiumMessagesRemaining > 0 && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <Crown className="h-4 w-4" />
                  <span className="font-medium">
                    {limits.premiumMessagesRemaining}
                  </span>
                </>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1 text-sm">
              <p>{limits.messagesRemaining} messages remaining</p>
              {subscription.tier !== 'free' && (
                <p>{limits.premiumMessagesRemaining} premium messages left</p>
              )}
              <p>{limits.daysUntilReset} days until reset</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className={cn('p-3', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={getUsageColor(usagePercentage)}>
              <MessageCircle className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">
                  {subscription.messagesUsed}/{subscription.messagesLimit}
                </span>
                <Badge variant="outline" className="text-xs">
                  {subscription.tier.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              <Progress
                value={usagePercentage}
                variant={getProgressVariant(usagePercentage)}
                className="h-2 w-24"
              />
            </div>
          </div>

          {upgradePrompt.shouldShow && showUpgrade && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPayment(true)}
              className="ml-2"
            >
              <Zap className="mr-1 h-3 w-3" />
              Upgrade
            </Button>
          )}
        </div>

        {showPayment && upgradePrompt.suggestedTier && (
          <PaymentModal
            isOpen={showPayment}
            onClose={() => setShowPayment(false)}
            tier={upgradePrompt.suggestedTier}
            onSuccess={() => setShowPayment(false)}
          />
        )}
      </Card>
    );
  }

  // Detailed variant
  return (
    <Card className={cn('p-4', className)}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold text-sm">
          <BarChart3 className="h-4 w-4" />
          Usage This Month
        </h3>
        <Badge variant="outline" className="text-xs">
          {subscription.tier.replace('_', ' ').toUpperCase()}
        </Badge>
      </div>

      <div className="space-y-4">
        {/* Messages Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              <span>Messages</span>
            </div>
            <span className={getUsageColor(usagePercentage)}>
              {subscription.messagesUsed}/{subscription.messagesLimit}
            </span>
          </div>
          <Progress
            value={usagePercentage}
            variant={getProgressVariant(usagePercentage)}
            className="h-2"
          />
        </div>

        {/* Premium Messages Usage (if applicable) */}
        {subscription.premiumMessagesLimit > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-500" />
                <span>Premium Messages</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">GPT-4o, Claude 3.5 Sonnet, and other premium models</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className={getUsageColor(premiumUsagePercentage)}>
                {subscription.premiumMessagesUsed}/{subscription.premiumMessagesLimit}
              </span>
            </div>
            <Progress
              value={premiumUsagePercentage}
              variant={getProgressVariant(premiumUsagePercentage)}
              className="h-2"
            />
          </div>
        )}

        {/* Reset Timer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Resets in {limits.daysUntilReset} days</span>
          {showUpgrade && upgradePrompt.shouldShow && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPayment(true)}
              className="h-auto p-1 text-xs"
            >
              <Zap className="mr-1 h-3 w-3" />
              Upgrade
            </Button>
          )}
        </div>

        {/* Usage Warnings */}
        {usagePercentage >= 90 && (
          <div className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-300">
            ⚠️ Critical usage level reached
          </div>
        )}
        {usagePercentage >= 75 && usagePercentage < 90 && (
          <div className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
            ⚠️ Approaching usage limit
          </div>
        )}
      </div>

      {showPayment && upgradePrompt.suggestedTier && (
        <PaymentModal
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          tier={upgradePrompt.suggestedTier}
          onSuccess={() => setShowPayment(false)}
        />
      )}
    </Card>
  );
}