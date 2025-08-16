'use client';

import { Brain, Cpu, Filter, Sparkles, Zap } from 'lucide-react';
import { useState } from 'react';
import {
  useCanUsePremiumModel,
  useSubscriptionLimits,
  useSubscriptionStatus,
} from '@/components/providers/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ModelCard } from '@/components/ui/model-card';
import {
  ProviderFilter,
  type ProviderFilter as ProviderFilterType,
} from '@/components/ui/provider-filter';
import {
  getAllUIModels,
  getUIModelsForTier,
  getUIModelById,
  isFreeModel,
  isPremiumModel,
  isStandardModel,
  type UIModel,
} from '@/lib/ai/providers';
import { cn } from '@/lib/utils';

interface ModelSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

const getProviderIcon = (provider: UIModel['provider']) => {
  switch (provider) {
    case 'openai':
      return <Sparkles className="h-3 w-3" />;
    case 'google':
      return <Cpu className="h-3 w-3" />;
    case 'openrouter':
      return <Sparkles className="h-3 w-3" />;
    case 'gateway':
      return <Zap className="h-3 w-3 text-blue-500" />; // Gateway icon
  }
};

const getIntelligenceBadge = (intelligence: UIModel['intelligence']) => {
  const variants: Record<UIModel['intelligence'], string> = {
    basic: 'bg-muted text-muted-foreground',
    advanced: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    expert:
      'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    frontier:
      'bg-gradient-to-r from-purple-500 to-pink-500 text-primary-foreground',
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

const getSpeedIcon = (speed: UIModel['speed']) => {
  switch (speed) {
    case 'fast':
      return <Zap className="h-3 w-3 text-green-500" />;
    case 'medium':
      return <Zap className="h-3 w-3 text-yellow-500" />;
    case 'slow':
      return <Zap className="h-3 w-3 text-orange-500" />;
  }
};

export function ModelSelector({
  value,
  onValueChange,
  className,
  disabled = false,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [providerFilter, setProviderFilter] =
    useState<ProviderFilterType>('all');

  const subscription = useSubscriptionStatus();
  const _limits = useSubscriptionLimits();
  const _canUsePremium = useCanUsePremiumModel();

  const selectedModel = value ? getUIModelById(value) : undefined;

  // Get available models based on user's subscription tier
  const userTier =
    subscription?.tier === 'admin'
      ? 'pro_plus'
      : (subscription?.tier as 'free' | 'pro' | 'pro_plus') || 'free';
  const availableModelsByTier = getUIModelsForTier(userTier);

  // Get all models from provider registry
  const allModels = getAllUIModels();

  // Filter models based on provider and tier access
  const filteredModels = allModels.filter((model) => {
    // Provider filter
    if (providerFilter !== 'all' && model.provider !== providerFilter) {
      return false;
    }
    // Show all models to allow seeing what's available with upgrades
    return true;
  });

  // Sort models by tier: Free -> Standard -> Premium
  const availableModels = filteredModels.sort((a, b) => {
    // Determine tier for each model
    const getTierPriority = (model: UIModel) => {
      if (isFreeModel(model)) {
        return 0; // Free first
      }
      if (isStandardModel(model)) {
        return 1; // Standard second
      }
      return 2; // Premium last
    };

    const aPriority = getTierPriority(a);
    const bPriority = getTierPriority(b);

    // Sort by tier priority, then by name
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    return a.name.localeCompare(b.name);
  });

  // Check if user can use a model based on new tier logic
  const canUseModel = (model: UIModel) => {
    const isAdmin = subscription?.tier === 'admin';
    if (isAdmin) {
      return true;
    }
    // Check if model is available for user's tier
    return availableModelsByTier.some(
      (availableModel) => availableModel.id === model.id
    );
  };

  const handleModelSelect = (model: UIModel) => {
    // Only select if user can use the model
    if (canUseModel(model)) {
      onValueChange(model.id);
      setOpen(false);
    }
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button
          className={cn(
            'w-full justify-between',
            !selectedModel && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
          variant="outline"
        >
          {selectedModel ? (
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div className="flex flex-shrink-0 items-center gap-2">
                {getProviderIcon(selectedModel.provider)}
              </div>
              <span className="flex-1 truncate text-left">
                {selectedModel.name}
              </span>
              <div className="flex flex-shrink-0 items-center gap-1">
                {getSpeedIcon(selectedModel.speed)}
              </div>
            </div>
          ) : (
            <span>Select a model...</span>
          )}
          <Filter className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-6xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Select AI Model</DialogTitle>
        </DialogHeader>

        {/* Provider Filter */}
        <ProviderFilter
          availableCount={availableModels.length}
          onSelect={setProviderFilter}
          selected={providerFilter}
        />

        {/* Models Grid */}
        <div className="max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-1.5 p-1 sm:gap-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {availableModels.map((model) => (
              <ModelCard
                isAccessible={canUseModel(model)}
                isSelected={value === model.id}
                key={model.id}
                model={model}
                onClick={handleModelSelect}
              />
            ))}
          </div>

          {availableModels.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              <Filter className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p>No models found for the selected provider.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ModelSelector;
