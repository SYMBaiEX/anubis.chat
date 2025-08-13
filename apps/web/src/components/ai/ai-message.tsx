'use client';

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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { createModuleLogger } from '@/lib/utils/logger';
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
  const log = createModuleLogger('ai-message');
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(
    null
  );

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const _isTool = false; // UIMessage doesn't support 'tool' role in v5

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      log.error('Failed to copy', {
        error: error instanceof Error ? error.message : String(error),
      });
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
            {isUser ? (
              <User className="h-4 w-4" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
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
                  className="group/attachment relative overflow-hidden"
                  key={`${attachment.fileId}-${index}`}
                >
                  {attachment.type === 'image' && attachment.url ? (
                    <div className="relative">
                      <img
                        alt="Attachment"
                        className="h-32 w-auto max-w-xs object-cover"
                        src={attachment.url}
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 transition-opacity group-hover/attachment:opacity-100">
                        <div className="flex h-full items-center justify-center gap-2">
                          <Button
                            asChild
                            className="h-8 w-8 text-white hover:bg-white/20"
                            size="icon"
                            variant="ghost"
                          >
                            <a
                              href={attachment.url}
                              rel="noopener noreferrer"
                              target="_blank"
                            >
                              <Image className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button
                            asChild
                            className="h-8 w-8 text-white hover:bg-white/20"
                            size="icon"
                            variant="ghost"
                          >
                            <a download href={attachment.url}>
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
                        <span className="font-medium text-sm">
                          {attachment.fileId.split('/').pop() || 'File'}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {formatFileSize(attachment.size)}
                        </span>
                      </div>
                      {attachment.url && (
                        <Button
                          asChild
                          className="ml-auto h-8 w-8"
                          size="icon"
                          variant="ghost"
                        >
                          <a download href={attachment.url}>
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

            {/* Tool invocations - AI SDK v5 format in parts array */}
            {(message as any).parts?.some((part: any) =>
              part.type?.startsWith('tool-')
            ) && (
              <div className="mt-3 space-y-2 border-t pt-3">
                {(message as any).parts
                  ?.filter((part: any) => part.type?.startsWith('tool-'))
                  .map((tool: any, index: number) => (
                    <div
                      className="rounded-lg bg-background/50 p-2"
                      key={`${tool.toolCallId || index}`}
                    >
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-medium">Tool:</span>
                        <code className="rounded bg-muted px-1 py-0.5">
                          {tool.toolName || tool.type?.replace('tool-', '')}
                        </code>
                      </div>
                      {tool.output && (
                        <div className="mt-1 text-muted-foreground text-xs">
                          <pre className="whitespace-pre-wrap">
                            {typeof tool.output === 'string'
                              ? tool.output
                              : JSON.stringify(tool.output, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}

            {/* Actions */}
            {isAssistant && (
              <div className="-bottom-8 absolute right-0 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className="h-7 w-7"
                      onClick={handleCopy}
                      size="icon"
                      variant="ghost"
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
                        className="h-7 w-7"
                        onClick={onRegenerate}
                        size="icon"
                        variant="ghost"
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
                      className={cn(
                        'h-7 w-7',
                        feedback === 'positive' && 'text-green-500'
                      )}
                      onClick={() => handleFeedback('positive')}
                      size="icon"
                      variant="ghost"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Good response</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className={cn(
                        'h-7 w-7',
                        feedback === 'negative' && 'text-red-500'
                      )}
                      onClick={() => handleFeedback('negative')}
                      size="icon"
                      variant="ghost"
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
  if (!bytes || bytes === 0) {
    return '0 B';
  }
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`;
}
