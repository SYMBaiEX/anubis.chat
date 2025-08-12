'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  CheckCheck,
  Copy,
  Download,
  FileText,
  Image,
  Loader2,
  RefreshCw,
  Sparkles,
  User,
} from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import type { UIMessage } from 'ai';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface EnhancedMessageBubbleProps {
  message: UIMessage;
  onRegenerate?: () => void;
  isStreaming?: boolean;
  className?: string;
}

/**
 * Enhanced message bubble with AI SDK message parts support
 * Handles text, tool calls, attachments, and streaming
 */
export function EnhancedMessageBubble({
  message,
  onRegenerate,
  isStreaming = false,
  className,
}: EnhancedMessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  // Handle copy to clipboard
  const handleCopy = async () => {
    const text = message.parts
      .filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join('\n');
    
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render message parts
  const renderPart = (part: any, index: number) => {
    switch (part.type) {
      case 'text':
        return (
          <div key={index} className="prose prose-sm dark:prose-invert max-w-none">
            {isUser ? (
              <p className="whitespace-pre-wrap">{part.text}</p>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <div className="relative">
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute right-2 top-2 h-6 w-6"
                          onClick={() => {
                            navigator.clipboard.writeText(String(children));
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {part.text}
              </ReactMarkdown>
            )}
          </div>
        );

      case 'file':
        if (part.mediaType?.startsWith('image/')) {
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative overflow-hidden rounded-lg"
            >
              <img
                src={part.url}
                alt={part.filename || 'Image'}
                className="max-w-full rounded-lg"
              />
              {part.filename && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1 text-xs text-white">
                  {part.filename}
                </div>
              )}
            </motion.div>
          );
        }
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3"
          >
            <FileText className="h-5 w-5 text-muted-foreground" />
            <span className="flex-1 text-sm">{part.filename || 'File'}</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => window.open(part.url, '_blank')}
            >
              <Download className="h-4 w-4" />
            </Button>
          </motion.div>
        );

      case 'tool-call':
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 rounded-lg bg-blue-500/10 px-3 py-2 text-sm"
          >
            <Sparkles className="h-4 w-4 text-blue-500" />
            <span>Using {part.toolName}</span>
            {part.state === 'partial-call' && (
              <Loader2 className="h-3 w-3 animate-spin" />
            )}
          </motion.div>
        );

      case 'tool-result':
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-lg border bg-muted/30 p-3"
          >
            <div className="mb-1 text-xs font-medium text-muted-foreground">
              Tool Result
            </div>
            <pre className="overflow-auto text-xs">
              {JSON.stringify(part.result, null, 2)}
            </pre>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'group relative flex gap-3',
          isUser ? 'flex-row-reverse' : 'flex-row',
          className
        )}
      >
        {/* Avatar */}
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage
            src={isUser ? undefined : '/anubis-avatar.png'}
            alt={isUser ? 'User' : 'Anubis'}
          />
          <AvatarFallback>
            {isUser ? <User className="h-4 w-4" /> : 'AI'}
          </AvatarFallback>
        </Avatar>

        {/* Message content */}
        <div
          className={cn(
            'relative max-w-[70%] space-y-2',
            isUser ? 'items-end' : 'items-start'
          )}
        >
          {/* Message bubble */}
          <div
            className={cn(
              'rounded-2xl px-4 py-3',
              isUser
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            )}
          >
            {/* Render all message parts */}
            <div className="space-y-2">
              {message.parts.map((part, index) => renderPart(part, index))}
            </div>

            {/* Streaming indicator */}
            {isStreaming && isAssistant && (
              <motion.div
                className="mt-2 flex items-center gap-1"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <div className="h-2 w-2 rounded-full bg-current" />
                <div className="h-2 w-2 rounded-full bg-current" />
                <div className="h-2 w-2 rounded-full bg-current" />
              </motion.div>
            )}
          </div>

          {/* Attachments */}
          {message.experimental_attachments && message.experimental_attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {message.experimental_attachments.map((attachment, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 rounded-lg border bg-background px-3 py-1.5 text-sm"
                >
                  {attachment.contentType?.startsWith('image/') ? (
                    <Image className="h-4 w-4" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  <span className="max-w-[150px] truncate">
                    {attachment.name || 'Attachment'}
                  </span>
                </motion.div>
              ))}
            </div>
          )}

          {/* Timestamp and actions */}
          <div
            className={cn(
              'flex items-center gap-2 text-xs text-muted-foreground',
              isUser ? 'justify-end' : 'justify-start'
            )}
          >
            {message.createdAt && (
              <span>
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}

            {/* Action buttons for assistant messages */}
            {isAssistant && !isStreaming && (
              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {copied ? 'Copied!' : 'Copy message'}
                  </TooltipContent>
                </Tooltip>

                {onRegenerate && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={onRegenerate}
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Regenerate response</TooltipContent>
                  </Tooltip>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}