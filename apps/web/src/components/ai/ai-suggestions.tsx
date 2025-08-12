'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AISuggestionsProps {
  suggestions?: string[];
  onSelect: (suggestion: string) => void;
  className?: string;
  isLoading?: boolean;
  variant?: 'card' | 'chip' | 'inline';
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
  variant = 'card',
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

  if (variant === 'chip') {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {suggestions.map((suggestion, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => onSelect(suggestion)}
            >
              <Sparkles className="mr-1 h-3 w-3" />
              {suggestion}
            </Button>
          </motion.div>
        ))}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2 text-sm', className)}>
        <Sparkles className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">Try:</span>
        {suggestions.slice(0, 2).map((suggestion, index) => (
          <Button
            key={index}
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs"
            onClick={() => onSelect(suggestion)}
          >
            "{suggestion}"
          </Button>
        ))}
      </div>
    );
  }

  // Default card variant
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4" />
        <span>Suggested prompts</span>
      </div>
      
      {suggestions.map((suggestion, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card
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
        </motion.div>
      ))}
    </div>
  );
}