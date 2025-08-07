'use client';

import { ArrowUpRight, Crown, Shield, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { SubscriptionStatusProps } from '@/lib/types/components';
import { cn } from '@/lib/utils';

/**
 * SubscriptionStatus component - Display subscription details and usage
 * Shows token usage, features, and upgrade options
 */
export function SubscriptionStatus({
  subscription,
  showUpgrade = false,
  className,
  children,
}: SubscriptionStatusProps) {
  const usagePercentage = Math.round(
    (subscription.tokensUsed / subscription.tokensLimit) * 100
  );

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return <Shield className="h-5 w-5" />;
      case 'pro':
        return <Zap className="h-5 w-5" />;
      default:
        return <Crown className="h-5 w-5" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return 'text-purple-600 dark:text-purple-400';
      case 'pro':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getProgressVariant = (percentage: number) => {
    if (percentage >= 90) return 'error';
    if (percentage >= 75) return 'warning';
    return 'default';
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Subscription Overview */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={cn('flex-shrink-0', getTierColor(subscription.tier))}
            >
              {getTierIcon(subscription.tier)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg dark:text-gray-100">
                {subscription.tier.charAt(0).toUpperCase() +
                  subscription.tier.slice(1)}{' '}
                Plan
              </h3>
              <p className="text-gray-600 text-sm dark:text-gray-400">
                Current subscription tier
              </p>
            </div>
          </div>
          {showUpgrade && (
            <Button size="sm" variant="outline">
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Upgrade
            </Button>
          )}
        </div>

        {/* Token Usage */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900 text-sm dark:text-gray-100">
              Token Usage
            </span>
            <span className="text-gray-600 text-sm dark:text-gray-400">
              {formatNumber(subscription.tokensUsed)} /{' '}
              {formatNumber(subscription.tokensLimit)}
            </span>
          </div>
          <Progress
            max={100}
            showValue
            size="md"
            value={usagePercentage}
            variant={getProgressVariant(usagePercentage)}
          />
          {usagePercentage >= 80 && (
            <div className="flex items-center space-x-2">
              <Badge
                size="sm"
                variant={usagePercentage >= 90 ? 'error' : 'warning'}
              >
                {usagePercentage >= 90 ? 'Critical' : 'Warning'}
              </Badge>
              <span className="text-gray-600 text-xs dark:text-gray-400">
                {usagePercentage >= 90
                  ? 'Your token usage is critically high'
                  : "You're approaching your token limit"}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Features */}
      {subscription.features.length > 0 && (
        <Card className="p-6">
          <h4 className="mb-4 font-semibold text-gray-900 text-md dark:text-gray-100">
            Included Features
          </h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {subscription.features.map((feature, index) => (
              <div
                className="flex items-center space-x-2 text-gray-600 text-sm dark:text-gray-400"
                key={index}
              >
                <div className="h-2 w-2 flex-shrink-0 rounded-full bg-green-500" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Usage Recommendations */}
      {usagePercentage >= 75 && (
        <Card className="border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <div className="flex items-start space-x-3">
            <Zap className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
            <div className="space-y-2">
              <h5 className="font-medium text-sm text-yellow-800 dark:text-yellow-200">
                Usage Recommendation
              </h5>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                {usagePercentage >= 90
                  ? 'Consider upgrading your plan or optimizing your token usage to avoid service interruption.'
                  : 'You may want to monitor your token usage more closely or consider upgrading your plan.'}
              </p>
              {showUpgrade && (
                <Button className="mt-2" size="sm" variant="outline">
                  View Upgrade Options
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {children}
    </div>
  );
}

export default SubscriptionStatus;
