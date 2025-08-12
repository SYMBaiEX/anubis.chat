'use client';

import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { AIStreamingIndicator } from './ai-streaming-indicator';
import { OptimizedMarkdownRenderer } from './optimized-markdown-renderer';

interface StreamingMessageProps {
  content: string;
  className?: string;
}

export function StreamingMessage({
  content,
  className,
}: StreamingMessageProps) {
  const messageRef = useRef<HTMLDivElement>(null);
  const [displayContent, setDisplayContent] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  // Smooth text streaming effect
  useEffect(() => {
    if (!content) {
      setDisplayContent('');
      setIsTyping(true);
      return;
    }

    // If content is very short or we already have most of it, just show it
    if (content.length < 10 || displayContent.length >= content.length * 0.95) {
      setDisplayContent(content);
      setIsTyping(false);
      return;
    }

    // Smooth character-by-character streaming
    let currentIndex = displayContent.length;
    const targetLength = content.length;
    const charsPerFrame = Math.max(1, Math.ceil((targetLength - currentIndex) / 30));

    const interval = setInterval(() => {
      if (currentIndex < targetLength) {
        const nextIndex = Math.min(currentIndex + charsPerFrame, targetLength);
        setDisplayContent(content.slice(0, nextIndex));
        currentIndex = nextIndex;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 16); // ~60fps for smooth animation

    return () => clearInterval(interval);
  }, [content]);

  // Auto-scroll as content streams
  useEffect(() => {
    if (messageRef.current && displayContent) {
      messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [displayContent]);

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
      <div className="flex flex-col items-start space-y-2 flex-1 min-w-0">
        {/* Message Header */}
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <span className="font-medium">Assistant</span>
          {isTyping && <span>• Responding...</span>}
        </div>

        {/* Message Bubble */}
        <div className="relative max-w-full lg:max-w-2xl">
          <motion.div
            className="rounded-2xl border bg-muted px-4 py-3 shadow-sm"
            initial={{ scale: 0.95, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {!displayContent ? (
              <AIStreamingIndicator
                type="thinking"
                label="Generating response..."
                className="py-2"
              />
            ) : (
              <>
                <OptimizedMarkdownRenderer
                  content={displayContent}
                  isStreaming={isTyping}
                />
                {isTyping && (
                  <motion.span
                    className="inline-block w-2 h-4 bg-primary/60 ml-0.5"
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  />
                )}
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
