'use client';

import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { Bot, MessageSquare, Plus, Settings, Sidebar, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { EmptyState } from '@/components/data/empty-states';
import { LoadingStates } from '@/components/data/loading-states';
import { useAuthContext, useSubscriptionLimits, useUpgradePrompt, useCanSendMessage } from '@/components/providers/auth-provider';
import { UpgradePrompt } from '@/components/auth/upgrade-prompt';
import { FeatureGate } from '@/components/auth/feature-gate';
import { useSolanaAgent } from '@/components/providers/solana-agent-provider';
import { Button } from '@/components/ui/button';
import { useConvexChat } from '@/hooks/use-convex-chat';
import { useTypingIndicator } from '@/hooks/use-typing-indicator';
import { DEFAULT_MODEL } from '@/lib/constants/ai-models';
import type { Chat, ChatMessage } from '@/lib/types/api';
import { cn } from '@/lib/utils';
import { createModuleLogger } from '@/lib/utils/logger';
import { AgentSelector } from './agent-selector';
import { ChatHeader } from './chat-header';
import { ChatList } from './chat-list';
import { ChatWelcome } from './chat-welcome';
import { MessageInput } from './message-input';
import { MessageList } from './message-list';
import { ModelSelector } from './model-selector';
import { UsageIndicator } from './usage-indicator';

const log = createModuleLogger('components/chat/chat-interface');

interface ChatInterfaceProps {
  className?: string;
}

/**
 * ChatInterface - Main chat application component
 * Provides modern AI chat experience with sidebar navigation and message handling
 */
export function ChatInterface({ className }: ChatInterfaceProps) {
  const { user, isAuthenticated, token } = useAuthContext();
  const limits = useSubscriptionLimits();
  const upgradePrompt = useUpgradePrompt();
  const canSendMessage = useCanSendMessage();
  const { selectedAgent, isInitialized } = useSolanaAgent();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get chat ID from URL
  const urlChatId = searchParams.get('chatId');
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>(urlChatId || undefined);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL.id);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('ChatInterface - Auth state:', {
      isAuthenticated,
      user,
      walletAddress: user?.walletAddress,
    });
  }, [isAuthenticated, user]);

  // Convex queries and mutations
  const chats = useQuery(
    api.chats.getByOwner,
    isAuthenticated && user?.walletAddress
      ? { ownerId: user.walletAddress }
      : 'skip'
  );

  const createChat = useMutation(api.chats.create);
  const updateChat = useMutation(api.chats.update);
  const deleteChat = useMutation(api.chats.remove);

  // Use our new Convex chat hook for real-time streaming
  const { messages, sendMessage, isStreaming, streamingMessage } =
    useConvexChat(selectedChatId);

  // Use typing indicators
  const { typingUsers, startTyping, stopTyping, isAnyoneTyping } =
    useTypingIndicator(selectedChatId, user?.walletAddress);

  const currentChat = chats?.find((chat) => chat._id === selectedChatId);

  // Sync URL parameter with selected chat ID
  useEffect(() => {
    if (urlChatId && urlChatId !== selectedChatId) {
      setSelectedChatId(urlChatId);
    }
  }, [urlChatId]);

  // Auto-select first chat on load if no chat is selected
  useEffect(() => {
    if (chats && chats.length > 0 && !selectedChatId) {
      const firstChatId = chats[0]._id;
      setSelectedChatId(firstChatId);
      // Update URL to include the chat ID
      router.push(`/chat?chatId=${firstChatId}`);
    }
  }, [chats, selectedChatId, router]);

  // Update selected model when chat changes
  useEffect(() => {
    if (currentChat && currentChat.model) {
      setSelectedModel(currentChat.model);
    }
  }, [currentChat]);

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
    router.push(`/chat?chatId=${chatId}`);
  };

  const handleCreateChat = async () => {
    if (!user?.walletAddress) {
      console.error('Cannot create chat: User or wallet address is missing');
      return;
    }

    setIsCreatingChat(true);
    try {
      const newChat = await createChat({
        title: `New Chat ${new Date().toLocaleTimeString()}`,
        ownerId: user.walletAddress,
        model: selectedModel || DEFAULT_MODEL.id,
        systemPrompt:
          selectedAgent?.systemPrompt ||
          'You are ISIS, a helpful AI assistant with access to Solana blockchain operations.',
      });
      // The create mutation returns the full chat document, extract the _id
      if (newChat && newChat._id) {
        setSelectedChatId(newChat._id);
        // Update URL to include the new chat ID
        router.push(`/chat?chatId=${newChat._id}`);
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!(selectedChatId && user)) {
      console.error('Missing requirements for sending message:', {
        selectedChatId,
        user: !!user,
      });
      return;
    }

    // Check if user can send messages
    if (!canSendMessage) {
      setShowUpgradePrompt(true);
      return;
    }

    try {
      // Use the new Convex streaming function with selected model
      await sendMessage(content, user.walletAddress, selectedModel);
    } catch (error: any) {
      log.error('Failed to send message', { error: error?.message });
      // If error is about limits, show upgrade prompt
      if (error?.message?.includes('limit') || error?.message?.includes('quota')) {
        setShowUpgradePrompt(true);
      }
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await deleteChat({
        id: chatId as Id<'chats'>,
        ownerId: user?.walletAddress || '',
      });
      if (selectedChatId === chatId) {
        const remainingChats = chats?.filter((chat) => chat._id !== chatId);
        setSelectedChatId(remainingChats?.[0]?._id);
      }
    } catch (error: any) {
      log.error('Failed to delete chat', { error: error?.message });
    }
  };

  const handleModelChange = async (newModel: string) => {
    setSelectedModel(newModel);

    // Update the chat's model in the database
    if (selectedChatId && user?.walletAddress) {
      try {
        await updateChat({
          id: selectedChatId as Id<'chats'>,
          ownerId: user.walletAddress,
          model: newModel,
        });
      } catch (error: any) {
        log.error('Failed to update chat model', { error: error?.message });
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <EmptyState
          description="Please connect your wallet and sign in to access the chat interface"
          icon={<MessageSquare className="h-12 w-12 text-muted-foreground" />}
          title="Authentication Required"
        />
      </div>
    );
  }

  return (
    <div className={cn('flex h-full bg-background', className)}>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        {/* Top Bar */}
        <div className="flex h-14 items-center justify-between border-border/50 border-b bg-card/30 px-4 backdrop-blur">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <Button
                className="button-press"
                onClick={() => setSidebarOpen(true)}
                size="sm"
                variant="ghost"
              >
                <Sidebar className="h-4 w-4" />
              </Button>
            )}

            {currentChat ? (
              <ChatHeader
                chat={currentChat}
                onClearHistory={() => {
                  // TODO: Implement clear chat history
                  console.log('Clear history for chat:', currentChat._id);
                }}
                onSettingsClick={() => {
                  // TODO: Implement chat settings panel
                  console.log('Open settings for chat:', currentChat._id);
                }}
              />
            ) : (
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium text-muted-foreground">
                  Select a chat to begin
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Model Selector */}
            {currentChat && (
              <div className="w-64">
                <ModelSelector
                  disabled={isStreaming}
                  onValueChange={handleModelChange}
                  value={selectedModel}
                />
              </div>
            )}

            {/* Agent Selector */}
            {isInitialized && <AgentSelector />}

            <Button
              className="button-press"
              disabled={isCreatingChat}
              onClick={handleCreateChat}
              size="sm"
              variant="outline"
            >
              <Plus className="mr-1 h-4 w-4" />
              New Chat
            </Button>

            <Button className="button-press" size="sm" variant="ghost">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Chat Content */}
        {currentChat ? (
          <div className="flex flex-1 flex-col bg-gradient-to-br from-background via-muted/10 to-background">
            {/* Message List */}
            <div className="flex-1 overflow-hidden">
              {messages === undefined ? (
                <div className="flex h-full items-center justify-center">
                  <LoadingStates
                    size="lg"
                    text="Loading messages..."
                    variant="spinner"
                  />
                </div>
              ) : (
                <MessageList
                  isTyping={isAnyoneTyping}
                  messages={messages}
                  onMessageRegenerate={(messageId) => {
                    // TODO: Implement message regeneration
                    console.log('Regenerate message:', messageId);
                  }}
                />
              )}
            </div>

            {/* Upgrade Prompt */}
            {upgradePrompt.shouldShow && upgradePrompt.urgency === 'high' && (
              <div className="border-border/50 border-t bg-card/30 p-4">
                <div className="mx-auto max-w-4xl">
                  <UpgradePrompt 
                    prompt={upgradePrompt}
                    variant="inline"
                    onDismiss={() => setShowUpgradePrompt(false)}
                  />
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="border-border/50 border-t bg-card/30 p-4 backdrop-blur">
              <div className="mx-auto max-w-4xl">
                <MessageInput
                  disabled={
                    !selectedChatId || 
                    messages === undefined || 
                    isStreaming || 
                    !canSendMessage
                  }
                  onSend={handleSendMessage}
                  onTyping={startTyping}
                  placeholder={
                    !canSendMessage
                      ? 'Message limit reached - Upgrade to continue'
                      : isStreaming
                      ? 'ISIS is responding...'
                      : 'Ask ISIS anything...'
                  }
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
            {chats?.length === 0 ? (
              <ChatWelcome
                isCreating={isCreatingChat}
                onCreateChat={handleCreateChat}
              />
            ) : (
              <EmptyState
                description="Select a chat from the sidebar to continue"
                icon={
                  <MessageSquare className="h-12 w-12 text-muted-foreground" />
                }
                title="No Chat Selected"
              />
            )}
          </div>
        )}
      </div>

      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && upgradePrompt.suggestedTier && (
        <UpgradePrompt
          prompt={upgradePrompt}
          variant="modal"
          onDismiss={() => setShowUpgradePrompt(false)}
        />
      )}
    </div>
  );
}

export default ChatInterface;
