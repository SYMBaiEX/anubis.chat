'use client';

import { Brain, Check, ChevronDown, Cpu, Sparkles, Zap } from 'lucide-react';
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
import { AI_MODELS, type AIModel } from '@/lib/constants/ai-models';
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

  const selectedModel = AI_MODELS.find((model) => model.id === value);

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

  const providerLabels = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    google: 'Google',
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
                  .map((model) => (
                    <CommandItem
                      className="flex flex-col items-start gap-1 py-2"
                      key={model.id}
                      onSelect={() => {
                        onValueChange(model.id);
                        setOpen(false);
                      }}
                      value={model.id}
                    >
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getProviderIcon(model.provider)}
                          <span className="font-medium">{model.name}</span>
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
                  ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default ModelSelector;
