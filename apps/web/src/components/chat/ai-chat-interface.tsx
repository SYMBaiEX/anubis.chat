'use client';

import { useChat } from '@ai-sdk/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useMutation, useQuery } from 'convex/react';
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
import { toast } from 'sonner';
import { useAuthContext } from '@/components/providers/auth-provider';
import { useSolanaAgent } from '@/components/providers/solana-agent-provider';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { createModuleLogger } from '@/lib/utils/logger';
import { AgentSelectorDialog } from './agent-selector-dialog';
import { ChatHeader } from './chat-header';
import { EnhancedMessageBubble } from './enhanced-message-bubble';
import { EnhancedMessageInput } from './enhanced-message-input';
import { ModelSelector } from './model-selector';

const log = createModuleLogger('components/chat/ai-chat-interface');

interface AIChatInterfaceProps {
  chatId?: string;
  className?: string;
  onNewChat?: () => void;
  onSettingsClick?: () => void;
  onModelSelectorClick?: () => void;
  onAgentSelectorClick?: () => void;
  onDeleteChat?: (chatId: string) => void;
  onRenameChat?: (chatId: string, newTitle: string) => void;
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
  onModelSelectorClick,
  onAgentSelectorClick,
  onDeleteChat,
  onRenameChat,
}: AIChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [selectedModel, setSelectedModel] = useState('gpt-5-nano');

  // Get user from auth context
  const { user } = useAuthContext();
  const { selectedAgent } = useSolanaAgent();

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
  const updateLastMessageTime = useMutation(api.chats.updateLastMessageTime);

  // Convert Convex messages to UI messages
  const initialMessages: UIMessage[] =
    messagesQuery?.map((msg: any) => ({
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
      attachments: msg.attachments?.map((att: any) => ({
        name: att.name,
        contentType: att.mimeType || att.type,
        url: att.url,
      })),
    })) || [];

  // Use AI SDK's useChat hook (v5)
  const { messages, sendMessage, stop, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: {
        chatId,
        model: selectedModel || chatQuery?.model || 'gpt-5-nano',
      },
    }),
    messages: initialMessages,
    onFinish: async ({ message }) => {
      // Save assistant message to Convex
      if (chatId && message && message.role === 'assistant') {
        const userWalletAddress = user?.walletAddress || 'anonymous';
        try {
          // Extract content from message parts
          const messageContent =
            message.parts
              ?.filter((part: any) => part.type === 'text')
              .map((part: any) => part.text)
              .join('') || '';

          await saveMessageMutation({
            chatId: chatId as Id<'chats'>,
            walletAddress: userWalletAddress,
            content: messageContent,
            role: 'assistant',
          });

          // Update chat's last message timestamp
          await updateLastMessageTime({
            id: chatId as Id<'chats'>,
            timestamp: Date.now(),
          });
        } catch (error) {
          log.error('Failed to save message', { error });
        }
      }
    },
    onError: (error) => {
      log.error('Chat error', { error: error.message });
      toast.error(`Chat error: ${error.message}`);
    },
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

      // Get user wallet address from auth context
      const userWalletAddress = user?.walletAddress || 'anonymous';

      // Save user message to Convex first
      try {
        await saveMessageMutation({
          chatId: chatId as Id<'chats'>,
          walletAddress: userWalletAddress,
          content,
          role: 'user',
          attachments: options?.attachments?.map((att) => ({
            fileId: att.id, // Use the id as fileId
            type: (att.type.startsWith('image/')
              ? 'image'
              : att.type.startsWith('video/')
                ? 'video'
                : 'file') as 'image' | 'file' | 'video',
            mimeType: att.type,
            url: att.url,
            size: att.size,
          })),
        });
      } catch (error) {
        log.error('Failed to save user message', { error });
        toast.error('Failed to save message');
        return;
      }

      // Prepare message for AI SDK
      const messageToSend: any = {
        role: 'user' as const,
        content,
      };

      if (options?.attachments) {
        messageToSend.attachments = options.attachments.map((att) => ({
          name: att.name,
          contentType: att.type,
          url: att.url,
        }));
      }

      // Send message with reasoning flag if needed
      if (sendMessage && typeof sendMessage === 'function') {
        await sendMessage(messageToSend, {
          body: {
            chatId,
            model: selectedModel || chatQuery?.model || 'gpt-5-nano',
            useReasoning: options?.useReasoning,
          },
        });
      } else {
        log.error('SendMessage function not available');
        toast.error('Chat functionality is not ready');
      }
    },
    [
      chatId,
      saveMessageMutation,
      sendMessage,
      user,
      selectedModel,
      chatQuery?.model,
    ]
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
      sendMessage(lastUserMessage, {
        body: {
          chatId,
          model: selectedModel || chatQuery?.model || 'gpt-5-nano',
        },
      });
    }
  }, [
    messages,
    setMessages,
    sendMessage,
    chatId,
    selectedModel,
    chatQuery?.model,
  ]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    if (!scrollRef.current) {
      return;
    }

    const scrollElement = scrollRef.current;
    const targetScroll =
      scrollElement.scrollHeight - scrollElement.clientHeight;

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
    if (!scrollRef.current) {
      return;
    }

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
          <p className="font-medium text-lg">No chat selected</p>
          <p className="text-muted-foreground text-sm">
            Create or select a chat to begin
          </p>
          {onNewChat && (
            <Button className="mt-4" onClick={onNewChat}>
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

  // Handle chat operations
  const handleClearHistory = async () => {
    // TODO: Implement clear history
    toast.info('Clear history not yet implemented');
  };

  const handleGenerateTitle = async () => {
    // TODO: Implement generate title
    toast.info('Generate title not yet implemented');
  };

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left side - Chat info and actions */}
          <div className="flex flex-1 items-center gap-3">
            {chatQuery && (
              <ChatHeader
                chat={{
                  _id: chatId as Id<'chats'>,
                  title: chatQuery.title || 'New Chat',
                  model: selectedModel || chatQuery.model || 'gpt-5-nano',
                  lastMessageAt: chatQuery.lastMessageAt || Date.now(),
                  updatedAt: chatQuery.updatedAt || Date.now(),
                  systemPrompt: chatQuery.systemPrompt,
                  temperature: chatQuery.temperature,
                  agentPrompt: chatQuery.agentPrompt,
                  agentId: chatQuery.agentId,
                }}
                onAgentSelectorClick={() => {}}
                onClearHistory={handleClearHistory}
                onDelete={() => {
                  if (chatId && onDeleteChat) {
                    onDeleteChat(chatId);
                  }
                }}
                onGenerateTitle={handleGenerateTitle}
                onModelSelectorClick={() => {}}
                onRename={(newTitle) => {
                  if (chatId && onRenameChat) {
                    onRenameChat(chatId, newTitle);
                  }
                }}
                onSettingsClick={onSettingsClick || (() => {})}
              />
            )}
          </div>

          {/* Right side - Model, Agent, New Chat buttons */}
          <div className="flex items-center gap-2">
            {/* Model Selector with integrated dialog */}
            <div className="hidden sm:block">
              <ModelSelector
                onValueChange={(model) => {
                  setSelectedModel(model);
                  // TODO: Update chat model in Convex
                  if (chatId) {
                    updateChatMutation({
                      id: chatId as Id<'chats'>,
                      model,
                    })
                      .then(() => {
                        toast.success(`Switched to ${model}`);
                      })
                      .catch(() => {
                        toast.error('Failed to update model');
                      });
                  }
                }}
                value={selectedModel}
              />
            </div>

            {/* Agent Selector with integrated dialog */}
            <div className="hidden sm:block">
              <AgentSelectorDialog />
            </div>

            {/* Settings Button */}
            {onSettingsClick && (
              <Button
                className="h-8 w-8 border-primary/20 transition-all hover:border-primary/50 hover:bg-primary/10"
                onClick={onSettingsClick}
                size="icon"
                variant="outline"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}

            {/* New Chat Button */}
            {onNewChat && (
              <Button
                className="bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
                onClick={onNewChat}
                size="sm"
              >
                <Plus className="mr-1 h-3 w-3" />
                <span className="hidden sm:inline">New</span>
                <span className="sm:hidden">+</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Messages area */}
      <ScrollArea
        className="flex-1 p-4"
        onScroll={handleScroll}
        ref={scrollRef}
      >
        <div className="mx-auto max-w-3xl space-y-4">
          {/* Welcome message if no messages */}
          {messages.length === 0 && (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="py-12 text-center"
              initial={{ opacity: 0, y: 20 }}
            >
              <Sparkles className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h3 className="mb-2 font-semibold text-xl">
                Welcome to Anubis Chat
              </h3>
              <p className="text-muted-foreground">
                I'm here to help with blockchain, Web3, and more. Ask me
                anything!
              </p>
            </motion.div>
          )}

          {/* Messages */}
          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <EnhancedMessageBubble
                isStreaming={isStreaming && messages.at(-1)?.id === message.id}
                key={message.id}
                message={message}
                onRegenerate={
                  message.role === 'assistant' &&
                  messages.at(-1)?.id === message.id
                    ? handleRegenerateMessage
                    : undefined
                }
              />
            ))}
          </AnimatePresence>

          {/* Loading indicator */}
          {isLoading && (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-muted-foreground"
              initial={{ opacity: 0, y: 10 }}
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Anubis is preparing a response...</span>
            </motion.div>
          )}

          {/* Error message */}
          {error && (
            <motion.div
              animate={{ opacity: 1 }}
              className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-destructive text-sm"
              initial={{ opacity: 0 }}
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
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-4 bottom-24 rounded-full border bg-background p-2 shadow-lg"
            exit={{ opacity: 0, scale: 0.8 }}
            initial={{ opacity: 0, scale: 0.8 }}
            onClick={() => scrollToBottom()}
          >
            <ArrowDown className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className="border-t p-4">
        <div className="mx-auto max-w-3xl">
          <EnhancedMessageInput
            disabled={!chatId || isStreaming}
            isStreaming={isStreaming}
            onSend={handleSendMessage}
            placeholder={
              isStreaming ? 'Anubis is responding...' : 'Message Anubis...'
            }
          />

          {/* Stop button when streaming */}
          {isStreaming && (
            <div className="mt-2 flex justify-center">
              <Button onClick={stop} size="sm" variant="outline">
                Stop generating
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
