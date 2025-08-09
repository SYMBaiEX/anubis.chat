'use client';

import { Brain, Check, ChevronDown, Cpu, Lock, Sparkles, Zap } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSubscriptionStatus, useSubscriptionLimits, useCanUsePremiumModel } from '@/components/providers/auth-provider';
import { AI_MODELS, type AIModel, isPremiumModel } from '@/lib/constants/ai-models';
import { cn } from '@/lib/utils';

interface ModelSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
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

export function ModelSelector({
  value,
  onValueChange,
  className,
  disabled = false,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const subscription = useSubscriptionStatus();
  const limits = useSubscriptionLimits();
  const canUsePremium = useCanUsePremiumModel();

  const selectedModel = AI_MODELS.find((model) => model.id === value);

  // Filter models based on subscription
  const isAdmin = subscription?.tier === 'admin' || subscription?.isAdmin;
  const availableModels = AI_MODELS.filter((model) => {
    // Admins see all models
    if (isAdmin) {
      return true;
    }
    if (subscription?.tier === 'free') {
      return !isPremiumModel(model);
    }
    return true; // Pro and Pro+ users can see all models
  });

  const groupedModels = AI_MODELS.reduce(
    (acc, model) => {
      if (!acc[model.provider]) {
        acc[model.provider] = [];
      }
      acc[model.provider].push(model);
      return acc;
    },
    {} as Record<string, AIModel[]>
  );

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

  const providerLabels = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    google: 'Google',
    openrouter: 'OpenRouter',
  };

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className={cn(
            'w-full justify-between',
            !selectedModel && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
          role="combobox"
          variant="outline"
        >
          {selectedModel ? (
            <div className="flex items-center gap-2">
              {getProviderIcon(selectedModel.provider)}
              <span className="truncate">{selectedModel.name}</span>
              <div className="flex items-center gap-1">
                {getIntelligenceBadge(selectedModel.intelligence)}
                {getSpeedIcon(selectedModel.speed)}
              </div>
            </div>
          ) : (
            <span>Select a model...</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[500px] p-0">
        <Command>
          <CommandInput
            onValueChange={setSearch}
            placeholder="Search models..."
            value={search}
          />
          <CommandList>
            <CommandEmpty>No model found.</CommandEmpty>
            {Object.entries(groupedModels).map(([provider, models]) => (
              <CommandGroup
                heading={
                  providerLabels[provider as keyof typeof providerLabels]
                }
                key={provider}
              >
                {models
                  .filter(
                    (model) =>
                      model.name.toLowerCase().includes(search.toLowerCase()) ||
                      model.description
                        .toLowerCase()
                        .includes(search.toLowerCase())
                  )
                  .map((model) => {
                    const accessible = isModelAccessible(model);
                    
                    return (
                      <CommandItem
                        className={cn(
                          "flex flex-col items-start gap-1 py-2",
                          !accessible && "opacity-50 cursor-not-allowed"
                        )}
                        key={model.id}
                        onSelect={() => {
                          if (accessible) {
                            onValueChange(model.id);
                            setOpen(false);
                          }
                        }}
                        value={model.id}
                        disabled={!accessible}
                      >
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getProviderIcon(model.provider)}
                          <span className="font-medium">{model.name}</span>
                          {getPremiumBadge(model)}
                          {model.default && (
                            <Badge className="px-1 text-xs" variant="secondary">
                              Default
                            </Badge>
                          )}
                          {model.released && (
                            <Badge className="px-1 text-xs" variant="outline">
                              {model.released}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {getIntelligenceBadge(model.intelligence)}
                          {getSpeedIcon(model.speed)}
                          {value === model.id && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {model.description}
                      </p>
                      <div className="flex items-center gap-4 text-muted-foreground text-xs">
                        <span>
                          Context: {(model.contextWindow / 1000).toFixed(0)}K
                        </span>
                        <span>
                          ${model.pricing.input}/${model.pricing.output} per 1M
                        </span>
                        <div className="flex gap-1">
                          {model.capabilities.slice(0, 3).map((cap) => (
                            <Badge
                              className="px-1 py-0 text-xs"
                              key={cap}
                              variant="outline"
                            >
                              {cap}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CommandItem>
                  );
                  })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default ModelSelector;
