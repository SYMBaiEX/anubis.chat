'use client';

import { Bot } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { AIStreamingIndicator } from './ai-streaming-indicator';

interface StreamingMessageProps {
  content: string;
  className?: string;
}

export function StreamingMessage({
  content: _content,
  className,
}: StreamingMessageProps) {
  const messageRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as content streams in
  useEffect(() => {
    if (messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [_content]);

  return (
    <div className={cn('group flex gap-3 py-4', className)} ref={messageRef}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-green-100 text-green-600 text-xs dark:bg-green-900 dark:text-green-400">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Message Content */}
      <div className="flex flex-col items-start space-y-2">
        {/* Message Header */}
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <span className="font-medium">Assistant</span>
          <span>• Responding...</span>
        </div>

        {/* Message Bubble */}
        <div className="relative max-w-2xl">
          <div className="rounded-2xl border bg-muted px-4 py-3 shadow-sm">
            {/* AI Streaming Indicator with thinking animation */}
            <AIStreamingIndicator 
              type="thinking" 
              label="Generating response..."
              className="py-2"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
