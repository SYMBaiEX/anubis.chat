'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
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
import { createModuleLogger } from '@/lib/utils/logger';

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
  const { selectedAgent, isInitialized } = useSolanaAgent();
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('ChatInterface - Auth state:', { isAuthenticated, user, walletAddress: user?.walletAddress });
  }, [isAuthenticated, user]);

  // Convex queries and mutations
  const chats = useQuery(
    api.chats.getByOwner,
    isAuthenticated && user?.walletAddress ? { ownerId: user.walletAddress } : 'skip'
  );

  const messages = useQuery(
    api.messages.getByChatId,
    selectedChatId ? { chatId: selectedChatId as Id<'chats'> } : 'skip'
  );

  const createChat = useMutation(api.chats.create);
  const deleteChat = useMutation(api.chats.remove);

  const currentChat = chats?.find(chat => chat._id === selectedChatId);

  // Auto-select first chat on load
  useEffect(() => {
    if (chats && chats.length > 0 && !selectedChatId) {
      setSelectedChatId(chats[0]._id);
    }
  }, [chats, selectedChatId]);

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
        model: selectedAgent?.model || user.preferences?.aiModel || 'gpt-4o',
        systemPrompt: selectedAgent?.systemPrompt || 'You are ISIS, a helpful AI assistant with access to Solana blockchain operations.',
      });
      // The create mutation returns the full chat document, extract the _id
      if (newChat && newChat._id) {
        setSelectedChatId(newChat._id);
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedChatId || !user || !token) {
      console.error('Missing requirements for sending message:', { selectedChatId, user: !!user, token: !!token });
      return;
    }

    try {
      // Use streaming API route which persists user and assistant messages
      const res = await fetch(`/api/chats/${selectedChatId}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content, role: 'user', stream: true }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Failed to send message:', res.status, errorText);
        throw new Error(`Failed to stream AI response: ${res.status}`);
      }
      // We don't need to consume the stream here; Convex queries will update when assistant message is saved server-side
    } catch (error: any) {
      log.error('Failed to send message', { error: error?.message });
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await deleteChat({ id: chatId as Id<'chats'> });
      if (selectedChatId === chatId) {
        const remainingChats = chats?.filter(chat => chat._id !== chatId);
        setSelectedChatId(remainingChats?.[0]?._id);
      }
    } catch (error: any) {
      log.error('Failed to delete chat', { error: error?.message });
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
    <div className={cn("flex h-full bg-background", className)}>
      {/* Sidebar */}
      <div 
        className={cn(
          "flex-shrink-0 border-r border-border/50 bg-card/50 backdrop-blur transition-all duration-300",
          sidebarOpen ? "w-80" : "w-0"
        )}
      >
        <div className={cn("h-full overflow-hidden", sidebarOpen ? "block" : "hidden")}>
          {/* Sidebar Header */}
          <div className="flex h-14 items-center justify-between border-b border-border/50 px-4 bg-gradient-to-r from-primary/5 to-accent/5">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold text-sm">Chat History</span>
            </div>
            <Button
              onClick={() => setSidebarOpen(false)}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
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
        <div className="flex h-14 items-center justify-between border-b border-border/50 bg-card/30 backdrop-blur px-4">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <Button
                onClick={() => setSidebarOpen(true)}
                size="sm"
                variant="ghost"
                className="button-press"
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
                <span className="font-medium text-muted-foreground">Select a chat to begin</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Agent Selector */}
            {isInitialized && (
              <AgentSelector />
            )}
            
            <Button
              disabled={isCreatingChat}
              onClick={handleCreateChat}
              size="sm"
              variant="outline"
              className="button-press"
            >
              <Plus className="h-4 w-4 mr-1" />
              New Chat
            </Button>
            
            <Button size="sm" variant="ghost" className="button-press">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Chat Content */}
        {!currentChat ? (
          <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
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
          <div className="flex flex-1 flex-col bg-gradient-to-br from-background via-muted/10 to-background">
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
            <div className="border-t border-border/50 bg-card/30 backdrop-blur p-4">
              <div className="max-w-4xl mx-auto">
                <MessageInput
                  disabled={!selectedChatId || messages === undefined}
                  onSend={handleSendMessage}
                  placeholder="Ask ISIS anything..."
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatInterface;