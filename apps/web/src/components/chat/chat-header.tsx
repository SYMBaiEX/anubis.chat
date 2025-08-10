'use client';

import {
  Bot,
  Brain,
  Check,
  Edit3,
  Info,
  MoreVertical,
  RefreshCw,
  Settings,
  Trash2,
  X,
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
import type { ChatHeaderProps } from '@/lib/types/components';
import { cn } from '@/lib/utils';

/**
 * ChatHeader component - Header for individual chats
 * Displays chat info and provides chat management actions
 */
export function ChatHeader({
  chat,
  onRename,
  onClearHistory,
  onDelete,
  onSettingsClick,
  onModelSelectorClick,
  onAgentSelectorClick,
  className,
  children,
}: ChatHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState(chat.title);

  const handleSaveTitle = () => {
    if (editingTitle.trim() && editingTitle !== chat.title) {
      onRename?.(editingTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditingTitle(chat.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  const getModelDisplayName = (model: string) => {
    if (model.includes('gpt-4')) return 'GPT-4';
    if (model.includes('gpt-3.5')) return 'GPT-3.5';
    if (model.includes('claude')) return 'Claude';
    if (model.includes('deepseek')) return 'DeepSeek';
    if (model.includes('llama')) return 'Llama';
    return model.split('-')[0]?.toUpperCase() ?? 'AI';
  };

  const getModelColor = (model: string) => {
    if (model.includes('gpt-4'))
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (model.includes('gpt-3.5'))
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (model.includes('claude'))
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    if (model.includes('deepseek'))
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  const formatLastActive = (timestamp?: number) => {
    if (!timestamp) return null;

    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return 'Active now';
    if (diffInMinutes < 60) return `Active ${diffInMinutes}m ago`;
    if (diffInMinutes < 1440)
      return `Active ${Math.floor(diffInMinutes / 60)}h ago`;
    return `Active ${date.toLocaleDateString()}`;
  };

  return (
    <div className={cn('flex items-center space-x-3', className)}>
      {/* Chat Icon */}
      <div className="flex-shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      </div>

      {/* Chat Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <div className="flex flex-1 items-center space-x-1">
              <Input
                autoFocus
                className="h-6 flex-1 text-sm"
                onBlur={handleSaveTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Chat title"
                value={editingTitle}
              />
              <Button
                className="h-6 w-6 p-0"
                onClick={handleSaveTitle}
                size="sm"
                variant="ghost"
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                className="h-6 w-6 p-0"
                onClick={handleCancelEdit}
                size="sm"
                variant="ghost"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="group flex flex-1 items-center space-x-2">
              <h3
                className="cursor-pointer truncate font-medium text-sm transition-colors hover:text-primary"
                onClick={() => setIsEditing(true)}
                title="Click to rename chat"
              >
                {chat.title}
              </h3>
              <Button
                className="h-4 w-4 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => setIsEditing(true)}
                size="sm"
                variant="ghost"
              >
                <Edit3 className="h-3 w-3" />
              </Button>
            </div>
          )}

          {!isEditing && (
            <Badge
              className={cn('text-xs', getModelColor(chat.model))}
              variant="secondary"
            >
              {getModelDisplayName(chat.model)}
            </Badge>
          )}
        </div>

        {/* Chat Status */}
        <div className="flex items-center space-x-2 text-muted-foreground text-xs">
          {formatLastActive(chat.lastMessageAt ?? chat.updatedAt) && (
            <span>
              {formatLastActive(chat.lastMessageAt ?? chat.updatedAt)}
            </span>
          )}

          {chat.systemPrompt && (
            <>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Info className="h-3 w-3" />
                <span>Custom prompt</span>
              </span>
            </>
          )}

          {chat.temperature && chat.temperature !== 0.7 && (
            <>
              <span>•</span>
              <span>Temp: {chat.temperature}</span>
            </>
          )}
        </div>
      </div>

      {/* Actions Menu */}
      <div className="flex-shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Chat options</span>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">
            {/* Mobile-only options */}
            <div className="sm:hidden">
              {onModelSelectorClick && (
                <DropdownMenuItem onClick={onModelSelectorClick}>
                  <Brain className="mr-2 h-4 w-4" />
                  Select Model
                </DropdownMenuItem>
              )}

              {onAgentSelectorClick && (
                <DropdownMenuItem onClick={onAgentSelectorClick}>
                  <Bot className="mr-2 h-4 w-4" />
                  Select Agent
                </DropdownMenuItem>
              )}

              {onSettingsClick && (
                <DropdownMenuItem onClick={onSettingsClick}>
                  <Settings className="mr-2 h-4 w-4" />
                  Chat Settings
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />
            </div>

            {/* Always visible options */}
            <DropdownMenuItem onClick={() => setIsEditing(true)}>
              <Edit3 className="mr-2 h-4 w-4" />
              Rename Chat
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onClearHistory}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Clear History
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
              onClick={onDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {children}
    </div>
  );
}

export default ChatHeader;
