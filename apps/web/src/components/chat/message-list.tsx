'use client';

import { ArrowDown, MessageSquare } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { EmptyState } from '@/components/data/empty-states';
import { LoadingStates } from '@/components/data/loading-states';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ChatMessage, StreamingMessage } from '@/lib/types/api';
import type { MessageListProps, MinimalMessage } from '@/lib/types/components';
import { cn } from '@/lib/utils';
import { type FontSize, getFontSizeClasses } from '@/lib/utils/font-sizes';
import { MessageBubble } from './message-bubble';
import { StreamingMessage as StreamingMessageComponent } from './streaming-message';
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
  fontSize = 'medium',
}: MessageListProps & { isTyping?: boolean; fontSize?: FontSize }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);

  // Get dynamic font size classes
  const fontSizes = getFontSizeClasses(fontSize);

  // Stable scroll-to-bottom helper
  const scrollToBottom = useCallback((smooth = true) => {
    if (!scrollRef.current) {
      return;
    }

    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages && messages.length > lastMessageCount) {
      scrollToBottom();
      setLastMessageCount(messages.length);
    }
  }, [messages, lastMessageCount, scrollToBottom]);

  // Handle scroll event to show/hide scroll-to-bottom button
  const handleScroll = () => {
    if (!scrollRef.current) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom && messages && messages.length > 0);
  };



  // Group messages by date for date separators
  const groupMessagesByDate = (
    list: Array<ChatMessage | StreamingMessage | MinimalMessage>
  ) => {
    if (!list) {
      return [] as Array<{ date: string; messages: typeof list }>;
    }

    const groups: Array<{
      date: string;
      messages: Array<ChatMessage | StreamingMessage | MinimalMessage>;
    }> = [];

    for (const message of list) {
      const createdAt =
        'createdAt' in message && message.createdAt
          ? message.createdAt
          : Date.now();
      const messageDate = new Date(createdAt).toDateString();
      const lastGroup = groups.at(-1);

      if (lastGroup && lastGroup.date === messageDate) {
        lastGroup.messages.push(message);
      } else {
        groups.push({
          date: messageDate,
          messages: [message],
        });
      }
    }

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
      <div className="flex h-full items-center justify-center p-4 sm:p-8">
        <EmptyState
          description="Start the conversation by sending a message below"
          icon={
            <MessageSquare className="h-10 w-10 text-muted-foreground sm:h-12 sm:w-12" />
          }
          title="No messages yet"
        />
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div
      className={cn('relative flex h-full flex-col overflow-hidden', className)}
    >
      <ScrollArea
        className="flex-1 overflow-x-hidden"
        onScrollCapture={handleScroll}
        ref={scrollRef}
      >
        <div className="mx-auto w-full max-w-full space-y-2 overflow-x-hidden p-2 sm:max-w-6xl sm:space-y-4 sm:p-3 md:max-w-7xl md:p-4 lg:p-6 xl:px-8">
          {messageGroups.map((group, _groupIndex) => (
            <div key={group.date}>
              {/* Date Separator */}
              <div className="flex items-center justify-center py-1 sm:py-2">
                <div
                  className={cn(
                    'rounded-full bg-muted px-2 py-1 text-muted-foreground sm:px-3',
                    fontSizes.dateSeparator
                  )}
                >
                  {formatDateSeparator(group.date)}
                </div>
              </div>

              {/* Messages for this date */}
              <div className="space-y-2 sm:space-y-3 md:space-y-4">
                {group.messages.map(
                  (
                    message: ChatMessage | StreamingMessage | MinimalMessage,
                    _messageIndex: number
                  ) => {
                    // Check if this is a streaming message
                    if (
                      'isStreaming' in message &&
                      (message as StreamingMessage).isStreaming
                    ) {
                      return (
                        <StreamingMessageComponent
                          content={(message as StreamingMessage).content}
                          key={(message as StreamingMessage).id}
                        />
                      );
                    }

                    return (
                      <MessageBubble
                        fontSize={fontSize}
                        key={(message as ChatMessage | MinimalMessage)._id}
                        message={message as ChatMessage}
                        onCopy={() => {
                          navigator.clipboard.writeText(
                            (message as ChatMessage | MinimalMessage).content
                          );
                        }}
                        onEdit={(_newContent) => { }}
                        onRegenerate={() =>
                          onMessageRegenerate?.(
                            (message as ChatMessage | MinimalMessage)._id
                          )
                        }
                        showActions={true}
                      />
                    );
                  }
                )}
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
