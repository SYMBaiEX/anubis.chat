'use client';

import EmojiPicker, { EmojiStyle, Theme } from 'emoji-picker-react';
import {
  FileText,
  Image,
  Mic,
  MicOff,
  Paperclip,
  Send,
  Smile,
  Square,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useRef, useState } from 'react';
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
import type { MessageInputProps } from '@/lib/types/components';
import { cn } from '@/lib/utils';
import { createModuleLogger } from '@/lib/utils/logger';

// Initialize logger
const log = createModuleLogger('message-input');

/**
 * MessageInput component - Advanced message input with voice, files, etc.
 * Provides modern input experience with multiple input methods
 */
export function MessageInput({
  onSend,
  onTyping,
  disabled = false,
  placeholder = 'Type your message...',
  maxLength = 4000,
  className,
  children,
}: MessageInputProps & { onTyping?: () => void }) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { theme } = useTheme();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [message]);

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) return;

    onSend(trimmedMessage);
    setMessage('');
    setShowEmojiPicker(false);
  };

  const handleEmojiClick = (emojiData: any) => {
    setMessage((prev) => prev + emojiData.emoji);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceToggle = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      // TODO: Implement actual voice recording logic
      log.debug('Voice recording stopped', {
        operation: 'voice_recording_stop',
        wasRecording: true,
      });
    } else {
      // Start recording
      setIsRecording(true);
      // TODO: Implement actual voice recording logic
      log.debug('Voice recording started', {
        operation: 'voice_recording_start',
        wasRecording: false,
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // TODO: Implement file upload logic
      log.info('Files selected for upload', {
        operation: 'file_upload_selection',
        fileCount: files.length,
      });
      // Reset input
      event.target.value = '';
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // TODO: Implement image upload logic
      log.info('Images selected for upload', {
        operation: 'image_upload_selection',
        imageCount: files.length,
      });
      // Reset input
      event.target.value = '';
    }
  };

  const isMessageValid =
    message.trim().length > 0 && message.length <= maxLength;
  const isAtMaxLength = message.length >= maxLength;

  return (
    <TooltipProvider>
      <div className={cn('flex flex-col space-y-2', className)}>
        {/* Character Count */}
        {message.length > maxLength * 0.8 && (
          <div className="text-right text-muted-foreground text-xs">
            <span className={cn(isAtMaxLength && 'text-red-500')}>
              {message.length}/{maxLength}
            </span>
          </div>
        )}

        {/* Input Container */}
        <div className="flex items-end gap-2">
          {/* Attachment Buttons - Stacked vertically */}
          <div className="flex flex-col gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="h-7 w-7 p-0"
                  disabled={disabled}
                  onClick={() => fileInputRef.current?.click()}
                  size="icon"
                  variant="ghost"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Attach file</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="h-7 w-7 p-0"
                  disabled={disabled}
                  onClick={() => imageInputRef.current?.click()}
                  size="icon"
                  variant="ghost"
                >
                  <Image className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Attach image</TooltipContent>
            </Tooltip>
          </div>

          {/* Main Input Area */}
          <div className="relative flex-1">
            <Textarea
              className="max-h-[200px] min-h-[56px] resize-none pr-12"
              disabled={disabled}
              maxLength={maxLength}
              onChange={(e) => {
                setMessage(e.target.value);
                // Trigger typing indicator
                if (onTyping && e.target.value.trim()) {
                  onTyping();
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              ref={textareaRef}
              value={message}
            />

            {/* Emoji Button - Vertically centered in the right side of input */}
            <div className="-translate-y-1/2 absolute top-1/2 right-2">
              <Popover onOpenChange={setShowEmojiPicker} open={showEmojiPicker}>
                <PopoverTrigger asChild>
                  <Button
                    className="h-8 w-8 p-0"
                    disabled={disabled}
                    size="icon"
                    variant="ghost"
                  >
                    <Smile
                      className={cn(
                        'h-4 w-4 transition-colors',
                        showEmojiPicker && 'text-primary'
                      )}
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-auto border-0 p-0"
                  side="top"
                  sideOffset={8}
                >
                  <EmojiPicker
                    emojiStyle={EmojiStyle.NATIVE}
                    height={400}
                    onEmojiClick={handleEmojiClick}
                    previewConfig={{
                      showPreview: false,
                    }}
                    searchPlaceHolder="Search emoji..."
                    theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
                    width={320}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Voice/Send Buttons - Stacked vertically */}
          <div className="flex flex-col gap-0.5">
            {/* Voice Recording */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className={cn(
                    'h-7 w-7 p-0',
                    isRecording && 'bg-red-500 text-white hover:bg-red-600'
                  )}
                  disabled={disabled}
                  onClick={handleVoiceToggle}
                  size="icon"
                  variant={isRecording ? 'default' : 'ghost'}
                >
                  {isRecording ? (
                    <Square className="h-3.5 w-3.5" />
                  ) : (
                    <Mic className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {isRecording ? 'Stop recording' : 'Voice message'}
              </TooltipContent>
            </Tooltip>

            {/* Send Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="h-7 w-7 p-0"
                  disabled={disabled || !isMessageValid}
                  onClick={handleSend}
                  size="icon"
                  variant="default"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Send message (Enter)</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Voice Recording Status */}
        {isRecording && (
          <div className="flex items-center justify-center space-x-2 rounded-lg bg-red-50 p-2 text-red-600 dark:bg-red-900/20 dark:text-red-400">
            <div className="flex space-x-1">
              <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <div
                className="h-2 w-2 animate-pulse rounded-full bg-red-500"
                style={{ animationDelay: '0.5s' }}
              />
              <div
                className="h-2 w-2 animate-pulse rounded-full bg-red-500"
                style={{ animationDelay: '1s' }}
              />
            </div>
            <span className="font-medium text-sm">Recording...</span>
            <Button onClick={handleVoiceToggle} size="sm" variant="ghost">
              <MicOff className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* File Inputs (Hidden) */}
        <input
          accept=".pdf,.doc,.docx,.txt,.md"
          className="hidden"
          multiple
          onChange={handleFileUpload}
          ref={fileInputRef}
          type="file"
        />

        <input
          accept="image/*"
          className="hidden"
          multiple
          onChange={handleImageUpload}
          ref={imageInputRef}
          type="file"
        />

        {children}
      </div>
    </TooltipProvider>
  );
}

export default MessageInput;
