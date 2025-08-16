'use client';

import { api } from '@convex/_generated/api';
import type { Doc, Id } from '@convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bot,
  Clock,
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { LoadingStates } from '@/components/data/loading-states';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { DEFAULT_MODEL } from '@/lib/constants/ai-models';
import { cn } from '@/lib/utils';
import {
  chatItemVariants,
  chatListContainer,
  deleteButtonVariants,
  fadeInUp,
} from '@/lib/animations/variants';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [_isSearching, setIsSearching] = useState(false);
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

  // Filter chats based on search query
  const filteredChats = useMemo(() => {
    if (!(chats && searchQuery)) {
      return chats;
    }
    return chats.filter((chat: Doc<'chats'>) =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [chats, searchQuery]);

  return (
    <div className="flex h-full flex-col bg-card/50 backdrop-blur-sm touch-manipulation w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-border border-b px-3 py-2">
        <div className="flex items-center gap-2 transition-transform hover:scale-105">
          <div className="relative">
            <Bot className="h-4 w-4 text-primary" />
            <Sparkles className="-right-1 -top-1 absolute h-2.5 w-2.5 animate-pulse text-accent" />
          </div>
          <h2 className="font-semibold text-sm">Chat History</h2>
        </div>
        <Button
          aria-label="Start new chat"
          className="h-6 px-1.5 shadow-sm"
          disabled={isCreatingChat}
          onClick={handleCreateChat}
          size="sm"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Search Bar */}
      <AnimatePresence>
        {chats && chats.length > 3 && (
          <motion.div
            className="border-border/50 border-b p-2"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <div className="relative">
              <Search className="-translate-y-1/2 absolute top-1/2 left-2 h-3.5 w-3.5 text-muted-foreground" />
              <motion.input
                className="w-full rounded-md bg-background/50 px-7 py-1.5 text-xs transition-all placeholder:text-muted-foreground focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary/50 focus:scale-[1.02]"
                onBlur={() => setIsSearching(false)}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearching(true)}
                placeholder="Search chats..."
                value={searchQuery}
                whileFocus={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              />
              <AnimatePresence>
                {searchQuery && (
                  <motion.button
                    className="-translate-y-1/2 absolute top-1/2 right-2 text-muted-foreground transition-colors hover:text-foreground"
                    onClick={() => setSearchQuery('')}
                    variants={deleteButtonVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <X className="h-3 w-3" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat List */}
      <div className="flex-1 overflow-hidden px-2 pb-2">
        {chats === undefined ? (
          <div className="animate-fade-in p-2">
            <LoadingStates variant="skeleton" />
          </div>
        ) : chats.length === 0 ? (
          <div className="animate-fade-in rounded-md border border-border/50 p-4 text-center text-muted-foreground text-xs">
            <MessageSquare className="mx-auto mb-2 h-8 w-8 opacity-50" />
            No conversations yet
          </div>
        ) : (
          <div className="relative flex h-full flex-col">
            {/* Fade overlay at bottom when scrollable */}
            {filteredChats && filteredChats.length > 3 && (
              <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-8 bg-gradient-to-t from-background to-transparent" />
            )}

            {/* Chat list container */}
            <motion.div
              className={cn(
                'relative space-y-1 overflow-y-auto overflow-x-hidden',
                'max-h-[calc(100vh-200px)] w-full'
              )}
              style={{
                scrollBehavior: 'smooth',
                scrollbarWidth: 'thin',
                overflowX: 'hidden',
              }}
              variants={chatListContainer}
              initial="initial"
              animate="animate"
            >
              <AnimatePresence mode="popLayout">
                {filteredChats && filteredChats.length === 0 && searchQuery ? (
                  <motion.div
                    className="py-4 text-center text-muted-foreground text-xs"
                    variants={fadeInUp}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    No chats found
                  </motion.div>
                ) : (
                  filteredChats?.map((chat: Doc<'chats'>) => (
                    <motion.div
                      key={chat._id}
                      className={cn(
                        'group flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-3 sm:py-2',
                        'relative min-h-[44px] sm:min-h-auto w-full', // Larger touch targets on mobile
                        'touch-manipulation select-none overflow-hidden', // Better mobile interaction
                        activeChatId === chat._id
                          ? 'bg-primary/10 shadow-sm ring-1 ring-primary/20'
                          : 'hover:bg-muted/50 active:bg-muted/70'
                      )}
                      onClick={() => handleChatSelect(chat._id)}
                      variants={chatItemVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <MessageSquare
                        className={cn(
                          'h-4 w-4 flex-shrink-0 transition-colors',
                          activeChatId === chat._id
                            ? 'text-primary'
                            : 'text-muted-foreground'
                        )}
                      />
                      <div className="min-w-0 flex-1 pr-8 sm:pr-1">
                        <p
                          className={cn(
                            'truncate text-sm transition-colors leading-tight',
                            activeChatId === chat._id && 'font-medium'
                          )}
                        >
                          {chat.title}
                        </p>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                          <Clock className="h-2.5 w-2.5 flex-shrink-0" />
                          <span className="truncate">{formatChatDate(chat._creationTime)}</span>
                        </div>
                      </div>
                      {/* Mobile-first delete button - always visible on mobile */}
                      <motion.div
                        className={cn(
                          'absolute top-1/2 right-0.5 -translate-y-1/2',
                          'sm:relative sm:top-auto sm:right-auto sm:translate-y-0',
                          'sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity',
                          'opacity-60 sm:opacity-0 flex-shrink-0' // Always visible on mobile with reduced opacity
                        )}
                        variants={deleteButtonVariants}
                        initial="initial"
                        animate="animate"
                        whileHover="hover"
                        whileTap="tap"
                      >
                        <Button
                          className="h-6 w-6 sm:h-5 sm:w-5 flex-shrink-0 bg-destructive/10 hover:bg-destructive/20"
                          onClick={(e) => handleDeleteChat(chat._id, e)}
                          size="icon"
                          variant="ghost"
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-3 sm:w-3 text-destructive" />
                        </Button>
                      </motion.div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </motion.div>

            {/* Chat count indicator */}
            {filteredChats && filteredChats.length > 5 && (
              <div className="mt-2 animate-fade-in border-border/50 border-t pt-2">
                <p className="text-center text-[10px] text-muted-foreground">
                  {searchQuery
                    ? `Showing ${filteredChats.length} of ${chats?.length || 0} chats`
                    : `${filteredChats.length} total chats`}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
