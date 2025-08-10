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
    // case 'anthropic':  // DISABLED FOR NOW
    //   return <Brain className="h-3 w-3" />;
    case 'google':
      return <Cpu className="h-3 w-3" />;
    case 'openrouter':
      return <Sparkles className="h-3 w-3" />;
    default:
      return <Brain className="h-3 w-3" />; // fallback icon
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

  // Get tier badge for model (Premium, Standard, Free)
  const getTierBadge = (model: AIModel) => {
    // Determine tier based on model pricing and capabilities
    const isPremium = isPremiumModel(model);
    const isFree = model.pricing.input === 0 && model.pricing.output === 0;

    let tier: 'Free' | 'Standard' | 'Premium';
    let badgeClass: string;
    let icon: React.ReactNode = null;

    if (isFree) {
      tier = 'Free';
      badgeClass =
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    } else if (isPremium) {
      tier = 'Premium';
      badgeClass =
        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      icon = <Sparkles className="h-3 w-3" />;
    } else {
      tier = 'Standard';
      badgeClass =
        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }

    // Show lock icon if not accessible
    if (!isModelAccessible(model)) {
      icon = <Lock className="h-3 w-3" />;
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge
              className={cn(
                'gap-1 px-1.5 py-0.5 font-medium text-xs',
                badgeClass
              )}
            >
              {icon}
              {tier}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {isModelAccessible(model)
                ? `${tier} tier model`
                : subscription?.tier === 'free'
                  ? 'Requires Pro or Pro+ subscription'
                  : 'Premium message quota exhausted'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const accessible = isModelAccessible(model);

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg',
        isSelected && 'border-primary shadow-md ring-2 ring-primary',
        !accessible && 'cursor-not-allowed opacity-60',
        'min-h-[100px] border border-border/50',
        className
      )}
      onClick={() => {
        if (accessible) {
          onClick(model);
        }
      }}
    >
      <CardContent className="p-3">
        {/* Header with model name and selection indicator */}
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex-shrink-0">
              {getProviderIcon(model.provider)}
            </div>
            <div className="min-w-0 flex-1">
              <h3
                className="truncate font-semibold text-sm leading-tight"
                title={model.name}
              >
                {model.name
                  .replace(' – OpenRouter', '')
                  .replace(' – ', ' ')
                  .replace(' (Free)', '')}
              </h3>
            </div>
          </div>
          {isSelected && (
            <Check className="h-4 w-4 flex-shrink-0 text-primary" />
          )}
        </div>

        {/* Badges row */}
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          {getTierBadge(model)}
          {getIntelligenceBadge(model.intelligence)}
          <div className="flex items-center">{getSpeedIcon(model.speed)}</div>
          {model.default && (
            <Badge className="px-1.5 py-0.5 text-xs" variant="secondary">
              Default
            </Badge>
          )}
        </div>

        {/* Description - condensed */}
        <p className="mb-2 line-clamp-2 text-muted-foreground text-xs leading-relaxed">
          {model.description}
        </p>

        {/* Bottom info */}
        <div className="space-y-1.5">
          {/* Main capabilities - limit to 2 most important */}
          <div className="flex flex-wrap gap-1">
            {model.capabilities.slice(0, 2).map((cap) => (
              <Badge
                className="h-4 px-1.5 py-0 text-xs"
                key={cap}
                variant="outline"
              >
                {cap}
              </Badge>
            ))}
            {model.capabilities.length > 2 && (
              <Badge
                className="h-4 px-1.5 py-0 text-muted-foreground text-xs"
                variant="outline"
              >
                +{model.capabilities.length - 2}
              </Badge>
            )}
          </div>

          {/* Release date - only if available and accurate */}
          {model.released && (
            <div className="text-muted-foreground text-xs">
              Released: {model.released}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
