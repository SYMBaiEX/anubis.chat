'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle,
  Copy,
  Download,
  Edit3,
  Flag,
  MessageSquare,
  MoreVertical,
  RotateCw,
  Share2,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface MessageActionsProps {
  messageId: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
  onRegenerate?: (messageId: string) => void;
  onCopy?: (content: string) => void;
  onShare?: (messageId: string) => void;
  onFlag?: (messageId: string) => void;
  className?: string;
  variant?: 'inline' | 'dropdown' | 'floating';
}

export function MessageActions({
  messageId,
  content,
  role,
  onEdit,
  onDelete,
  onRegenerate,
  onCopy,
  onShare,
  onFlag,
  className,
  variant = 'inline',
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('Copied to clipboard');
      if (onCopy) onCopy(content);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleLike = (isLike: boolean) => {
    setLiked(liked === isLike ? null : isLike);
    toast.success(
      isLike ? 'Feedback recorded: Liked' : 'Feedback recorded: Disliked'
    );
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `message-${messageId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Message downloaded');
  };

  if (variant === 'dropdown') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className={cn('h-8 w-8', className)}
            size="icon"
            variant="ghost"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleCopy}>
            {copied ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </>
            )}
          </DropdownMenuItem>

          {role === 'user' && onEdit && (
            <DropdownMenuItem onClick={() => onEdit(messageId, content)}>
              <Edit3 className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
          )}

          {role === 'assistant' && onRegenerate && (
            <DropdownMenuItem onClick={() => onRegenerate(messageId)}>
              <RotateCw className="mr-2 h-4 w-4" />
              Regenerate
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </DropdownMenuItem>

          {onShare && (
            <DropdownMenuItem onClick={() => onShare(messageId)}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {onFlag && (
            <DropdownMenuItem
              className="text-amber-600"
              onClick={() => onFlag(messageId)}
            >
              <Flag className="mr-2 h-4 w-4" />
              Report
            </DropdownMenuItem>
          )}

          {onDelete && (
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(messageId)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === 'floating') {
    return (
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          '-top-2 absolute right-2 flex items-center gap-1 rounded-lg border bg-background/95 p-1 shadow-lg backdrop-blur',
          className
        )}
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="h-7 w-7"
                onClick={handleCopy}
                size="icon"
                variant="ghost"
              >
                {copied ? (
                  <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy</TooltipContent>
          </Tooltip>

          {role === 'assistant' && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="h-7 w-7"
                    onClick={() => handleLike(true)}
                    size="icon"
                    variant="ghost"
                  >
                    <ThumbsUp
                      className={cn(
                        'h-3.5 w-3.5',
                        liked === true && 'fill-green-500 text-green-500'
                      )}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Good response</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="h-7 w-7"
                    onClick={() => handleLike(false)}
                    size="icon"
                    variant="ghost"
                  >
                    <ThumbsDown
                      className={cn(
                        'h-3.5 w-3.5',
                        liked === false && 'fill-red-500 text-red-500'
                      )}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bad response</TooltipContent>
              </Tooltip>

              {onRegenerate && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className="h-7 w-7"
                      onClick={() => onRegenerate(messageId)}
                      size="icon"
                      variant="ghost"
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Regenerate</TooltipContent>
                </Tooltip>
              )}
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-7 w-7" size="icon" variant="ghost">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              {onShare && (
                <DropdownMenuItem onClick={() => onShare(messageId)}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>
              )}
              {onFlag && (
                <DropdownMenuItem onClick={() => onFlag(messageId)}>
                  <Flag className="mr-2 h-4 w-4" />
                  Report
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipProvider>
      </motion.div>
    );
  }

  // Inline variant (default)
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="h-8 w-8"
              onClick={handleCopy}
              size="icon"
              variant="ghost"
            >
              {copied ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {copied ? 'Copied!' : 'Copy to clipboard'}
          </TooltipContent>
        </Tooltip>

        {role === 'user' && onEdit && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="h-8 w-8"
                onClick={() => onEdit(messageId, content)}
                size="icon"
                variant="ghost"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit message</TooltipContent>
          </Tooltip>
        )}

        {role === 'assistant' && onRegenerate && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="h-8 w-8"
                onClick={() => onRegenerate(messageId)}
                size="icon"
                variant="ghost"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Regenerate response</TooltipContent>
          </Tooltip>
        )}

        {onDelete && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="h-8 w-8 hover:text-destructive"
                onClick={() => onDelete(messageId)}
                size="icon"
                variant="ghost"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete message</TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
}

export default MessageActions;
