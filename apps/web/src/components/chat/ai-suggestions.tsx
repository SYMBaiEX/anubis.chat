'use client';

import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AISuggestionsProps {
  suggestions?: string[];
  onSelect: (suggestion: string) => void;
  className?: string;
  isLoading?: boolean;
}

const defaultSuggestions = [
  'What can you help me with?',
  'Tell me about your capabilities',
  'How do I upload and analyze documents?',
  'Explain the AI models available',
];

export function AISuggestions({
  suggestions = defaultSuggestions,
  onSelect,
  className,
  isLoading = false,
}: AISuggestionsProps) {
  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-lg bg-muted/50"
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4" />
        <span>Suggested prompts</span>
      </div>
      
      {suggestions.map((suggestion, index) => (
        <Card
          key={index}
          className="group cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md"
          onClick={() => onSelect(suggestion)}
        >
          <Button
            variant="ghost"
            className="w-full justify-between px-4 py-3 text-left"
            asChild
          >
            <div className="flex items-center justify-between">
              <span className="flex-1 text-sm">{suggestion}</span>
              <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </Button>
        </Card>
      ))}
    </div>
  );
}