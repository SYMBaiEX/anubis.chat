'use client';

import { Loader2, Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chats?: Array<{
    _id: string;
    title?: string;
    lastMessageAt?: number;
    createdAt?: number;
    _creationTime?: number;
  }>;
  onSelectChat: (chatId: string) => void;
  currentChatId?: string;
  isLoading?: boolean;
}

// Helper function to format relative time
function getRelativeTime(diffInHours: number): string {
  if (diffInHours < 0.017) {
    return 'Just now';
  }
  if (diffInHours < 1) {
    const minutes = Math.floor(diffInHours * 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
  if (diffInHours < 24) {
    const hours = Math.floor(diffInHours);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  if (diffInHours < 168) {
    const days = Math.floor(diffInHours / 24);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
  if (diffInHours < 720) {
    const weeks = Math.floor(diffInHours / 168);
    return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
  }
  return '';
}

// Simplified date formatter
function formatDate(timestamp?: number): string {
  if (!timestamp) {
    return 'No messages yet';
  }

  const date = new Date(timestamp);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);

  const relativeTime = getRelativeTime(diffInHours);
  if (relativeTime) {
    return relativeTime;
  }

  // For dates older than 30 days
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function SearchDialog({
  isOpen,
  onClose,
  chats = [],
  onSelectChat,
  currentChatId,
  isLoading = false,
}: SearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const selectedButtonRef = useRef<HTMLButtonElement>(null);

  // Filter chats based on search query
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) {
      return chats;
    }

    const query = searchQuery.toLowerCase();
    return chats.filter((chat) => {
      const title = (chat.title || 'Untitled').toLowerCase();
      return title.includes(query);
    });
  }, [chats, searchQuery]);

  // Reset selected index when search query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, []);

  // Reset search when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedButtonRef.current && scrollAreaRef.current) {
      const button = selectedButtonRef.current;
      const container = scrollAreaRef.current;
      const buttonRect = button.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      if (buttonRect.bottom > containerRect.bottom) {
        button.scrollIntoView({ block: 'end', behavior: 'smooth' });
      } else if (buttonRect.top < containerRect.top) {
        button.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }
    }
  }, []);

  const handleSelectChat = useCallback(
    (chatId: string) => {
      onSelectChat(chatId);
      onClose();
    },
    [onSelectChat, onClose]
  );

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredChats.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredChats.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredChats[selectedIndex]) {
            handleSelectChat(filteredChats[selectedIndex]._id);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredChats, selectedIndex, onClose, handleSelectChat]);

  // Render content based on state
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="mb-3 h-8 w-8 animate-spin" />
          <p className="text-sm">Loading conversations...</p>
        </div>
      );
    }

    if (filteredChats.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-3 rounded-full bg-muted p-3">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-muted-foreground text-sm">
            {searchQuery
              ? 'No scrolls found matching your search'
              : 'No sacred scrolls available'}
          </p>
          {searchQuery && (
            <p className="mt-1 text-muted-foreground text-xs">
              Try adjusting your search terms
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-1 p-2">
        {filteredChats.map((chat, index) => {
          const isSelected = selectedIndex === index;
          const isCurrent = currentChatId === chat._id;

          return (
            <button
              className={cn(
                'w-full rounded-lg px-4 py-3 text-left transition-all duration-150',
                'hover:bg-accent hover:shadow-sm',
                'focus:outline-none focus:ring-2 focus:ring-primary/20',
                'group relative',
                isSelected && 'bg-accent shadow-sm ring-2 ring-primary/20',
                isCurrent && 'font-medium'
              )}
              key={chat._id}
              onClick={() => handleSelectChat(chat._id)}
              onMouseEnter={() => setSelectedIndex(index)}
              ref={isSelected ? selectedButtonRef : null}
              type="button"
            >
              {isCurrent && (
                <div className="-translate-y-1/2 absolute top-1/2 left-0 h-8 w-1 rounded-r-full bg-primary" />
              )}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'truncate text-sm',
                      isCurrent ? 'font-semibold' : 'font-medium'
                    )}
                  >
                    {chat.title || 'Untitled Papyrus'}
                  </p>
                  <p className="mt-0.5 text-muted-foreground text-xs">
                    {formatDate(chat.lastMessageAt || chat._creationTime)}
                  </p>
                </div>
                {isCurrent && (
                  <span className="rounded-md bg-primary/10 px-2 py-1 font-medium text-primary text-xs">
                    Current
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog onOpenChange={onClose} open={isOpen}>
      <DialogContent className="max-w-2xl overflow-hidden p-0">
        <DialogHeader className="border-b bg-background/95 px-6 pt-6 pb-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <DialogTitle className="font-semibold text-lg">
            Search Sacred Scrolls
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Search through your chat conversations
          </DialogDescription>
        </DialogHeader>

        <div className="border-b bg-muted/30 px-6 py-4">
          <div className="relative">
            <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              className="h-10 bg-background pr-10 pl-10"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type to search..."
              value={searchQuery}
            />
            {searchQuery && (
              <Button
                className="-translate-y-1/2 absolute top-1/2 right-1 h-8 w-8"
                onClick={() => setSearchQuery('')}
                size="icon"
                variant="ghost"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[400px] px-2" ref={scrollAreaRef}>
          {renderContent()}
        </ScrollArea>

        <div className="border-t bg-muted/30 px-6 py-3">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs">
              {filteredChats.length}{' '}
              {filteredChats.length === 1 ? 'scroll' : 'scrolls'} found
            </p>
            <div className="flex items-center gap-4 text-muted-foreground text-xs">
              <div className="flex items-center gap-1.5">
                <kbd className="rounded border bg-background px-1.5 py-0.5 font-semibold text-xs">
                  ↑↓
                </kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="rounded border bg-background px-1.5 py-0.5 font-semibold text-xs">
                  ↵
                </kbd>
                <span>Select</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="rounded border bg-background px-1.5 py-0.5 font-semibold text-xs">
                  Esc
                </kbd>
                <span>Close</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
