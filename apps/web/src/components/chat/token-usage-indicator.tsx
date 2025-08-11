'use client';

import { motion } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  Coins,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TokenUsage {
  used: number;
  limit: number;
  cost?: number;
  model?: string;
}

interface TokenUsageIndicatorProps {
  usage: TokenUsage;
  variant?: 'compact' | 'detailed' | 'inline';
  showCost?: boolean;
  showTrend?: boolean;
  previousUsage?: number;
  className?: string;
  onLimitReached?: () => void;
}

export function TokenUsageIndicator({
  usage,
  variant = 'compact',
  showCost = false,
  showTrend = false,
  previousUsage,
  className,
  onLimitReached,
}: TokenUsageIndicatorProps) {
  const [alertShown, setAlertShown] = useState(false);
  const percentage = (usage.used / usage.limit) * 100;
  const isNearLimit = percentage >= 80;
  const isOverLimit = percentage >= 100;

  const trend = previousUsage ? usage.used - previousUsage : 0;
  const trendPercentage = previousUsage
    ? ((trend / previousUsage) * 100).toFixed(1)
    : '0';

  useEffect(() => {
    if (isOverLimit && !alertShown && onLimitReached) {
      onLimitReached();
      setAlertShown(true);
    }
  }, [isOverLimit, alertShown, onLimitReached]);

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const getProgressVariant = () => {
    if (isOverLimit) {
      return 'error' as const;
    }
    if (isNearLimit) {
      return 'warning' as const;
    }
    return 'default' as const;
  };

  const getStatusIcon = () => {
    if (isOverLimit) {
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
    if (isNearLimit) {
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    }
    return <Zap className="h-4 w-4 text-primary" />;
  };

  if (variant === 'inline') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('flex items-center gap-2', className)}>
              <Coins className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">
                {formatNumber(usage.used)} / {formatNumber(usage.limit)}
              </span>
              {isNearLimit && (
                <Badge
                  className="h-5 px-1"
                  variant={isOverLimit ? 'destructive' : 'secondary'}
                >
                  {isOverLimit ? 'Over' : 'Near'} Limit
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-semibold">Token Usage</p>
              <p className="text-sm">Used: {usage.used.toLocaleString()}</p>
              <p className="text-sm">Limit: {usage.limit.toLocaleString()}</p>
              <p className="text-sm">{percentage.toFixed(1)}% utilized</p>
              {showCost && usage.cost !== undefined && (
                <p className="text-sm">Cost: ${usage.cost.toFixed(4)}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === 'detailed') {
    return (
      <Card className={cn('p-4', className)}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Token Usage</h3>
              {usage.model && (
                <Badge className="ml-2" variant="outline">
                  {usage.model}
                </Badge>
              )}
            </div>
            {getStatusIcon()}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Usage</span>
              <span className="font-medium">
                {formatNumber(usage.used)} / {formatNumber(usage.limit)} tokens
              </span>
            </div>

            <Progress
              className="h-2"
              value={Math.min(percentage, 100)}
              variant={getProgressVariant()}
            />

            <div className="flex justify-between text-muted-foreground text-xs">
              <span>{percentage.toFixed(1)}% used</span>
              <span>{formatNumber(usage.limit - usage.used)} remaining</span>
            </div>
          </div>

          {showTrend && previousUsage !== undefined && (
            <div className="flex items-center justify-between border-t pt-2">
              <span className="text-muted-foreground text-sm">Trend</span>
              <div className="flex items-center gap-1">
                {trend > 0 ? (
                  <TrendingUp className="h-4 w-4 text-destructive" />
                ) : trend < 0 ? (
                  <TrendingDown className="h-4 w-4 text-green-500" />
                ) : (
                  <Activity className="h-4 w-4 text-muted-foreground" />
                )}
                <span
                  className={cn(
                    'font-medium text-sm',
                    trend > 0 && 'text-destructive',
                    trend < 0 && 'text-green-500'
                  )}
                >
                  {trend > 0 && '+'}
                  {trendPercentage}%
                </span>
              </div>
            </div>
          )}

          {showCost && usage.cost !== undefined && (
            <div className="flex items-center justify-between border-t pt-2">
              <span className="text-muted-foreground text-sm">
                Estimated Cost
              </span>
              <span className="font-medium text-sm">
                ${usage.cost.toFixed(4)}
              </span>
            </div>
          )}

          {isOverLimit && (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="rounded-md bg-destructive/10 p-2"
              initial={{ opacity: 0, y: -10 }}
            >
              <p className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                Token limit exceeded. Additional charges may apply.
              </p>
            </motion.div>
          )}
        </div>
      </Card>
    );
  }

  // Compact variant (default)
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('space-y-1', className)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">
                  {formatNumber(usage.used)} / {formatNumber(usage.limit)}
                </span>
              </div>
              {isNearLimit && getStatusIcon()}
            </div>
            <Progress
              className="h-1.5"
              value={Math.min(percentage, 100)}
              variant={getProgressVariant()}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-semibold">Token Usage Details</p>
            <p className="text-sm">
              Used: {usage.used.toLocaleString()} tokens
            </p>
            <p className="text-sm">
              Limit: {usage.limit.toLocaleString()} tokens
            </p>
            <p className="text-sm">
              Remaining: {(usage.limit - usage.used).toLocaleString()} tokens
            </p>
            <p className="text-sm">{percentage.toFixed(1)}% utilized</p>
            {usage.model && <p className="text-sm">Model: {usage.model}</p>}
            {showCost && usage.cost !== undefined && (
              <p className="text-sm">Cost: ${usage.cost.toFixed(4)}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default TokenUsageIndicator;
