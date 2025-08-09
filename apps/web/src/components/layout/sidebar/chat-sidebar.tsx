'use client';

import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { Bot, Plus, Trash2, MessageSquare, Sparkles, Clock } from 'lucide-react';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { LoadingStates } from '@/components/data/loading-states';
import { cn } from '@/lib/utils';

interface ChatSidebarProps {
  selectedChatId?: string;
  onChatSelect?: (chatId: string) => void;
}

export function ChatSidebar({ selectedChatId, onChatSelect }: ChatSidebarProps) {
  const { user, isAuthenticated } = useAuthContext();
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get chat ID from URL if not provided as prop
  const activeChatId = selectedChatId || searchParams.get('chatId') || undefined;

  const chats = useQuery(
    api.chats.getByOwner,
    isAuthenticated && user?.walletAddress ? { ownerId: user.walletAddress } : 'skip'
  );

  const createChat = useMutation(api.chats.create);
  const deleteChat = useMutation(api.chats.remove);

  const handleCreateChat = async () => {
    if (!user?.walletAddress) return;
    setIsCreatingChat(true);
    try {
      const newChat = await createChat({
        title: `New Chat ${new Date().toLocaleTimeString()}`,
        ownerId: user.walletAddress,
        model: 'gpt-4o',
      });
      if (newChat && newChat._id) {
        // Navigate to the chat page with the new chat ID
        router.push(`/chat?chatId=${newChat._id}`);
        if (onChatSelect) onChatSelect(newChat._id);
      }
    } finally {
      setIsCreatingChat(false);
    }
  };
  
  const handleChatSelect = (chatId: string) => {
    // Navigate to the chat page with the selected chat ID
    router.push(`/chat?chatId=${chatId}`);
    if (onChatSelect) onChatSelect(chatId);
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.walletAddress) return;
    await deleteChat({ id: chatId as Id<'chats'>, ownerId: user.walletAddress });
  };

  const formatChatDate = (date: number) => {
    const chatDate = new Date(date);
    const now = new Date();
    const days = Math.floor((now.getTime() - chatDate.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return chatDate.toLocaleDateString();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bot className="h-4 w-4 text-primary" />
            <Sparkles className="absolute -right-1 -top-1 h-2.5 w-2.5 text-accent" />
          </div>
          <h2 className="text-sm font-semibold">Chat History</h2>
        </div>
        <Button size="sm" onClick={handleCreateChat} disabled={isCreatingChat} className="h-7 px-2">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {chats === undefined ? (
          <div className="p-2">
            <LoadingStates variant="skeleton" />
          </div>
        ) : chats.length === 0 ? (
          <div className="rounded-md border border-border/50 p-4 text-center text-xs text-muted-foreground">
            No conversations yet
          </div>
        ) : (
          <div className="space-y-2">
            {chats.map((chat) => (
              <div
                key={chat._id}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 transition-colors',
                  activeChatId === chat._id
                    ? 'bg-white/10'
                    : 'hover:bg-white/5'
                )}
                onClick={() => handleChatSelect(chat._id)}
              >
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{chat.title}</p>
                  <p className="text-muted-foreground text-[10px]">{formatChatDate(chat._creationTime)}</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={(e) => handleDeleteChat(chat._id, e)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}