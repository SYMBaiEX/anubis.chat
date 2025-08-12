'use client';

import { motion } from 'framer-motion';
import {
  Bot,
  Check,
  Copy,
  Download,
  FileText,
  Image,
  Paperclip,
  RefreshCw,
  ThumbsDown,
  ThumbsUp,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { AIMessage as AIMessageType } from '@/hooks/use-ai-chat';
import { cn } from '@/lib/utils';
import { OptimizedMarkdownRenderer } from '../chat/optimized-markdown-renderer';

interface AIMessageProps {
  message: AIMessageType;
  onRegenerate?: () => void;
  onFeedback?: (type: 'positive' | 'negative') => void;
  className?: string;
}

export function AIMessage({
  message,
  onRegenerate,
  onFeedback,
  className,
}: AIMessageProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const isTool = message.role === 'tool';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleFeedback = (type: 'positive' | 'negative') => {
    setFeedback(type);
    onFeedback?.(type);
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          'group flex gap-3',
          isUser ? 'flex-row-reverse' : 'flex-row',
          className
        )}
      >
        {/* Avatar */}
        <Avatar className="h-8 w-8">
          <AvatarFallback
            className={cn(
              'text-xs',
              isUser
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>

        {/* Message content */}
        <div
          className={cn(
            'flex flex-1 flex-col gap-2',
            isUser ? 'items-end' : 'items-start'
          )}
        >
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {message.attachments.map((attachment, index) => (
                <Card
                  key={`${attachment.fileId}-${index}`}
                  className="group/attachment relative overflow-hidden"
                >
                  {attachment.type === 'image' && attachment.url ? (
                    <div className="relative">
                      <img
                        src={attachment.url}
                        alt="Attachment"
                        className="h-32 w-auto max-w-xs object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 transition-opacity group-hover/attachment:opacity-100">
                        <div className="flex h-full items-center justify-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-white hover:bg-white/20"
                            asChild
                          >
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Image className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-white hover:bg-white/20"
                            asChild
                          >
                            <a href={attachment.url} download>
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-3 py-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                        {attachment.type === 'image' ? (
                          <Image className="h-5 w-5" />
                        ) : attachment.mimeType === 'application/pdf' ? (
                          <FileText className="h-5 w-5" />
                        ) : (
                          <Paperclip className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {attachment.fileId.split('/').pop() || 'File'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(attachment.size)}
                        </span>
                      </div>
                      {attachment.url && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="ml-auto h-8 w-8"
                          asChild
                        >
                          <a href={attachment.url} download>
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* Message bubble */}
          <div
            className={cn(
              'relative max-w-[80%] rounded-2xl px-4 py-3',
              isUser
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground'
            )}
          >
            {/* Content */}
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <OptimizedMarkdownRenderer content={message.content} />
              </div>
            )}

            {/* Tool invocations */}
            {message.toolInvocations && message.toolInvocations.length > 0 && (
              <div className="mt-3 space-y-2 border-t pt-3">
                {message.toolInvocations.map((tool, index) => (
                  <div
                    key={`${tool.toolCallId}-${index}`}
                    className="rounded-lg bg-background/50 p-2"
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium">Tool:</span>
                      <code className="rounded bg-muted px-1 py-0.5">
                        {tool.toolName}
                      </code>
                    </div>
                    {tool.result && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(tool.result, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            {isAssistant && (
              <div className="absolute -bottom-8 right-0 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
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
                        className="h-7 w-7"
                        onClick={onRegenerate}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Regenerate response</TooltipContent>
                  </Tooltip>
                )}

                <div className="mx-1 h-4 w-px bg-border" />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className={cn(
                        'h-7 w-7',
                        feedback === 'positive' && 'text-green-500'
                      )}
                      onClick={() => handleFeedback('positive')}
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Good response</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className={cn(
                        'h-7 w-7',
                        feedback === 'negative' && 'text-red-500'
                      )}
                      onClick={() => handleFeedback('negative')}
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Bad response</TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`;
}