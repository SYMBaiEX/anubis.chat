'use client';

import { Brain, Check, Cpu, Lock, Sparkles, Zap } from 'lucide-react';
import {
  useCanUsePremiumModel,
  useSubscriptionStatus,
} from '@/components/providers/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  type UIModel,
  getUIModelsForTier,
  isFreeModel,
  isPremiumModel,
  isStandardModel,
} from '@/lib/ai/providers';
import { cn } from '@/lib/utils';

interface ModelCardProps {
  model: UIModel;
  isSelected?: boolean;
  onClick: (model: UIModel) => void;
  className?: string;
  compact?: boolean;
  isAccessible?: boolean; // Optional override for accessibility check
}

const getProviderIcon = (provider: UIModel['provider']) => {
  switch (provider) {
    case 'openai':
      return <Sparkles className="h-3 w-3" />;
    case 'gateway':
      return <Zap className="h-3 w-3 text-blue-500" />;
    case 'google':
      return <Cpu className="h-3 w-3" />;
    case 'openrouter':
      return <Sparkles className="h-3 w-3" />;
    default:
      return <Brain className="h-3 w-3" />; // fallback icon
  }
};

const getIntelligenceBadge = (intelligence: UIModel['intelligence']) => {
  const variants: Record<UIModel['intelligence'], string> = {
    basic: 'bg-secondary text-secondary-foreground',
    advanced:
      'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    expert:
      'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
    frontier:
      'bg-gradient-to-r from-purple-500 to-pink-500 text-primary-foreground',
  };

  // Shortened labels
  const shortLabels: Record<UIModel['intelligence'], string> = {
    basic: 'Basic',
    advanced: 'Adv',
    expert: 'Expert',
    frontier: 'Top',
  };

  return (
    <Badge
      className={cn('border-0 px-1 py-0 text-[10px]', variants[intelligence])}
      variant="outline"
    >
      {shortLabels[intelligence]}
    </Badge>
  );
};

const getSpeedIcon = (speed: UIModel['speed']) => {
  switch (speed) {
    case 'fast':
      return <Zap className="h-2.5 w-2.5 text-green-500" />;
    case 'medium':
      return <Zap className="h-2.5 w-2.5 text-yellow-500" />;
    case 'slow':
      return <Zap className="h-2.5 w-2.5 text-orange-500" />;
  }
};

export function ModelCard({
  model,
  isSelected = false,
  onClick,
  className,
  compact = false,
  isAccessible,
}: ModelCardProps) {
  const subscription = useSubscriptionStatus();
  const canUsePremium = useCanUsePremiumModel();

  // Check if a model is accessible to current user using new tier logic
  const isModelAccessible = (model: UIModel) => {
    if (subscription?.tier === 'admin') {
      return true;
    }

    const userTier =
      (subscription?.tier as 'free' | 'pro' | 'pro_plus') || 'free';
    const availableModels = getUIModelsForTier(userTier);

    return availableModels.some(
      (availableModel) => availableModel.id === model.id
    );
  };

  // Get tier badge for model (Premium, Standard, Free)
  const getTierBadge = (model: UIModel) => {
    // Determine tier based on new model categorization
    let tier: 'Free' | 'Standard' | 'Premium';
    let badgeClass: string;
    let icon: React.ReactNode = null;

    if (isFreeModel(model)) {
      tier = 'Free';
      badgeClass =
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    } else if (isPremiumModel(model)) {
      tier = 'Premium';
      badgeClass =
        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      icon = <Sparkles className="h-2.5 w-2.5" />;
    } else {
      tier = 'Standard';
      badgeClass =
        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }

    // Show lock icon if not accessible
    if (!accessible) {
      icon = <Lock className="h-2.5 w-2.5" />;
    }

    const getTooltipMessage = () => {
      if (accessible) {
        return `${tier} tier model`;
      }

      const userTier = subscription?.tier || 'free';
      if (userTier === 'free') {
        if (isStandardModel(model)) {
          return 'Requires Pro or Pro+ subscription';
        }
        if (isPremiumModel(model)) {
          return 'Requires Pro+ subscription';
        }
      } else if (userTier === 'pro' && isPremiumModel(model)) {
        return 'Requires Pro+ subscription';
      }

      return 'Not available for your tier';
    };

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge
              className={cn(
                'gap-0.5 px-1 py-0 font-medium text-[10px]',
                badgeClass
              )}
            >
              {icon}
              {tier}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getTooltipMessage()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Use provided accessibility check or fall back to internal check
  const accessible =
    isAccessible !== undefined ? isAccessible : isModelAccessible(model);

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-md',
        isSelected && 'border-primary shadow-md ring-1 ring-primary',
        !accessible && 'cursor-not-allowed opacity-60',
        'min-h-[80px] border border-border/50',
        className
      )}
      onClick={() => {
        if (accessible) {
          onClick(model);
        }
      }}
    >
      <CardContent className="p-2">
        {/* Header with model name and selection indicator */}
        <div className="mb-1.5 flex items-start justify-between gap-1">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <div className="flex-shrink-0">
              {getProviderIcon(model.provider)}
            </div>
            <div className="min-w-0 flex-1">
              <h3
                className="truncate font-semibold text-xs leading-tight"
                title={model.name}
              >
                {model.name
                  .replace(' – OpenRouter', '')
                  .replace(' – ', ' ')
                  .replace(' (Free)', '')}
              </h3>
              <p className="truncate text-[10px] text-muted-foreground capitalize">
                {model.provider === 'gateway' ? 'Gateway (Cost-Optimized)' :
                  model.provider === 'openrouter' ? 'OpenRouter' :
                    model.provider === 'openai' ? 'OpenAI' :
                      model.provider === 'google' ? 'Google' :
                        model.provider}
              </p>
            </div>
          </div>
          {isSelected && (
            <Check className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
          )}
        </div>

        {/* Badges row */}
        <div className="mb-1.5 flex flex-wrap items-center gap-1">
          {getTierBadge(model)}
          {getIntelligenceBadge(model.intelligence)}
          <div className="flex items-center">{getSpeedIcon(model.speed)}</div>
          {model.default && (
            <Badge className="px-1 py-0 text-[10px]" variant="secondary">
              Default
            </Badge>
          )}
        </div>

        {/* Description - condensed */}
        <p className="mb-1.5 line-clamp-2 text-[10px] text-muted-foreground leading-snug">
          {model.description}
        </p>

        {/* Bottom info */}
        <div className="space-y-1">
          {/* Main capabilities - limit to 2 most important */}
          <div className="flex flex-wrap gap-0.5">
            {model.capabilities.slice(0, 2).map((cap) => (
              <Badge
                className="h-3.5 px-1 py-0 text-[9px]"
                key={cap}
                variant="outline"
              >
                {cap}
              </Badge>
            ))}
            {model.capabilities.length > 2 && (
              <Badge
                className="h-3.5 px-1 py-0 text-[9px] text-muted-foreground"
                variant="outline"
              >
                +{model.capabilities.length - 2}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
