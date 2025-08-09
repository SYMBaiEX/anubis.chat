'use client';

import { Bot } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface StreamingMessageProps {
  content: string;
  className?: string;
}

export function StreamingMessage({
  content,
  className,
}: StreamingMessageProps) {
  const messageRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as content streams in
  useEffect(() => {
    if (messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [content]);

  return (
    <div className={cn('flex gap-3 p-4', className)} ref={messageRef}>
      <div className="flex-shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <Bot className="h-5 w-5 text-primary" />
        </div>
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">ISIS</span>
          <span className="text-muted-foreground text-xs">• Responding...</span>
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="whitespace-pre-wrap">{content}</p>
          <span className="inline-block h-4 w-1 animate-pulse bg-primary" />
        </div>
      </div>
    </div>
  );
}
