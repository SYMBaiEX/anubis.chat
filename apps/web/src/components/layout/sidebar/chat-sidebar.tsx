'use client';

import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { Bot, Plus, Trash2, MessageSquare, Sparkles, Clock } from 'lucide-react';
import { useState } from 'react';
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

  // Convex queries and mutations
  const chats = useQuery(
    api.chats.getByOwner,
    isAuthenticated && user?.walletAddress
      ? { ownerId: user.walletAddress }
      : 'skip'
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
      if (newChat && newChat._id && onChatSelect) {
        onChatSelect(newChat._id);
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.walletAddress) return;

    try {
      await deleteChat({
        id: chatId as Id<'chats'>,
        ownerId: user.walletAddress,
      });
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  const formatChatDate = (date: number) => {
    const chatDate = new Date(date);
    const now = new Date();
    const diff = now.getTime() - chatDate.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return chatDate.toLocaleDateString();
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Aurora Background Effect */}
      <div className="aurora aurora-purple absolute inset-0 opacity-30" aria-hidden="true" />
      
      {/* Glass Container */}
      <div className="relative z-10 flex h-full flex-col bg-black/40 backdrop-blur-xl">
        {/* Header with Gradient */}
        <div className="relative border-b border-white/10 bg-gradient-to-r from-isis-primary/10 via-isis-accent/10 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Bot className="h-5 w-5 text-isis-primary" />
                <Sparkles className="absolute -right-1 -top-1 h-3 w-3 text-isis-accent animate-pulse" />
              </div>
              <h2 className="bg-gradient-to-r from-isis-primary to-isis-accent bg-clip-text font-semibold text-transparent">
                Chat History
              </h2>
            </div>
            <Button
              size="sm"
              onClick={handleCreateChat}
              disabled={isCreatingChat}
              className={cn(
                "button-press h-8 bg-gradient-to-r from-isis-primary to-isis-accent text-white",
                "hover:shadow-glow-primary transition-all duration-300",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isCreatingChat ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Chat List with Glass Effect */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {chats === undefined ? (
            <div className="p-4">
              <LoadingStates variant="skeleton" />
            </div>
          ) : chats.length === 0 ? (
            <div className="glass-effect rounded-xl p-6 text-center">
              <div className="relative mx-auto mb-4 h-16 w-16">
                <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-isis-primary to-isis-accent opacity-20" />
                <MessageSquare className="relative h-16 w-16 text-isis-primary/60" />
              </div>
              <p className="mb-1 font-medium text-white/90">No conversations yet</p>
              <p className="mb-4 text-sm text-white/60">Start your first AI chat</p>
              <Button
                size="sm"
                onClick={handleCreateChat}
                disabled={isCreatingChat}
                className={cn(
                  "button-press bg-gradient-to-r from-isis-primary to-isis-accent text-white",
                  "hover:shadow-glow-primary transition-all duration-300"
                )}
              >
                <Sparkles className="mr-2 h-3 w-3" />
                New Chat
              </Button>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {chats.map((chat) => (
                <div
                  key={chat._id}
                  className={cn(
                    'group relative overflow-hidden rounded-xl transition-all duration-300 cursor-pointer',
                    selectedChatId === chat._id
                      ? 'glass-effect-active shadow-glow-primary'
                      : 'glass-effect hover:glass-effect-hover'
                  )}
                  onClick={() => onChatSelect?.(chat._id)}
                >
                  {/* Active Indicator */}
                  {selectedChatId === chat._id && (
                    <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-isis-primary to-isis-accent" />
                  )}
                  
                  <div className="flex items-center px-3 py-3">
                    <div className={cn(
                      "mr-3 rounded-lg p-1.5 transition-colors",
                      selectedChatId === chat._id
                        ? "bg-gradient-to-br from-isis-primary/20 to-isis-accent/20"
                        : "bg-white/5 group-hover:bg-white/10"
                    )}>
                      <MessageSquare className={cn(
                        "h-4 w-4",
                        selectedChatId === chat._id
                          ? "text-isis-primary"
                          : "text-white/60 group-hover:text-white/80"
                      )} />
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <p className={cn(
                        "truncate font-medium transition-colors",
                        selectedChatId === chat._id
                          ? "text-white"
                          : "text-white/80 group-hover:text-white"
                      )}>
                        {chat.title}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3 text-white/40" />
                        <p className="text-xs text-white/40">
                          {formatChatDate(chat._creationTime)}
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      size="icon"
                      variant="ghost"
                      className={cn(
                        "h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity",
                        "hover:bg-red-500/20 hover:text-red-400"
                      )}
                      onClick={(e) => handleDeleteChat(chat._id, e)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  
                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute inset-0 bg-gradient-to-r from-isis-primary/5 to-isis-accent/5" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Gradient Fade */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
    </div>
  );
}