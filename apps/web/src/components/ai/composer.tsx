'use client';

import { motion } from 'framer-motion';
import {
  FileText,
  Image,
  Loader2,
  Mic,
  MicOff,
  Paperclip,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { MessageAttachment } from '@/lib/types/api';
import { cn } from '@/lib/utils';
import { createModuleLogger } from '@/lib/utils/logger';

interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string, attachments?: MessageAttachment[]) => void;
  onStop?: () => void;
  attachments?: MessageAttachment[];
  onAttachmentsChange?: (attachments: MessageAttachment[]) => void;
  onFileUpload?: (files: File[]) => Promise<MessageAttachment[]>;
  isLoading?: boolean;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  suggestions?: string[];
  onSuggestionSelect?: (suggestion: string) => void;
  enableVoice?: boolean;
  enableAttachments?: boolean;
}

export function Composer({
  value,
  onChange,
  onSubmit,
  onStop,
  attachments = [],
  onAttachmentsChange,
  onFileUpload,
  isLoading = false,
  placeholder = 'Type your message...',
  maxLength = 4000,
  className,
  suggestions = [],
  onSuggestionSelect,
  enableVoice = true,
  enableAttachments = true,
}: ComposerProps) {
  const log = createModuleLogger('composer');
  const [localAttachments, setLocalAttachments] =
    useState<MessageAttachment[]>(attachments);
  const [isRecording, setIsRecording] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync attachments
  useEffect(() => {
    setLocalAttachments(attachments);
  }, [attachments]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, []);

  const handleSubmit = useCallback(() => {
    if (isLoading && onStop) {
      onStop();
      return;
    }

    const trimmedValue = value.trim();
    if (!trimmedValue && localAttachments.length === 0) {
      return;
    }

    onSubmit(trimmedValue, localAttachments);
    setLocalAttachments([]);
    onAttachmentsChange?.([]);
  }, [
    value,
    localAttachments,
    isLoading,
    onSubmit,
    onStop,
    onAttachmentsChange,
  ]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !onFileUpload) {
      return;
    }

    try {
      const uploaded = await onFileUpload(files);
      const newAttachments = [...localAttachments, ...uploaded];
      setLocalAttachments(newAttachments);
      onAttachmentsChange?.(newAttachments);
    } catch (error) {
      log.error('Failed to upload files', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (fileId: string) => {
    const newAttachments = localAttachments.filter((a) => a.fileId !== fileId);
    setLocalAttachments(newAttachments);
    onAttachmentsChange?.(newAttachments);
  };

  const handleVoiceToggle = () => {
    setIsRecording(!isRecording);
    // Voice recording implementation would go here
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    onSuggestionSelect?.(suggestion);
    textareaRef.current?.focus();
  };

  return (
    <TooltipProvider>
      <div className={cn('relative', className)}>
        {/* Suggestions */}
        {suggestions.length > 0 && value.length === 0 && !isFocused && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-full mb-2 flex w-full flex-wrap gap-2"
            exit={{ opacity: 0, y: 10 }}
            initial={{ opacity: 0, y: 10 }}
          >
            {suggestions.map((suggestion, _index) => (
              <Button
                className="text-xs"
                key={`composer-sugg-${suggestion}`}
                onClick={() => handleSuggestionClick(suggestion)}
                size="sm"
                variant="outline"
              >
                <Sparkles className="mr-1 h-3 w-3" />
                {suggestion}
              </Button>
            ))}
          </motion.div>
        )}

        {/* Attachments preview */}
        {localAttachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {localAttachments.map((attachment) => (
              <Card
                className="group relative flex items-center gap-2 px-2 py-1"
                key={attachment.fileId}
              >
                {(() => {
                  if (attachment.type === 'image') {
                    return <Image className="h-4 w-4" />;
                  }
                  if (attachment.mimeType === 'application/pdf') {
                    return <FileText className="h-4 w-4" />;
                  }
                  return <Paperclip className="h-4 w-4" />;
                })()}
                <span className="max-w-[100px] truncate text-xs">
                  {attachment.fileId.split('/').pop()}
                </span>
                <Button
                  className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => removeAttachment(attachment.fileId)}
                  size="icon"
                  variant="ghost"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Card>
            ))}
          </div>
        )}

        {/* Input area */}
        <div className="relative flex items-end gap-2 rounded-lg border bg-background p-2">
          {/* Attachment button */}
          {enableAttachments && onFileUpload && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="h-8 w-8 shrink-0"
                  disabled={isLoading}
                  onClick={() => fileInputRef.current?.click()}
                  size="icon"
                  variant="ghost"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Attach files</TooltipContent>
            </Tooltip>
          )}

          {/* Textarea */}
          <Textarea
            className="min-h-[40px] flex-1 resize-none border-0 bg-transparent p-0 focus-visible:ring-0"
            disabled={isLoading}
            maxLength={maxLength}
            onBlur={() => setIsFocused(false)}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            ref={textareaRef}
            rows={1}
            value={value}
          />

          {/* Voice button */}
          {enableVoice && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="h-8 w-8 shrink-0"
                  disabled={isLoading}
                  onClick={handleVoiceToggle}
                  size="icon"
                  variant={isRecording ? 'destructive' : 'ghost'}
                >
                  {isRecording ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isRecording ? 'Stop recording' : 'Start voice input'}
              </TooltipContent>
            </Tooltip>
          )}

          {/* Submit/Stop button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="h-8 w-8 shrink-0"
                disabled={
                  !isLoading &&
                  value.trim().length === 0 &&
                  localAttachments.length === 0
                }
                onClick={handleSubmit}
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isLoading ? 'Stop generation' : 'Send message'}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Character count */}
        {value.length > maxLength * 0.8 && (
          <div
            className={cn(
              'mt-1 text-right text-xs',
              value.length >= maxLength
                ? 'text-destructive'
                : 'text-muted-foreground'
            )}
          >
            {value.length}/{maxLength}
          </div>
        )}

        {/* Hidden file input */}
        {enableAttachments && (
          <input
            accept="image/*,.pdf,.doc,.docx,.txt,.md,.json,.csv"
            className="hidden"
            multiple
            onChange={handleFileSelect}
            ref={fileInputRef}
            type="file"
          />
        )}
      </div>
    </TooltipProvider>
  );
}
