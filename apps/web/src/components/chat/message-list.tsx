'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, MessageSquare } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // Get dynamic font size classes - Applied immediately before render
  const fontSizes = useMemo(() => getFontSizeClasses(fontSize), [fontSize]);

  // Enhanced scroll-to-bottom with better performance
  const scrollToBottom = useCallback((smooth = true) => {
    if (!scrollRef.current) return;
    
    const scrollElement = scrollRef.current;
    const targetScroll = scrollElement.scrollHeight - scrollElement.clientHeight;
    
    if (smooth) {
      // Use requestAnimationFrame for smoother scrolling
      const startScroll = scrollElement.scrollTop;
      const distance = targetScroll - startScroll;
      const duration = 300;
      let start: number | null = null;
      
      const step = (timestamp: number) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
        
        scrollElement.scrollTop = startScroll + distance * easeProgress;
        
        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };
      
      requestAnimationFrame(step);
    } else {
      scrollElement.scrollTop = targetScroll;
    }
    
    setIsAutoScrolling(true);
  }, []);

  // Enhanced auto-scroll with streaming support
  useEffect(() => {
    if (!messages) return;
    
    const hasNewMessage = messages.length > lastMessageCount;
    const hasStreamingMessage = messages.some(m => 
      'isStreaming' in m && (m as StreamingMessage).isStreaming
    );
    
    // Auto-scroll conditions:
    // 1. New message arrived and auto-scrolling is enabled
    // 2. Streaming message is active
    // 3. User is not manually scrolling
    if ((hasNewMessage || hasStreamingMessage) && isAutoScrolling && !isUserScrolling) {
      // Use smooth scrolling for streaming, instant for new messages
      scrollToBottom(hasStreamingMessage);
      
      if (hasNewMessage) {
        setLastMessageCount(messages.length);
      }
    }
  }, [messages, lastMessageCount, isAutoScrolling, isUserScrolling, scrollToBottom]);
  
  // Auto-scroll for streaming content updates
  useEffect(() => {
    if (!messages) return;
    
    const streamingMessage = messages.find(m => 
      'isStreaming' in m && (m as StreamingMessage).isStreaming
    );
    
    if (streamingMessage && isAutoScrolling && !isUserScrolling) {
      // Debounce streaming scrolls for performance
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      scrollTimeoutRef.current = setTimeout(() => {
        scrollToBottom(true);
      }, 50);
    }
    
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [messages, isAutoScrolling, isUserScrolling, scrollToBottom]);

  // Enhanced scroll handler with user scroll detection
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isNearBottom = distanceFromBottom < 100;
    
    // Detect if user is scrolling
    if (!isNearBottom && !isUserScrolling) {
      setIsUserScrolling(true);
      setIsAutoScrolling(false);
    } else if (isNearBottom && isUserScrolling) {
      setIsUserScrolling(false);
      setIsAutoScrolling(true);
    }
    
    // Show scroll button when not at bottom
    setShowScrollButton(!isNearBottom && messages && messages.length > 0);
  }, [messages, isUserScrolling]);

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

              {/* Messages for this date with animations */}
              <AnimatePresence mode="popLayout">
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
                          <motion.div
                            key={(message as StreamingMessage).id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                          >
                            <StreamingMessageComponent
                              content={(message as StreamingMessage).content}
                            />
                          </motion.div>
                        );
                      }

                      return (
                        <motion.div
                          key={(message as ChatMessage | MinimalMessage)._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3, ease: 'easeOut' }}
                        >
                          <MessageBubble
                            fontSize={fontSize}
                            message={message as ChatMessage}
                            onCopy={() => {
                              navigator.clipboard.writeText(
                                (message as ChatMessage | MinimalMessage).content
                              );
                            }}
                            onEdit={(_newContent) => {}}
                            onRegenerate={() =>
                              onMessageRegenerate?.(
                                (message as ChatMessage | MinimalMessage)._id
                              )
                            }
                            showActions={true}
                          />
                        </motion.div>
                      );
                    }
                  )}
                </div>
              </AnimatePresence>
            </div>
          ))}

          {/* Animated Typing Indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex justify-start"
              >
                <div className="max-w-xs">
                  <TypingIndicator isTyping={true} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scroll anchor */}
          <div className="h-1" />
        </div>
      </ScrollArea>

      {/* Animated Scroll to Bottom Button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.div
            className="absolute right-4 bottom-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              className="rounded-full shadow-lg transition-transform hover:scale-110"
              onClick={() => {
                setIsUserScrolling(false);
                setIsAutoScrolling(true);
                scrollToBottom(true);
              }}
              size="sm"
              variant="secondary"
            >
              <ArrowDown className="h-4 w-4" />
              <span className="sr-only">Scroll to bottom</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {children}
    </div>
  );
}

export default MessageList;
