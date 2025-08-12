'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AIChatInterface } from '@/components/chat/ai-chat-interface';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

/**
 * Demo page showcasing the new AI-powered chat interface
 * Features AI SDK integration with streaming, attachments, and modern UI
 */
export default function ChatDemoPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthContext();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  // Convex queries and mutations
  const chats = useQuery(
    api.chatsAuth.getMyChats,
    isAuthenticated ? {} : 'skip'
  );
  const createChat = useMutation(api.chatsAuth.createMyChat);
  const deleteChat = useMutation(api.chatsAuth.deleteMyChat);

  // Create new chat
  const handleCreateChat = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to create a chat');
      return;
    }

    setIsCreatingChat(true);
    try {
      const newChat = await createChat({
        title: `Chat ${new Date().toLocaleTimeString()}`,
        model: 'gpt-4-turbo-preview',
        systemPrompt: '',
        agentPrompt: 'You are Anubis, a helpful AI assistant specializing in blockchain and Web3 technologies.',
      });

      if (newChat?._id) {
        setSelectedChatId(newChat._id);
        toast.success('Chat created successfully');
      }
    } catch (error) {
      toast.error('Failed to create chat');
      console.error('Create chat error:', error);
    } finally {
      setIsCreatingChat(false);
    }
  };

  // Delete chat
  const handleDeleteChat = async (chatId: string) => {
    try {
      await deleteChat({ id: chatId as Id<'chats'> });
      if (selectedChatId === chatId) {
        setSelectedChatId(null);
      }
      toast.success('Chat deleted');
    } catch (error) {
      toast.error('Failed to delete chat');
      console.error('Delete chat error:', error);
    }
  };

  // Handle settings click
  const handleSettingsClick = () => {
    router.push('/chat?openSettings=true');
  };

  if (!isAuthenticated) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-2xl font-semibold">Sign In Required</h2>
          <p className="text-muted-foreground">
            Please connect your wallet and sign in to access the chat demo
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r bg-muted/30">
        <div className="flex h-14 items-center justify-between border-b px-4">
          <h2 className="font-semibold">AI Chat Demo</h2>
          <Button
            size="sm"
            onClick={handleCreateChat}
            disabled={isCreatingChat}
          >
            <Plus className="mr-1 h-3 w-3" />
            New
          </Button>
        </div>

        <ScrollArea className="h-[calc(100%-3.5rem)]">
          <div className="p-2">
            {/* Feature highlights */}
            <div className="mb-4 rounded-lg bg-primary/10 p-3 text-sm">
              <h3 className="mb-2 font-semibold">✨ New Features</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• AI SDK streaming integration</li>
                <li>• File & image attachments</li>
                <li>• Multi-step reasoning mode</li>
                <li>• Modern message bubbles</li>
                <li>• Smooth animations</li>
                <li>• Code syntax highlighting</li>
                <li>• Message regeneration</li>
                <li>• Drag & drop files</li>
              </ul>
            </div>

            {/* Chat list */}
            <div className="space-y-1">
              {chats?.map((chat) => (
                <div
                  key={chat._id}
                  className={cn(
                    'group flex items-center justify-between rounded-lg px-3 py-2 hover:bg-background',
                    selectedChatId === chat._id && 'bg-background'
                  )}
                >
                  <button
                    onClick={() => setSelectedChatId(chat._id)}
                    className="flex-1 text-left"
                  >
                    <div className="font-medium text-sm">{chat.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {chat.messageCount || 0} messages
                    </div>
                  </button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={() => handleDeleteChat(chat._id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}

              {(!chats || chats.length === 0) && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No chats yet. Create one to get started!
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Main chat area */}
      <div className="flex-1">
        <AIChatInterface
          chatId={selectedChatId || undefined}
          onNewChat={handleCreateChat}
          onSettingsClick={handleSettingsClick}
        />
      </div>
    </div>
  );
}