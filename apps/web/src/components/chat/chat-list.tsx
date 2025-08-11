'use client';

import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/data/empty-states';
import { LoadingStates } from '@/components/data/loading-states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ChatListProps } from '@/lib/types/components';
import { cn } from '@/lib/utils';
import { ChatItem } from './chat-item';

/**
 * ChatList component - Sidebar displaying user's chat conversations
 * Includes search, create new chat, and chat management
 */
export function ChatList({
  chats,
  selectedChatId,
  onChatSelect,
  onChatCreate,
  onChatDelete,
  className,
  children,
}: ChatListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Filter chats based on search query
  const filteredChats = chats.filter(
    (chat) =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateChat = async () => {
    setIsLoading(true);
    try {
      await onChatCreate?.();
    } catch (_error: unknown) {
      // Silently ignore; parent handles error reporting
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await onChatDelete?.(chatId);
    } catch (_error: unknown) {
      // Silently ignore; parent handles error reporting
    }
  };

  const _formatLastMessageTime = (timestamp?: number) => {
    if (!timestamp) {
      return '';
    }

    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours =
      Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    }
    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    }
    if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    }
    return date.toLocaleDateString();
  };

  return (
    <div
      className={cn(
        'flex h-full flex-col bg-gray-50 dark:bg-gray-900',
        className
      )}
    >
      {/* Header with New Chat Button */}
      <div className="flex items-center justify-between border-gray-200 border-b p-4 dark:border-gray-800">
        <h2 className="font-semibold text-gray-900 text-lg dark:text-gray-100">
          Chats
        </h2>
        <Button
          className="flex items-center space-x-2"
          disabled={isLoading}
          onClick={handleCreateChat}
          size="sm"
        >
          {isLoading ? (
            <LoadingStates size="sm" variant="spinner" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">New</span>
        </Button>
      </div>

      {/* Search */}
      <div className="border-gray-200 border-b p-4 dark:border-gray-800">
        <div className="relative">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-gray-400" />
          <Input
            className="pl-10"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            value={searchQuery}
          />
        </div>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        {filteredChats.length === 0 ? (
          <div className="p-4">
            {searchQuery ? (
              <EmptyState
                description={`No chats match "${searchQuery}"`}
                icon={<Search className="h-8 w-8 text-gray-400" />}
                title="No chats found"
              />
            ) : (
              <EmptyState
                action={{
                  label: 'New Chat',
                  onClick: handleCreateChat,
                }}
                description="Start a new conversation to see your chats here"
                icon={<Plus className="h-8 w-8 text-gray-400" />}
                title="No chats yet"
              />
            )}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredChats
              .sort(
                (a, b) =>
                  (b.lastMessageAt ?? b.updatedAt) -
                  (a.lastMessageAt ?? a.updatedAt)
              )
              .map((chat) => (
                <ChatItem
                  chat={chat}
                  isSelected={chat._id === selectedChatId}
                  key={chat._id}
                  onClick={() => onChatSelect?.(chat._id)}
                  onDelete={() => handleDeleteChat(chat._id)}
                  onRename={(_newTitle) => {
                    // Rename functionality not implemented yet
                  }}
                />
              ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer with Chat Count */}
      {chats.length > 0 && (
        <div className="border-gray-200 border-t p-4 dark:border-gray-800">
          <p className="text-center text-gray-500 text-xs dark:text-gray-400">
            {chats.length} chat{chats.length !== 1 ? 's' : ''} total
            {searchQuery && <span> • {filteredChats.length} matching</span>}
          </p>
        </div>
      )}

      {children}
    </div>
  );
}

export default ChatList;
