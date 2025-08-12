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
  const [localAttachments, setLocalAttachments] = useState<MessageAttachment[]>(attachments);
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
  }, [value]);

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
  }, [value, localAttachments, isLoading, onSubmit, onStop, onAttachmentsChange]);

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
    if (files.length === 0 || !onFileUpload) return;

    try {
      const uploaded = await onFileUpload(files);
      const newAttachments = [...localAttachments, ...uploaded];
      setLocalAttachments(newAttachments);
      onAttachmentsChange?.(newAttachments);
    } catch (error) {
      console.error('Failed to upload files:', error);
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full mb-2 flex w-full flex-wrap gap-2"
          >
            {suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => handleSuggestionClick(suggestion)}
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
                key={attachment.fileId}
                className="group relative flex items-center gap-2 px-2 py-1"
              >
                {attachment.type === 'image' ? (
                  <Image className="h-4 w-4" />
                ) : attachment.mimeType === 'application/pdf' ? (
                  <FileText className="h-4 w-4" />
                ) : (
                  <Paperclip className="h-4 w-4" />
                )}
                <span className="max-w-[100px] truncate text-xs">
                  {attachment.fileId.split('/').pop()}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => removeAttachment(attachment.fileId)}
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
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Attach files</TooltipContent>
            </Tooltip>
          )}

          {/* Textarea */}
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            maxLength={maxLength}
            disabled={isLoading}
            className="min-h-[40px] flex-1 resize-none border-0 bg-transparent p-0 focus-visible:ring-0"
            rows={1}
          />

          {/* Voice button */}
          {enableVoice && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant={isRecording ? 'destructive' : 'ghost'}
                  className="h-8 w-8 shrink-0"
                  onClick={handleVoiceToggle}
                  disabled={isLoading}
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
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleSubmit}
                disabled={
                  !isLoading &&
                  value.trim().length === 0 &&
                  localAttachments.length === 0
                }
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
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.txt,.md,.json,.csv"
          />
        )}
      </div>
    </TooltipProvider>
  );
}