'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@isis-chat/backend/convex/_generated/api';
import type { Id } from '@isis-chat/backend/convex/_generated/dataModel';
import type { Chat, ChatMessage } from '@/lib/types/api';

import { ChatList } from './chat-list';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { ChatHeader } from './chat-header';
import { AgentSelector } from './agent-selector';
import { LoadingStates } from '@/components/data/loading-states';
import { EmptyState } from '@/components/data/empty-states';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  Sidebar, 
  X,
  Plus,
  Settings,
  Bot
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthContext } from '@/components/providers/auth-provider';
import { useSolanaAgent } from '@/components/providers/solana-agent-provider';

interface ChatInterfaceProps {
  className?: string;
}

/**
 * ChatInterface - Main chat application component
 * Provides modern AI chat experience with sidebar navigation and message handling
 */
export function ChatInterface({ className }: ChatInterfaceProps) {
  const { user, isAuthenticated } = useAuthContext();
  const { selectedAgent, isInitialized } = useSolanaAgent();
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  // Convex queries and mutations
  const chats = useQuery(
    api.chats.list,
    isAuthenticated && user ? { ownerId: user.walletAddress } : 'skip'
  );

  const messages = useQuery(
    api.messages.list,
    selectedChatId ? { chatId: selectedChatId as Id<'chats'> } : 'skip'
  );

  const createChat = useMutation(api.chats.create);
  const sendMessage = useMutation(api.messages.send);
  const deleteChat = useMutation(api.chats.delete);

  const currentChat = chats?.find(chat => chat._id === selectedChatId);

  // Auto-select first chat on load
  useEffect(() => {
    if (chats && chats.length > 0 && !selectedChatId) {
      setSelectedChatId(chats[0]._id);
    }
  }, [chats, selectedChatId]);

  const handleCreateChat = async () => {
    if (!user) return;
    
    setIsCreatingChat(true);
    try {
      const newChatId = await createChat({
        title: `New Chat ${new Date().toLocaleTimeString()}`,
        ownerId: user.walletAddress,
        model: selectedAgent?.model || user.preferences.aiModel,
        systemPrompt: selectedAgent?.systemPrompt || 'You are ISIS, a helpful AI assistant with access to Solana blockchain operations.',
      });
      setSelectedChatId(newChatId);
    } catch (error) {
      console.error('Failed to create chat:', error);
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedChatId || !user) return;

    try {
      await sendMessage({
        chatId: selectedChatId as Id<'chats'>,
        content,
        role: 'user',
      });
      
      // TODO: Implement AI response streaming
      // This will be enhanced with actual AI integration
      setTimeout(() => {
        sendMessage({
          chatId: selectedChatId as Id<'chats'>,
          content: `I received your message: "${content}". AI response streaming will be implemented next.`,
          role: 'assistant',
          metadata: {
            model: user.preferences.aiModel,
            tokensUsed: 0,
            processingTime: 100,
          }
        });
      }, 1000);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await deleteChat({ id: chatId as Id<'chats'> });
      if (selectedChatId === chatId) {
        const remainingChats = chats?.filter(chat => chat._id !== chatId);
        setSelectedChatId(remainingChats?.[0]?._id);
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <EmptyState
          icon={<MessageSquare className="h-12 w-12 text-muted-foreground" />}
          title="Authentication Required"
          description="Please connect your wallet and sign in to access the chat interface"
        />
      </div>
    );
  }

  return (
    <div className={cn("flex h-screen bg-background", className)}>
      {/* Sidebar */}
      <div 
        className={cn(
          "flex-shrink-0 border-border border-r bg-muted/50 transition-all duration-300",
          sidebarOpen ? "w-80" : "w-0"
        )}
      >
        <div className={cn("h-full overflow-hidden", sidebarOpen ? "block" : "hidden")}>
          {/* Sidebar Header */}
          <div className="flex h-14 items-center justify-between border-border border-b px-4">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-primary" />
              <span className="font-semibold">ISIS Chat</span>
            </div>
            <Button
              onClick={() => setSidebarOpen(false)}
              size="sm"
              variant="ghost"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Chat List */}
          {chats === undefined ? (
            <div className="p-4">
              <LoadingStates variant="skeleton" />
            </div>
          ) : (
            <ChatList
              chats={chats}
              onChatCreate={handleCreateChat}
              onChatDelete={handleDeleteChat}
              onChatSelect={setSelectedChatId}
              selectedChatId={selectedChatId}
            />
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        {/* Top Bar */}
        <div className="flex h-14 items-center justify-between border-border border-b bg-background px-4">
          <div className="flex items-center space-x-3">
            {!sidebarOpen && (
              <Button
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
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium text-muted-foreground">Select a chat</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Agent Selector */}
            {isInitialized && (
              <AgentSelector />
            )}
            
            <Button
              disabled={isCreatingChat}
              onClick={handleCreateChat}
              size="sm"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-1" />
              New Chat
            </Button>
            
            <Button size="sm" variant="ghost">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Chat Content */}
        {!currentChat ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              action={
                chats?.length === 0 ? {
                  label: "Start Your First Chat",
                  onClick: handleCreateChat,
                } : undefined
              }
              description={
                chats?.length === 0
                  ? "Create your first chat to start conversing with AI agents"
                  : "Select a chat from the sidebar to continue"
              }
              icon={<MessageSquare className="h-12 w-12 text-muted-foreground" />}
              title={chats?.length === 0 ? "Welcome to ISIS Chat" : "No Chat Selected"}
            />
          </div>
        ) : (
          <div className="flex flex-1 flex-col">
            {/* Message List */}
            <div className="flex-1 overflow-hidden">
              {messages === undefined ? (
                <div className="flex h-full items-center justify-center">
                  <LoadingStates size="lg" variant="spinner" text="Loading messages..." />
                </div>
              ) : (
                <MessageList
                  messages={messages}
                  onMessageRegenerate={(messageId) => {
                    // TODO: Implement message regeneration
                    console.log('Regenerate message:', messageId);
                  }}
                />
              )}
            </div>

            {/* Message Input */}
            <div className="border-border border-t bg-background p-4">
              <MessageInput
                disabled={!selectedChatId || messages === undefined}
                onSend={handleSendMessage}
                placeholder="Type your message..."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatInterface;