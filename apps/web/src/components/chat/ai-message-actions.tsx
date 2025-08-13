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
import { createModuleLogger } from '@/lib/utils/logger';

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
  const log = createModuleLogger('ai-message-actions');
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
      log.error('Failed to copy', {
        error: error instanceof Error ? error.message : String(error),
      });
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
              className="h-7 w-7 p-0"
              onClick={handleCopy}
              size="sm"
              variant="ghost"
            >
              {copied ? (
                <Sparkles className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{copied ? 'Copied!' : 'Copy message'}</TooltipContent>
        </Tooltip>

        {/* Regenerate button */}
        {onRegenerate && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="h-7 w-7 p-0"
                disabled={isGenerating}
                onClick={onRegenerate}
                size="sm"
                variant="ghost"
              >
                <RefreshCw
                  className={cn('h-3.5 w-3.5', isGenerating && 'animate-spin')}
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
              className={cn(
                'h-7 w-7 p-0',
                feedback === 'positive' && 'text-green-500'
              )}
              onClick={() => handleFeedback('positive')}
              size="sm"
              variant="ghost"
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
              className={cn(
                'h-7 w-7 p-0',
                feedback === 'negative' && 'text-red-500'
              )}
              onClick={() => handleFeedback('negative')}
              size="sm"
              variant="ghost"
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
                className="h-7 w-7 p-0 text-orange-500"
                size="sm"
                variant="ghost"
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
