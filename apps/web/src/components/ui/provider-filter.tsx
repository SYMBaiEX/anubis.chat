'use client';

import { Brain, Cpu, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getAllUIModels, type UIModel } from '@/lib/ai/providers';

export type ProviderFilter =
  | 'all'
  | 'gateway'
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'openrouter';

interface ProviderFilterProps {
  selected: ProviderFilter;
  onSelect: (provider: ProviderFilter) => void;
  availableCount?: number;
  className?: string;
}

const getProviderIcon = (provider: UIModel['provider']) => {
  switch (provider) {
    case 'gateway':
      return <Sparkles className="h-3 w-3 text-blue-500" />;
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

export function ProviderFilter({
  selected,
  onSelect,
  availableCount,
  className,
}: ProviderFilterProps) {
  const allModels = getAllUIModels();

  const providers = [
    {
      value: 'all' as const,
      label: 'All Providers',
      count: availableCount || allModels.length,
    },
    {
      value: 'gateway' as const,
      label: 'Gateway (Cost-Optimized)',
      count: allModels.filter((m) => m.provider === 'gateway').length,
    },
    {
      value: 'openai' as const,
      label: 'OpenAI',
      count: allModels.filter((m) => m.provider === 'openai').length,
    },
    {
      value: 'anthropic' as const,
      label: 'Anthropic',
      count: allModels.filter((m) => m.provider === 'anthropic').length,
    },
    {
      value: 'google' as const,
      label: 'Google',
      count: allModels.filter((m) => m.provider === 'google').length,
    },
    {
      value: 'openrouter' as const,
      label: 'OpenRouter',
      count: allModels.filter((m) => m.provider === 'openrouter').length,
    },
  ];

  return (
    <div
      className={`flex flex-wrap gap-2 rounded-lg bg-muted p-1 ${className}`}
    >
      {providers.map((provider) => (
        <Button
          className="flex items-center gap-1.5"
          key={provider.value}
          onClick={() => onSelect(provider.value)}
          size="sm"
          variant={selected === provider.value ? 'default' : 'ghost'}
        >
          {provider.value !== 'all' &&
            getProviderIcon(provider.value as UIModel['provider'])}
          <span>{provider.label}</span>
          <Badge className="px-1.5 text-xs" variant="secondary">
            {provider.count}
          </Badge>
        </Button>
      ))}
    </div>
  );
}
