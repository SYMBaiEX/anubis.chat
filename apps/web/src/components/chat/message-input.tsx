'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { MessageInputProps } from '@/lib/types/components';
import {
  Send,
  Mic,
  MicOff,
  Paperclip,
  Image,
  FileText,
  Smile,
  Square,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * MessageInput component - Advanced message input with voice, files, etc.
 * Provides modern input experience with multiple input methods
 */
export function MessageInput({
  onSend,
  disabled = false,
  placeholder = "Type your message...",
  maxLength = 4000,
  className,
  children,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [message]);

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) return;

    onSend(trimmedMessage);
    setMessage('');
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
      console.log('Stop voice recording');
    } else {
      // Start recording
      setIsRecording(true);
      // TODO: Implement actual voice recording logic
      console.log('Start voice recording');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // TODO: Implement file upload logic
      console.log('Files selected:', files);
      // Reset input
      event.target.value = '';
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // TODO: Implement image upload logic
      console.log('Images selected:', files);
      // Reset input
      event.target.value = '';
    }
  };

  const isMessageValid = message.trim().length > 0 && message.length <= maxLength;
  const isAtMaxLength = message.length >= maxLength;

  return (
    <TooltipProvider>
      <div className={cn("flex flex-col space-y-2", className)}>
        {/* Character Count */}
        {message.length > maxLength * 0.8 && (
          <div className="text-right text-xs text-muted-foreground">
            <span className={cn(isAtMaxLength && "text-red-500")}>
              {message.length}/{maxLength}
            </span>
          </div>
        )}

        {/* Input Container */}
        <div className="flex items-end space-x-2">
          {/* Attachment Buttons */}
          <div className="flex flex-col space-y-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  disabled={disabled}
                  onClick={() => fileInputRef.current?.click()}
                  size="sm"
                  variant="ghost"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Attach file</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  disabled={disabled}
                  onClick={() => imageInputRef.current?.click()}
                  size="sm"
                  variant="ghost"
                >
                  <Image className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Attach image</TooltipContent>
            </Tooltip>
          </div>

          {/* Main Input Area */}
          <div className="flex-1 relative">
            <Textarea
              className="min-h-[44px] max-h-[200px] resize-none pr-20"
              disabled={disabled}
              maxLength={maxLength}
              onKeyDown={handleKeyDown}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={placeholder}
              ref={textareaRef}
              value={message}
            />

            {/* Emoji Button */}
            <div className="absolute bottom-2 right-16">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    disabled={disabled}
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    size="sm"
                    variant="ghost"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add emoji</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Voice/Send Buttons */}
          <div className="flex flex-col space-y-1">
            {/* Voice Recording */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className={cn(
                    isRecording && "bg-red-500 text-white hover:bg-red-600"
                  )}
                  disabled={disabled}
                  onClick={handleVoiceToggle}
                  size="sm"
                  variant={isRecording ? "default" : "ghost"}
                >
                  {isRecording ? (
                    <Square className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isRecording ? 'Stop recording' : 'Voice message'}
              </TooltipContent>
            </Tooltip>

            {/* Send Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  disabled={disabled || !isMessageValid}
                  onClick={handleSend}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Send message (Enter)</TooltipContent>
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
            <span className="text-sm font-medium">Recording...</span>
            <Button
              onClick={handleVoiceToggle}
              size="sm"
              variant="ghost"
            >
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