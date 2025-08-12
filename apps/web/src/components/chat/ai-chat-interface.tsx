'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { 
  ArrowDown, 
  Loader2, 
  MessageSquare,
  Plus,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { createModuleLogger } from '@/lib/utils/logger';
import { EnhancedMessageBubble } from './enhanced-message-bubble';
import { EnhancedMessageInput } from './enhanced-message-input';

const log = createModuleLogger('components/chat/ai-chat-interface');

interface AIChatInterfaceProps {
  chatId?: string;
  className?: string;
  onNewChat?: () => void;
  onSettingsClick?: () => void;
}

/**
 * AI-powered chat interface using Vercel AI SDK with Convex persistence
 * Modern, performant, and feature-rich chat experience
 */
export function AIChatInterface({
  chatId,
  className,
  onNewChat,
  onSettingsClick,
}: AIChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  
  // Convex queries and mutations
  const messagesQuery = useQuery(
    api.messages.getByChatId,
    chatId ? { chatId: chatId as Id<'chats'>, limit: 100 } : 'skip'
  );
  const chatQuery = useQuery(
    api.chats.getById,
    chatId ? { id: chatId as Id<'chats'> } : 'skip'
  );
  const saveMessageMutation = useMutation(api.messages.create);
  const updateChatMutation = useMutation(api.chatsAuth.updateMyChat);

  // Convert Convex messages to UI messages
  const initialMessages: UIMessage[] = messagesQuery?.map((msg: any) => ({
    id: msg._id,
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content,
    createdAt: new Date(msg.createdAt || msg._creationTime),
    parts: [
      {
        type: 'text' as const,
        text: msg.content,
      },
    ],
    experimental_attachments: msg.attachments?.map((att: any) => ({
      name: att.name,
      contentType: att.mimeType || att.type,
      url: att.url,
    })),
  })) || [];

  // Use AI SDK's useChat hook
  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    append,
    reload,
    stop,
    status,
    error,
    setMessages,
  } = useChat({
    id: chatId,
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
    messages: initialMessages,
    body: {
      chatId,
      model: chatQuery?.model || 'gpt-4-turbo-preview',
    },
    onFinish: async (message) => {
      // Save assistant message to Convex
      if (chatId && message.role === 'assistant') {
        try {
          await saveMessageMutation({
            chatId: chatId as Id<'chats'>,
            content: message.content,
            role: 'assistant',
            model: chatQuery?.model || 'gpt-4-turbo-preview',
          });
          
          // Update chat's last message timestamp
          await updateChatMutation({
            id: chatId as Id<'chats'>,
            lastMessageAt: Date.now(),
          });
        } catch (error) {
          log.error('Failed to save message', { error });
        }
      }
    },
    onError: (error) => {
      log.error('Chat error', { error: error.message });
      toast.error('Chat error: ' + error.message);
    },
    experimental_throttle: 50,
  });

  // Enhanced send message with attachments
  const handleSendMessage = useCallback(
    async (
      content: string,
      options?: {
        attachments?: Array<{
          id: string;
          name: string;
          size: number;
          type: string;
          url: string;
        }>;
        useReasoning?: boolean;
      }
    ) => {
      if (!chatId) {
        toast.error('No chat selected');
        return;
      }

      // Save user message to Convex first
      try {
        await saveMessageMutation({
          chatId: chatId as Id<'chats'>,
          content,
          role: 'user',
          attachments: options?.attachments?.map((att) => ({
            name: att.name,
            type: (att.type.startsWith('image/') ? 'image' :
                   att.type.startsWith('video/') ? 'video' : 'file') as 'image' | 'file' | 'video',
            mimeType: att.type,
            url: att.url,
            size: att.size,
          })),
        });
      } catch (error) {
        log.error('Failed to save user message', { error });
      }

      // Prepare message for AI SDK
      const messageToSend: any = {
        role: 'user' as const,
        content,
      };

      if (options?.attachments) {
        messageToSend.experimental_attachments = options.attachments.map((att) => ({
          name: att.name,
          contentType: att.type,
          url: att.url,
        }));
      }

      // Append message with reasoning flag if needed
      await append(messageToSend, {
        data: {
          useReasoning: options?.useReasoning,
        },
      });
    },
    [chatId, saveMessageMutation, append]
  );

  // Regenerate last assistant message
  const handleRegenerateMessage = useCallback(() => {
    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === 'user');
    
    if (lastUserMessage) {
      // Remove last assistant message
      const filteredMessages = messages.slice(0, -1);
      setMessages(filteredMessages);
      
      // Resend last user message
      append(lastUserMessage);
    }
  }, [messages, setMessages, append]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    if (!scrollRef.current) return;
    
    const scrollElement = scrollRef.current;
    const targetScroll = scrollElement.scrollHeight - scrollElement.clientHeight;
    
    if (smooth) {
      scrollElement.scrollTo({
        top: targetScroll,
        behavior: 'smooth',
      });
    } else {
      scrollElement.scrollTop = targetScroll;
    }
    
    setIsAutoScrolling(true);
  }, []);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isNearBottom = distanceFromBottom < 100;
    
    setShowScrollButton(!isNearBottom);
    setIsAutoScrolling(isNearBottom);
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isAutoScrolling && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isAutoScrolling, scrollToBottom]);

  // Loading state
  if (!chatId) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium">No chat selected</p>
          <p className="text-sm text-muted-foreground">Create or select a chat to begin</p>
          {onNewChat && (
            <Button onClick={onNewChat} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              New Chat
            </Button>
          )}
        </div>
      </div>
    );
  }

  const isStreaming = status === 'streaming';
  const isLoading = status === 'submitted';

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-lg">
            {chatQuery?.title || 'Chat'}
          </h2>
          {isStreaming && (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex items-center gap-1 text-sm text-muted-foreground"
            >
              <Sparkles className="h-3 w-3" />
              <span>Anubis is thinking...</span>
            </motion.div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {onSettingsClick && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onSettingsClick}
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
          {onNewChat && (
            <Button
              size="sm"
              variant="outline"
              onClick={onNewChat}
            >
              <Plus className="mr-1 h-3 w-3" />
              New
            </Button>
          )}
        </div>
      </div>

      {/* Messages area */}
      <ScrollArea
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 p-4"
      >
        <div className="mx-auto max-w-3xl space-y-4">
          {/* Welcome message if no messages */}
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <Sparkles className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h3 className="mb-2 text-xl font-semibold">
                Welcome to Anubis Chat
              </h3>
              <p className="text-muted-foreground">
                I'm here to help with blockchain, Web3, and more. Ask me anything!
              </p>
            </motion.div>
          )}

          {/* Messages */}
          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <EnhancedMessageBubble
                key={message.id}
                message={message}
                onRegenerate={
                  message.role === 'assistant' && 
                  messages[messages.length - 1].id === message.id
                    ? handleRegenerateMessage
                    : undefined
                }
                isStreaming={
                  isStreaming && 
                  messages[messages.length - 1].id === message.id
                }
              />
            ))}
          </AnimatePresence>

          {/* Loading indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-muted-foreground"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Anubis is preparing a response...</span>
            </motion.div>
          )}

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
            >
              {error.message}
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scrollToBottom()}
            className="absolute bottom-24 right-4 rounded-full bg-background border shadow-lg p-2"
          >
            <ArrowDown className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className="border-t p-4">
        <div className="mx-auto max-w-3xl">
          <EnhancedMessageInput
            onSend={handleSendMessage}
            disabled={!chatId || isStreaming}
            isStreaming={isStreaming}
            placeholder={
              isStreaming 
                ? 'Anubis is responding...' 
                : 'Message Anubis...'
            }
          />
          
          {/* Stop button when streaming */}
          {isStreaming && (
            <div className="mt-2 flex justify-center">
              <Button
                size="sm"
                variant="outline"
                onClick={stop}
              >
                Stop generating
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}