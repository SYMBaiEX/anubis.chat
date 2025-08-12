'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Brain,
  FileText,
  Image,
  Loader2,
  Mic,
  MicOff,
  Paperclip,
  Send,
  Smile,
  Sparkles,
  X,
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  preview?: string;
}

interface EnhancedMessageInputProps {
  onSend: (
    content: string,
    options?: {
      attachments?: Attachment[];
      useReasoning?: boolean;
    }
  ) => Promise<void>;
  onTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
  isStreaming?: boolean;
  className?: string;
}

/**
 * Enhanced message input with AI SDK integration
 * Modern design with smooth animations and attachment support
 */
export function EnhancedMessageInput({
  onSend,
  onTyping,
  disabled = false,
  placeholder = 'Message Anubis...',
  isStreaming = false,
  className,
}: EnhancedMessageInputProps) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [useReasoning, setUseReasoning] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 200);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, []);

  // Handle send
  const handleSend = async () => {
    const content = message.trim();
    if ((!content && attachments.length === 0) || disabled || isSending) {
      return;
    }

    setIsSending(true);
    try {
      await onSend(content, {
        attachments: attachments.length > 0 ? attachments : undefined,
        useReasoning,
      });
      
      // Clear inputs on success
      setMessage('');
      setAttachments([]);
      setUseReasoning(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    onTyping?.();
  };

  // Handle file selection
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newAttachments: Attachment[] = [];
    
    for (const file of Array.from(files)) {
      // Create object URL for preview
      const url = URL.createObjectURL(file);
      
      newAttachments.push({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        url,
        preview: file.type.startsWith('image/') ? url : undefined,
      });
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // Remove attachment
  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const attachment = prev.find((a) => a.id === id);
      if (attachment?.preview) {
        URL.revokeObjectURL(attachment.preview);
      }
      return prev.filter((a) => a.id !== id);
    });
  };

  const canSend = (message.trim().length > 0 || attachments.length > 0) && !disabled && !isSending;

  return (
    <TooltipProvider>
      <div className={cn('relative w-full', className)}>
        {/* Drag overlay */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center rounded-2xl border-2 border-dashed border-primary bg-primary/10 backdrop-blur-sm"
            >
              <div className="text-center">
                <Paperclip className="mx-auto mb-2 h-8 w-8 text-primary" />
                <p className="text-sm font-medium">Drop files here</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main input container */}
        <div
          className={cn(
            'relative overflow-hidden rounded-2xl border bg-background transition-all',
            isDragging && 'border-primary',
            disabled && 'opacity-50'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Attachments preview */}
          <AnimatePresence>
            {attachments.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-b p-2"
              >
                <div className="flex flex-wrap gap-2">
                  {attachments.map((attachment) => (
                    <motion.div
                      key={attachment.id}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="group relative flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1.5"
                    >
                      {attachment.preview ? (
                        <img
                          src={attachment.preview}
                          alt={attachment.name}
                          className="h-6 w-6 rounded object-cover"
                        />
                      ) : attachment.type.startsWith('image/') ? (
                        <Image className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="max-w-[150px] truncate text-sm">
                        {attachment.name}
                      </span>
                      <button
                        onClick={() => removeAttachment(attachment.id)}
                        className="ml-1 rounded p-0.5 opacity-0 transition-opacity hover:bg-destructive/20 group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input area */}
          <div className="flex items-end gap-2 p-3">
            {/* Attachment button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Attach files</TooltipContent>
            </Tooltip>

            {/* Textarea */}
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                adjustTextareaHeight();
                onTyping?.();
              }}
              onKeyDown={handleKeyDown}
              placeholder={isStreaming ? 'Anubis is thinking...' : placeholder}
              disabled={disabled || isStreaming}
              className="min-h-[40px] resize-none border-0 bg-transparent p-0 text-base focus-visible:ring-0"
              rows={1}
            />

            {/* Action buttons */}
            <div className="flex shrink-0 items-center gap-1">
              {/* Reasoning toggle */}
              <Popover>
                <Tooltip>
                  <PopoverTrigger asChild>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant={useReasoning ? 'default' : 'ghost'}
                        className="h-9 w-9"
                        disabled={disabled}
                      >
                        <Brain className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                  </PopoverTrigger>
                  <TooltipContent>Enhanced reasoning</TooltipContent>
                </Tooltip>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Enhanced Reasoning</h4>
                      <Button
                        size="sm"
                        variant={useReasoning ? 'default' : 'outline'}
                        onClick={() => setUseReasoning(!useReasoning)}
                      >
                        {useReasoning ? 'Enabled' : 'Disabled'}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Enable multi-step reasoning for complex questions. Uses additional tokens but provides more thorough analysis.
                    </p>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Send button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant={canSend ? 'default' : 'ghost'}
                    className="h-9 w-9"
                    onClick={handleSend}
                    disabled={!canSend}
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isStreaming ? (
                      <Sparkles className="h-4 w-4 animate-pulse" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isSending ? 'Sending...' : isStreaming ? 'Anubis is responding...' : 'Send message'}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
        </div>

        {/* Character count (optional) */}
        {message.length > 3000 && (
          <div className="mt-1 text-right text-xs text-muted-foreground">
            {message.length} / 4000
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}