'use client';

import {
  Clock,
  Edit3,
  MessageSquare,
  MoreVertical,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import type { ChatItemProps } from '@/lib/types/components';
import { cn } from '@/lib/utils';

/**
 * ChatItem component - Individual chat item in the chat list
 * Displays chat title, last message time, and provides actions
 */
export function ChatItem({
  chat,
  isSelected = false,
  onClick,
  onDelete,
  onRename,
  className,
  children,
}: ChatItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(chat.title);
  const [_showDeleteConfirm, _setShowDeleteConfirm] = useState(false);

  const handleRename = () => {
    if (editTitle.trim() && editTitle !== chat.title) {
      onRename?.(editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setEditTitle(chat.title);
      setIsEditing(false);
    }
  };

  const formatLastMessageTime = (timestamp?: number) => {
    if (!timestamp) {
      return null;
    }

    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours =
      Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'now';
    }
    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    }
    if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getModelDisplayName = (model: string) => {
    // Extract display name from model identifier
    if (model.includes('gpt-4')) {
      return 'GPT-4';
    }
    if (model.includes('gpt-3.5')) {
      return 'GPT-3.5';
    }
    if (model.includes('claude')) {
      return 'Claude';
    }
    if (model.includes('deepseek')) {
      return 'DeepSeek';
    }
    return model.split('-')[0]?.toUpperCase() ?? 'AI';
  };

  const lastMessageTime = formatLastMessageTime(
    chat.lastMessageAt ?? chat.updatedAt
  );

  return (
    <div
      className={cn(
        'group relative flex cursor-pointer items-center space-x-3 rounded-lg p-3 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800',
        isSelected &&
          'border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20',
        className
      )}
      onClick={isEditing ? undefined : onClick}
    >
      {/* Chat Icon */}
      <div className="flex-shrink-0">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg',
            isSelected
              ? 'bg-blue-100 dark:bg-blue-800'
              : 'bg-gray-200 dark:bg-gray-700'
          )}
        >
          <MessageSquare
            className={cn(
              'h-5 w-5',
              isSelected
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400'
            )}
          />
        </div>
      </div>

      {/* Chat Content */}
      <div className="min-w-0 flex-1">
        {isEditing ? (
          <Input
            autoFocus
            className="h-6 font-medium text-sm"
            onBlur={handleRename}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            value={editTitle}
          />
        ) : (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h4
                className={cn(
                  'truncate font-medium text-sm',
                  isSelected
                    ? 'text-blue-900 dark:text-blue-100'
                    : 'text-gray-900 dark:text-gray-100'
                )}
              >
                {chat.title}
              </h4>
              {lastMessageTime && (
                <span className="flex items-center space-x-1 text-gray-500 text-xs dark:text-gray-400">
                  <Clock className="h-3 w-3" />
                  <span>{lastMessageTime}</span>
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Badge
                className="bg-gray-100 text-gray-700 text-xs dark:bg-gray-800 dark:text-gray-300"
                size="sm"
                variant="default"
              >
                {getModelDisplayName(chat.model)}
              </Badge>

              {chat.messageCount > 0 && (
                <span className="text-gray-500 text-xs dark:text-gray-400">
                  {chat.messageCount} message
                  {chat.messageCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions Menu */}
      {!isEditing && (
        <div className="opacity-0 transition-opacity group-hover:opacity-100">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-8 w-8" size="icon" variant="ghost">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
              >
                <Edit3 className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.();
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {children}
    </div>
  );
}

export default ChatItem;
