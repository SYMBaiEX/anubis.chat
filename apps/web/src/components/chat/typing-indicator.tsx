'use client';

import { Bot } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { TypingIndicatorProps } from '@/lib/types/components';
import { cn } from '@/lib/utils';

/**
 * TypingIndicator component - Shows when AI is typing/processing
 * Provides visual feedback during response generation
 */
export function TypingIndicator({
  isTyping,
  userNames,
  className,
  children,
}: TypingIndicatorProps) {
  if (!isTyping) return null;

  return (
    <div className={cn('flex gap-3 py-4', className)}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-green-100 text-green-600 text-xs dark:bg-green-900 dark:text-green-400">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Typing Content */}
      <div className="flex flex-col space-y-2">
        {/* Typing Status */}
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <span className="font-medium">
            {userNames && userNames.length > 0
              ? userNames.join(', ')
              : 'Assistant'}
          </span>
          <span>is typing...</span>
        </div>

        {/* Typing Animation */}
        <div className="max-w-16 rounded-2xl border bg-muted px-4 py-3 shadow-sm">
          <div className="flex items-center space-x-1">
            <div className="flex space-x-1">
              <div
                className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60"
                style={{ animationDelay: '0ms' }}
              />
              <div
                className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60"
                style={{ animationDelay: '150ms' }}
              />
              <div
                className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60"
                style={{ animationDelay: '300ms' }}
              />
            </div>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}

export default TypingIndicator;
