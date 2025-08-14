'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { forwardRef, useEffect, useRef } from 'react';
import { EmptyState } from '@/components/data/empty-states';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { AIMessage as AIMessageType } from '@/hooks/use-ai-chat';
import { cn } from '@/lib/utils';
import { AIMessage } from './aiMessage';
import { AISuggestions } from './aiSuggestions';

interface ThreadProps {
  messages: AIMessageType[];
  isLoading?: boolean;
  suggestions?: string[];
  onSuggestionSelect?: (suggestion: string) => void;
  onMessageRegenerate?: (messageId: string) => void;
  onMessageFeedback?: (
    messageId: string,
    type: 'positive' | 'negative'
  ) => void;
  className?: string;
}

export const Thread = forwardRef<HTMLDivElement, ThreadProps>(
  (
    {
      messages,
      isLoading = false,
      suggestions = [],
      onSuggestionSelect,
      onMessageRegenerate,
      onMessageFeedback,
      className,
    },
    ref
  ) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
      if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, []);

    if (!messages || messages.length === 0) {
      return (
        <div
          className={cn(
            'flex h-full flex-col items-center justify-center p-8',
            className
          )}
          ref={ref}
        >
          <EmptyState
            description="Ask me anything or choose from the suggestions below"
            icon={<MessageSquare className="h-12 w-12 text-muted-foreground" />}
            title="Start a conversation"
          />

          {suggestions.length > 0 && onSuggestionSelect && (
            <div className="mt-8 w-full max-w-2xl">
              <AISuggestions
                onSelect={onSuggestionSelect}
                suggestions={suggestions}
              />
            </div>
          )}
        </div>
      );
    }

    // Group messages by date
    const groupedMessages = groupMessagesByDate(messages);

    return (
      <ScrollArea className={cn('flex-1 overflow-y-auto', className)} ref={ref}>
        <div className="mx-auto max-w-4xl space-y-6 p-4 pb-32" ref={scrollRef}>
          <AnimatePresence initial={false}>
            {groupedMessages.map((group, groupIndex) => (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                initial={{ opacity: 0, y: 20 }}
                key={group.date}
                transition={{ duration: 0.3, delay: groupIndex * 0.05 }}
              >
                {/* Date separator */}
                <div className="flex items-center justify-center py-4">
                  <div className="rounded-full bg-muted px-3 py-1 text-muted-foreground text-xs">
                    {formatDate(group.date)}
                  </div>
                </div>

                {/* Messages for this date */}
                <div className="space-y-4">
                  {group.messages.map((message, messageIndex) => (
                    <motion.div
                      animate={{ opacity: 1, x: 0 }}
                      initial={{
                        opacity: 0,
                        x: message.role === 'user' ? 20 : -20,
                      }}
                      key={message.id}
                      transition={{
                        duration: 0.3,
                        delay: messageIndex * 0.05,
                      }}
                    >
                      <AIMessage
                        message={message}
                        onFeedback={
                          message.role === 'assistant' && onMessageFeedback
                            ? (type: 'positive' | 'negative') =>
                                onMessageFeedback(message.id, type)
                            : undefined
                        }
                        onRegenerate={
                          message.role === 'assistant' && onMessageRegenerate
                            ? () => onMessageRegenerate(message.id)
                            : undefined
                        }
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading indicator */}
          {isLoading && (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-muted-foreground"
              initial={{ opacity: 0, y: 20 }}
            >
              <div className="flex space-x-1">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
                <span
                  className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary"
                  style={{ animationDelay: '0.2s' }}
                />
                <span
                  className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary"
                  style={{ animationDelay: '0.4s' }}
                />
              </div>
              <span className="text-sm">AI is thinking...</span>
            </motion.div>
          )}

          {/* Scroll anchor */}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    );
  }
);

Thread.displayName = 'Thread';

// Helper functions
function groupMessagesByDate(messages: AIMessageType[]) {
  const groups: Array<{ date: string; messages: AIMessageType[] }> = [];

  for (const message of messages) {
    const date = message.createdAt
      ? new Date(message.createdAt).toDateString()
      : new Date().toDateString();

    const lastGroup = groups.at(-1);
    if (lastGroup && lastGroup.date === date) {
      lastGroup.messages.push(message);
    } else {
      groups.push({ date, messages: [message] });
    }
  }

  return groups;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}
