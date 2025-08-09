'use client';

import { ArrowDown, MessageSquare } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { EmptyState } from '@/components/data/empty-states';
import { LoadingStates } from '@/components/data/loading-states';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { MessageListProps } from '@/lib/types/components';
import type { StreamingMessage } from '@/lib/types/api';
import { cn } from '@/lib/utils';
import { MessageBubble } from './message-bubble';
import { StreamingMessage } from './streaming-message';
import { TypingIndicator } from './typing-indicator';

/**
 * MessageList component - Displays conversation messages with auto-scroll
 * Handles message rendering, typing indicators, and scroll management
 */
export function MessageList({
  messages,
  loading = false,
  onMessageRegenerate,
  isTyping = false,
  className,
  children,
}: MessageListProps & { isTyping?: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages && messages.length > lastMessageCount) {
      scrollToBottom();
      setLastMessageCount(messages.length);
    }
  }, [messages, lastMessageCount]);

  // Handle scroll event to show/hide scroll-to-bottom button
  const handleScroll = () => {
    if (!scrollRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom && messages && messages.length > 0);
  };

  const scrollToBottom = (smooth = true) => {
    if (!scrollRef.current) return;

    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    });
  };

  // Group messages by date for date separators
  const groupMessagesByDate = (messages: typeof messages) => {
    if (!messages) return [];

    const groups: Array<{
      date: string;
      messages: typeof messages;
    }> = [];

    messages.forEach((message) => {
      const createdAt = 'createdAt' in message ? message.createdAt : Date.now();
      const messageDate = new Date(createdAt).toDateString();
      const lastGroup = groups[groups.length - 1];

      if (lastGroup && lastGroup.date === messageDate) {
        lastGroup.messages.push(message);
      } else {
        groups.push({
          date: messageDate,
          messages: [message],
        });
      }
    });

    return groups;
  };

  const formatDateSeparator = (dateString: string) => {
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
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingStates
          size="lg"
          text="Loading conversation..."
          variant="spinner"
        />
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <EmptyState
          description="Start the conversation by sending a message below"
          icon={<MessageSquare className="h-12 w-12 text-muted-foreground" />}
          title="No messages yet"
        />
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className={cn('relative flex h-full flex-col', className)}>
      <ScrollArea
        className="flex-1"
        onScrollCapture={handleScroll}
        ref={scrollRef}
      >
        <div className="space-y-4 p-4">
          {messageGroups.map((group, groupIndex) => (
            <div key={group.date}>
              {/* Date Separator */}
              <div className="flex items-center justify-center py-2">
                <div className="rounded-full bg-muted px-3 py-1 text-muted-foreground text-xs">
                  {formatDateSeparator(group.date)}
                </div>
              </div>

              {/* Messages for this date */}
              <div className="space-y-4">
                {group.messages.map((message, messageIndex) => {
                  // Check if this is a streaming message
                  if ('isStreaming' in message && message.isStreaming) {
                    return (
                      <StreamingMessage
                        content={message.content}
                        key={message.id}
                      />
                    );
                  }

                  return (
                    <MessageBubble
                      key={message._id}
                      message={message}
                      onCopy={() => {
                        navigator.clipboard.writeText(message.content);
                      }}
                      onEdit={(_newContent) => {}}
                      onRegenerate={() => onMessageRegenerate?.(message._id)}
                      showActions={true}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="max-w-xs">
                <TypingIndicator isTyping={true} />
              </div>
            </div>
          )}

          {/* Scroll anchor */}
          <div className="h-1" />
        </div>
      </ScrollArea>

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <div className="absolute right-4 bottom-4">
          <Button
            className="rounded-full shadow-lg"
            onClick={() => scrollToBottom()}
            size="sm"
            variant="secondary"
          >
            <ArrowDown className="h-4 w-4" />
            <span className="sr-only">Scroll to bottom</span>
          </Button>
        </div>
      )}

      {children}
    </div>
  );
}

export default MessageList;
