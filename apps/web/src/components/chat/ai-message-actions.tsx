'use client';

import {
  AlertCircle,
  Copy,
  RefreshCw,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface AIMessageActionsProps {
  messageId: string;
  content: string;
  onRegenerate?: () => void;
  onFeedback?: (type: 'positive' | 'negative') => void;
  className?: string;
  isGenerating?: boolean;
}

export function AIMessageActions({
  messageId,
  content,
  onRegenerate,
  onFeedback,
  className,
  isGenerating = false,
}: AIMessageActionsProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(
    null
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleFeedback = (type: 'positive' | 'negative') => {
    setFeedback(type);
    onFeedback?.(type);
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          'flex items-center gap-1 rounded-lg bg-background/50 p-1',
          className
        )}
      >
        {/* Copy button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleCopy}
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
            >
              {copied ? (
                <Sparkles className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {copied ? 'Copied!' : 'Copy message'}
          </TooltipContent>
        </Tooltip>

        {/* Regenerate button */}
        {onRegenerate && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onRegenerate}
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                disabled={isGenerating}
              >
                <RefreshCw
                  className={cn(
                    'h-3.5 w-3.5',
                    isGenerating && 'animate-spin'
                  )}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Regenerate response</TooltipContent>
          </Tooltip>
        )}

        {/* Divider */}
        <div className="mx-1 h-4 w-px bg-border" />

        {/* Thumbs up */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => handleFeedback('positive')}
              size="sm"
              variant="ghost"
              className={cn(
                'h-7 w-7 p-0',
                feedback === 'positive' && 'text-green-500'
              )}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Good response</TooltipContent>
        </Tooltip>

        {/* Thumbs down */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => handleFeedback('negative')}
              size="sm"
              variant="ghost"
              className={cn(
                'h-7 w-7 p-0',
                feedback === 'negative' && 'text-red-500'
              )}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Bad response</TooltipContent>
        </Tooltip>

        {/* Report issue */}
        {feedback === 'negative' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-orange-500"
              >
                <AlertCircle className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Report issue</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}