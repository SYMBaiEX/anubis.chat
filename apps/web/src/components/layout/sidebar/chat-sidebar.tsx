'use client';

import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { Bot, MessageSquare, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { LoadingStates } from '@/components/data/loading-states';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { DEFAULT_MODEL } from '@/lib/constants/ai-models';
import { cn } from '@/lib/utils';

interface ChatSidebarProps {
  selectedChatId?: string;
  onChatSelect?: (chatId: string) => void;
}

export function ChatSidebar({
  selectedChatId,
  onChatSelect,
}: ChatSidebarProps) {
  const { user, isAuthenticated } = useAuthContext();
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get chat ID from URL if not provided as prop
  const activeChatId =
    selectedChatId || searchParams.get('chatId') || undefined;

  // Use the new authenticated chat query that uses user ID instead of wallet address
  const chats = useQuery(
    api.chatsAuth.getMyChats,
    isAuthenticated ? {} : 'skip'
  );

  const createChat = useMutation(api.chatsAuth.createMyChat);
  const deleteChat = useMutation(api.chatsAuth.deleteMyChat);

  const handleCreateChat = async () => {
    if (!isAuthenticated) {
      return;
    }
    setIsCreatingChat(true);
    try {
      const newChat = await createChat({
        title: `New Chat ${new Date().toLocaleTimeString()}`,
        model: DEFAULT_MODEL.id,
      });
      if (newChat?._id) {
        // Navigate to the chat page with the new chat ID
        router.push(`/chat?chatId=${newChat._id}`);
        if (onChatSelect) {
          onChatSelect(newChat._id);
        }
      }
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleChatSelect = (chatId: string) => {
    // Navigate to the chat page with the selected chat ID
    router.push(`/chat?chatId=${chatId}`);
    if (onChatSelect) {
      onChatSelect(chatId);
    }
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      return;
    }
    await deleteChat({
      id: chatId as Id<'chats'>,
    });
  };

  const formatChatDate = (date: number) => {
    const chatDate = new Date(date);
    const now = new Date();
    const days = Math.floor(
      (now.getTime() - chatDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days === 0) {
      return 'Today';
    }
    if (days === 1) {
      return 'Yesterday';
    }
    if (days < 7) {
      return `${days} days ago`;
    }
    return chatDate.toLocaleDateString();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-border border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bot className="h-4 w-4 text-primary" />
            <Sparkles className="-right-1 -top-1 absolute h-2.5 w-2.5 text-accent" />
          </div>
          <h2 className="font-semibold text-sm">Chat History</h2>
        </div>
        <Button
          className="h-7 px-2"
          disabled={isCreatingChat}
          onClick={handleCreateChat}
          size="sm"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-hidden p-2">
        {chats === undefined ? (
          <div className="p-2">
            <LoadingStates variant="skeleton" />
          </div>
        ) : chats.length === 0 ? (
          <div className="rounded-md border border-border/50 p-4 text-center text-muted-foreground text-xs">
            No conversations yet
          </div>
        ) : (
          <div className="relative flex h-full flex-col">
            {/* Fade overlay at bottom when scrollable */}
            {chats.length > 3 && (
              <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-8 bg-gradient-to-t from-background to-transparent" />
            )}
            {/* Chat list container with fixed height for 3 items */}
            <div
              className={cn(
                'relative space-y-2 overflow-y-auto',
                // Calculate max height based on approximately 3 chat items
                // Each item is roughly 60px (py-2 + content + gap)
                'max-h-[180px]', // 3 items * ~60px with spacing
                // Custom scrollbar will be styled by global CSS
                // Add padding-right to account for scrollbar when present
                chats.length > 3 && 'pr-2'
              )}
              style={{
                // Ensure smooth scrolling
                scrollBehavior: 'smooth',
                // Hide scrollbar in Firefox
                scrollbarWidth: 'thin',
              }}
            >
              {chats.map((chat) => (
                <div
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 transition-colors',
                    activeChatId === chat._id
                      ? 'bg-white/10'
                      : 'hover:bg-white/5'
                  )}
                  key={chat._id}
                  onClick={() => handleChatSelect(chat._id)}
                >
                  <MessageSquare className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{chat.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatChatDate(chat._creationTime)}
                    </p>
                  </div>
                  <Button
                    className="h-6 w-6 flex-shrink-0"
                    onClick={(e) => handleDeleteChat(chat._id, e)}
                    size="icon"
                    variant="ghost"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            {/* Show count indicator if more than 3 chats */}
            {chats.length > 3 && (
              <div className="mt-auto border-border/50 border-t pt-2">
                <p className="text-center text-[10px] text-muted-foreground">
                  Scroll to see all {chats.length} chats
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
