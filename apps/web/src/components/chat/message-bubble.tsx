'use client';

import { formatDistanceToNow } from 'date-fns';
import {
  AlertCircle,
  Bot,
  Check,
  Clock,
  Copy,
  Download,
  Edit,
  FileText,
  FileVideo,
  Image,
  Link as LinkIcon,
  MoreVertical,
  Paperclip,
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
  User,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { MessageProps } from '@/lib/types/components';
import { cn } from '@/lib/utils';
import { type FontSize, getFontSizeClasses } from '@/lib/utils/font-sizes';
import { createModuleLogger } from '@/lib/utils/logger';
import { OptimizedMarkdownRenderer } from './optimized-markdown-renderer';

// Initialize logger
const log = createModuleLogger('message-bubble');

// Helper function to format file sizes
const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`;
};

/**
 * MessageBubble component - Individual message display
 * Handles user and AI messages with actions and metadata
 */
export function MessageBubble({
  message,
  onRegenerate,
  onCopy,
  onEdit,
  showActions = true,
  className,
  children,
  fontSize = 'medium',
}: MessageProps & { fontSize?: FontSize }) {
  const [copied, setCopied] = useState(false);
  const [_isEditing, setIsEditing] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);

  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isAssistant = message.role === 'assistant';

  // Get dynamic font size classes - Applied immediately before render
  const fontSizes = useMemo(() => getFontSizeClasses(fontSize), [fontSize]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
      log.debug('Message copied to clipboard', {
        operation: 'copy_message',
        messageRole: message.role,
      });
    } catch (error) {
      log.error('Failed to copy message to clipboard', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        operation: 'copy_message',
      });
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    // TODO: Implement inline editing
  };

  const getAvatarIcon = () => {
    if (isUser) {
      return <User className="h-4 w-4" />;
    }
    if (isSystem) {
      return <AlertCircle className="h-4 w-4" />;
    }
    return <Bot className="h-4 w-4" />;
  };

  const getAvatarBg = () => {
    if (isUser) {
      return 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400';
    }
    if (isSystem) {
      return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400';
    }
    return 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400';
  };

  const formatTimestamp = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  // Basic feedback handlers (stubbed; hook up to backend/analytics later)
  const handleLike = () => {
    log.info('feedback_like', { role: message.role });
  };
  const handleDislike = () => {
    log.info('feedback_dislike', { role: message.role });
  };
  const handleShare = () => {
    try {
      void navigator.share?.({
        title: 'Anubis Chat Snippet',
        text: message.content.slice(0, 300),
      });
    } catch (_e) {
      // no-op if not supported
    }
  };

  // Don't show system messages in chat bubbles
  if (isSystem) {
    return (
      <div className={cn('flex justify-center py-2', className)}>
        <Badge className="bg-muted text-muted-foreground" variant="secondary">
          <AlertCircle className="mr-1 h-3 w-3" />
          {message.content}
        </Badge>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group flex gap-3 py-4',
        isUser ? 'flex-row-reverse' : 'flex-row',
        className
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <Avatar className="h-8 w-8">
          <AvatarFallback className={cn('text-xs', getAvatarBg())}>
            {getAvatarIcon()}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Message Content */}
      <div
        className={cn(
          'flex flex-col space-y-2',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        {/* Message Header */}
        <div
          className={cn(
            'flex items-center gap-1 text-muted-foreground sm:gap-2',
            fontSizes.messageHeader,
            isUser ? 'flex-row-reverse' : 'flex-row'
          )}
        >
          <span className="font-medium">
            {isUser ? 'You' : message.metadata?.model || 'Assistant'}
          </span>
          <span>{formatTimestamp(message.createdAt)}</span>

          {message.metadata?.usage?.totalTokens !== undefined && (
            <>
              <span>•</span>
              <span>{message.metadata.usage.totalTokens} tokens</span>
            </>
          )}

          {message.metadata?.tools && message.metadata.tools.length > 0 && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {message.metadata.tools.reduce(
                  (sum, t) => sum + (t.result?.executionTime || 0),
                  0
                )}
                ms
              </span>
            </>
          )}
        </div>

        {/* Message Bubble */}
        <div className="relative w-full max-w-full sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl">
          <div
            className={cn(
              'rounded-2xl px-4 py-3 shadow-sm',
              isUser ? 'bg-primary text-primary-foreground' : 'border bg-muted'
            )}
          >
            {/* Attachments Display */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {message.attachments.map((attachment, index) => {
                  const isImage = attachment.type === 'image';
                  const isVideo = attachment.type === 'video';
                  const isPdf = attachment.mimeType === 'application/pdf';

                  return (
                    <div
                      className="group relative overflow-hidden rounded-lg border bg-background/50"
                      key={`${attachment.fileId}-${index}`}
                    >
                      {isImage && attachment.url ? (
                        <a
                          className="block"
                          href={attachment.url}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          <img
                            alt="Attachment"
                            className="h-32 w-auto max-w-xs object-cover transition-transform hover:scale-105"
                            src={attachment.url}
                          />
                        </a>
                      ) : (
                        <div className="flex h-20 w-48 items-center gap-3 px-3">
                          {/* File icon */}
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                            {isImage ? (
                              <Image className="h-5 w-5 text-muted-foreground" />
                            ) : isVideo ? (
                              <FileVideo className="h-5 w-5 text-muted-foreground" />
                            ) : isPdf ? (
                              <FileText className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <Paperclip className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>

                          {/* File info */}
                          <div className="flex-1 overflow-hidden">
                            <p className="truncate font-medium text-sm">
                              {attachment.fileId.split('/').pop() || 'File'}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {formatFileSize(attachment.size)}
                            </p>
                          </div>

                          {/* Download button */}
                          {attachment.url && (
                            <a
                              className="rounded p-1.5 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                              download
                              href={attachment.url}
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Message Content */}
            <div
              className={cn(
                'prose prose-xs dark:prose-invert max-w-none',
                fontSizes.messageContent
              )}
            >
              {isUser ? (
                <p
                  className={cn(
                    'whitespace-pre-wrap',
                    fontSizes.messageContent
                  )}
                >
                  {message.content}
                </p>
              ) : (
                <OptimizedMarkdownRenderer content={message.content} isStreaming={false} />
              )}
            </div>

            {/* Reasoning toggle and content */}
            {isAssistant && message.metadata?.reasoning && (
              <div className="mt-2">
                <Button
                  aria-controls={`reasoning-${message._id}`}
                  aria-expanded={showReasoning}
                  onClick={() => setShowReasoning((v) => !v)}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  {showReasoning ? 'Hide thinking' : 'Show thinking'}
                </Button>
                {showReasoning && (
                  <div
                    className="mt-2 rounded-md border bg-background p-3 text-muted-foreground text-xs"
                    id={`reasoning-${message._id}`}
                  >
                    <div className="mb-1 font-medium">Reasoning</div>
                    <pre className="whitespace-pre-wrap">
                      {message.metadata.reasoning}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Sources (inline, accessible) */}
            {message.metadata?.citations &&
              message.metadata.citations.length > 0 && (
                <div className="mt-3 border-t pt-2">
                  <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
                    <span className="font-medium">Sources:</span>
                    {message.metadata.citations.map(
                      (citation: string, index: number) => (
                        <a
                          className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground"
                          href={citation}
                          key={citation}
                          rel="noopener"
                          target="_blank"
                          title={`Open source ${index + 1}`}
                        >
                          <LinkIcon className="h-3 w-3" />
                          <span>[{index + 1}]</span>
                        </a>
                      )
                    )}
                  </div>
                </div>
              )}
          </div>

          {/* Message Actions - Below the bubble */}
          {showActions && (
            <div
              className={cn(
                'mt-2 opacity-0 transition-opacity group-hover:opacity-100',
                isUser ? 'flex justify-end' : 'flex justify-start'
              )}
            >
              <div className="flex items-center gap-1 rounded-lg bg-background/80 backdrop-blur border p-1">
                <Button onClick={handleCopy} size="sm" variant="ghost">
                  {copied ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>

                {isAssistant && onRegenerate && (
                  <Button onClick={onRegenerate} size="sm" variant="ghost">
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                )}

                {/* Feedback and share */}
                {isAssistant && (
                  <>
                    <Button
                      aria-label="Like response"
                      onClick={handleLike}
                      size="sm"
                      title="Like response"
                      variant="ghost"
                    >
                      <ThumbsUp className="h-3 w-3" />
                    </Button>
                    <Button
                      aria-label="Dislike response"
                      onClick={handleDislike}
                      size="sm"
                      title="Dislike response"
                      variant="ghost"
                    >
                      <ThumbsDown className="h-3 w-3" />
                    </Button>
                  </>
                )}
                <Button
                  aria-label="Share snippet"
                  onClick={handleShare}
                  size="sm"
                  title="Share snippet"
                  variant="ghost"
                >
                  <LinkIcon className="h-3 w-3" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={handleCopy}>
                      <Copy className="mr-2 h-3 w-3" />
                      Copy
                    </DropdownMenuItem>

                    {isUser && (
                      <DropdownMenuItem onClick={handleEdit}>
                        <Edit className="mr-2 h-3 w-3" />
                        Edit
                      </DropdownMenuItem>
                    )}

                    {isAssistant && onRegenerate && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onRegenerate}>
                          <RotateCcw className="mr-2 h-3 w-3" />
                          Regenerate
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </div>

        {/* Message Status */}
        {message.metadata?.finishReason &&
          message.metadata.finishReason !== 'stop' && (
            <div className="text-muted-foreground text-xs">
              <AlertCircle className="mr-1 inline h-3 w-3" />
              Response stopped: {message.metadata.finishReason}
            </div>
          )}
      </div>

      {children}
    </div>
  );
}

export default MessageBubble;
