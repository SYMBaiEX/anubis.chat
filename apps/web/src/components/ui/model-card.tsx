'use client';

import { Brain, Check, Cpu, Lock, Sparkles, Zap } from 'lucide-react';
import {
  useCanUsePremiumModel,
  useSubscriptionStatus,
} from '@/components/providers/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { type AIModel, isPremiumModel } from '@/lib/constants/ai-models';
import { cn } from '@/lib/utils';

interface ModelCardProps {
  model: AIModel;
  isSelected?: boolean;
  onClick: (model: AIModel) => void;
  className?: string;
  compact?: boolean;
}

const getProviderIcon = (provider: AIModel['provider']) => {
  switch (provider) {
    case 'openai':
      return <Sparkles className="h-3 w-3" />;
    case 'anthropic':
      return <Brain className="h-3 w-3" />;
    case 'google':
      return <Cpu className="h-3 w-3" />;
    case 'openrouter':
      return <Sparkles className="h-3 w-3" />;
  }
};

const getIntelligenceBadge = (intelligence: AIModel['intelligence']) => {
  const variants: Record<AIModel['intelligence'], string> = {
    basic: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    advanced: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    expert:
      'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    frontier: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
  };

  return (
    <Badge
      className={cn('border-0 px-1.5 py-0 text-xs', variants[intelligence])}
      variant="outline"
    >
      {intelligence}
    </Badge>
  );
};

const getSpeedIcon = (speed: AIModel['speed']) => {
  switch (speed) {
    case 'fast':
      return <Zap className="h-3 w-3 text-green-500" />;
    case 'medium':
      return <Zap className="h-3 w-3 text-yellow-500" />;
    case 'slow':
      return <Zap className="h-3 w-3 text-orange-500" />;
  }
};

export function ModelCard({
  model,
  isSelected = false,
  onClick,
  className,
  compact = false,
}: ModelCardProps) {
  const subscription = useSubscriptionStatus();
  const canUsePremium = useCanUsePremiumModel();

  // Check if a model is accessible to current user
  const isModelAccessible = (model: AIModel) => {
    if (subscription?.tier === 'free') {
      return !isPremiumModel(model);
    }
    if (subscription?.tier === 'pro' && isPremiumModel(model)) {
      return canUsePremium;
    }
    return true;
  };

  // Get premium badge for model
  const getPremiumBadge = (model: AIModel) => {
    if (!isPremiumModel(model)) return null;

    if (subscription?.tier === 'free') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge className="gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                <Lock className="h-3 w-3" />
                Pro
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Requires Pro or Pro+ subscription</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    if (subscription?.tier === 'pro' && !canUsePremium) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge className="gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                <Lock className="h-3 w-3" />
                Limit
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Premium message quota exhausted</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <Badge className="gap-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
        <Sparkles className="h-3 w-3" />
        Premium
      </Badge>
    );
  };

  const accessible = isModelAccessible(model);

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-md',
        isSelected && 'border-primary ring-2 ring-primary',
        !accessible && 'cursor-not-allowed opacity-50',
        compact ? 'min-h-[120px]' : 'min-h-[140px]',
        className
      )}
      onClick={() => {
        if (accessible) {
          onClick(model);
        }
      }}
    >
      <CardHeader className={cn('p-3', compact ? 'pb-1' : 'pb-2')}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {getProviderIcon(model.provider)}
            <h3
              className={cn(
                'truncate font-medium',
                compact ? 'text-xs' : 'text-sm'
              )}
              title={model.name}
            >
              {model.name
                .replace(' – OpenRouter', '')
                .replace(' – ', ' ')
                .replace(' (Free)', '')}
            </h3>
          </div>
          {isSelected && (
            <Check className="h-4 w-4 flex-shrink-0 text-primary" />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {getIntelligenceBadge(model.intelligence)}
          {getSpeedIcon(model.speed)}
          {getPremiumBadge(model)}
          {model.default && (
            <Badge
              className={cn(
                'px-1.5 py-0',
                compact ? 'h-4 text-xs' : 'h-5 text-xs'
              )}
              variant="secondary"
            >
              Default
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className={cn('p-3', compact ? 'pt-0' : 'pt-1')}>
        {!compact && (
          <p className="mb-2 line-clamp-2 text-muted-foreground text-xs">
            {model.description}
          </p>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Context: {(model.contextWindow / 1000).toFixed(0)}K</span>
            <span>
              ${model.pricing.input}/${model.pricing.output}/1M
            </span>
          </div>

          <div className="flex flex-wrap gap-1">
            {model.capabilities.slice(0, compact ? 1 : 2).map((cap) => (
              <Badge
                className={cn('px-1.5 py-0 text-xs', compact ? 'h-4' : 'h-5')}
                key={cap}
                variant="outline"
              >
                {cap}
              </Badge>
            ))}
            {model.capabilities.length > (compact ? 1 : 2) && (
              <Badge
                className={cn(
                  'px-1.5 py-0 text-muted-foreground text-xs',
                  compact ? 'h-4' : 'h-5'
                )}
                variant="outline"
              >
                +{model.capabilities.length - (compact ? 1 : 2)}
              </Badge>
            )}
          </div>

          {model.released && !compact && (
            <div className="text-muted-foreground text-xs">
              Released: {model.released}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
