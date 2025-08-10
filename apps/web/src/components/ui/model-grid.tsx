'use client';

import { Filter } from 'lucide-react';
import { useState } from 'react';
import { useSubscriptionStatus } from '@/components/providers/auth-provider';
import { ModelCard } from '@/components/ui/model-card';
import {
  ProviderFilter,
  type ProviderFilter as ProviderFilterType,
} from '@/components/ui/provider-filter';
import {
  AI_MODELS,
  type AIModel,
  isPremiumModel,
} from '@/lib/constants/ai-models';

interface ModelGridProps {
  models?: AIModel[];
  selectedModelId?: string;
  onModelSelect: (model: AIModel) => void;
  columns?: 2 | 3 | 4;
  showFilter?: boolean;
  compact?: boolean;
  className?: string;
  filterClassName?: string;
  gridClassName?: string;
}

export function ModelGrid({
  models,
  selectedModelId,
  onModelSelect,
  columns = 4,
  showFilter = true,
  compact = false,
  className = '',
  filterClassName = '',
  gridClassName = '',
}: ModelGridProps) {
  const [providerFilter, setProviderFilter] =
    useState<ProviderFilterType>('all');
  const subscription = useSubscriptionStatus();

  // Filter models based on subscription and provider
  const isAdmin = subscription?.tier === 'admin';
  const sourceModels = models ?? AI_MODELS;
  const availableModels = sourceModels.filter((model) => {
    // Provider filter
    if (providerFilter !== 'all' && model.provider !== providerFilter) {
      return false;
    }

    // Subscription filter
    if (isAdmin) {
      return true;
    }
    if (subscription?.tier === 'free') {
      return !isPremiumModel(model);
    }
    return true; // Pro and Pro+ users can see all models
  });

  const getGridCols = () => {
    switch (columns) {
      case 2:
        return 'grid-cols-1 sm:grid-cols-2';
      case 3:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
      case 4:
      default:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {showFilter && (
        <ProviderFilter
          availableCount={availableModels.length}
          className={filterClassName}
          onSelect={setProviderFilter}
          selected={providerFilter}
        />
      )}

      <div className={`grid ${getGridCols()} gap-3 ${gridClassName}`}>
        {availableModels.map((model) => (
          <ModelCard
            compact={compact}
            isSelected={selectedModelId === model.id}
            key={model.id}
            model={model}
            onClick={onModelSelect}
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
  );
}
