'use client';

import EmojiPicker, { EmojiStyle, Theme } from 'emoji-picker-react';
import {
  Brain,
  Image,
  Mic,
  MicOff,
  Paperclip,
  Send,
  Smile,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import type { MessageInputProps } from '@/lib/types/components';
import { cn } from '@/lib/utils';
import { type FontSize, getFontSizeClasses } from '@/lib/utils/font-sizes';
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
  fontSize = 'medium',
  reasoningEnabled = true,
}: MessageInputProps & { onTyping?: () => void; fontSize?: FontSize }) {
  const [message, setMessage] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [useReasoning, setUseReasoning] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { theme } = useTheme();

  // Speech recognition setup
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported: isSpeechSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    enableFormatting: true, // Enable smart punctuation and formatting
    onResult: (text, isFinal) => {
      if (isFinal) {
        // Append final formatted transcript to message
        setMessage((prev) => {
          // Add a space between previous text and new text if needed
          if (prev && !prev.endsWith(' ') && !text.startsWith(' ')) {
            return `${prev} ${text}`;
          }
          return prev + text;
        });
        // Trigger typing indicator
        if (onTyping) {
          onTyping();
        }
      }
    },
    onError: (error) => {
      log.error('Speech recognition error', { error });
      // You could show a toast notification here
    },
  });

  // Get dynamic font size classes
  const fontSizes = getFontSizeClasses(fontSize);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, []);

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) {
      return;
    }

    onSend(trimmedMessage, useReasoning);
    setMessage('');
    setShowEmojiPicker(false);
    setUseReasoning(false); // Reset reasoning toggle after sending
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
    if (isListening) {
      // Stop listening - keep everything in the input
      stopListening();
      log.debug('Voice transcription stopped', {
        operation: 'voice_transcription_stop',
        wasListening: true,
        currentMessage: message,
      });
    } else {
      // Start listening - DON'T reset anything, just continue adding
      if (!isSpeechSupported) {
        // Fallback message if browser doesn't support speech recognition
        alert(
          'Speech recognition is not supported in your browser. Please try Chrome or Edge.'
        );
        return;
      }
      startListening();
      log.debug('Voice transcription started', {
        operation: 'voice_transcription_start',
        wasListening: false,
        currentMessage: message,
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
      <div
        className={cn('flex w-full flex-col space-y-1 sm:space-y-2', className)}
      >
        {/* Character Count */}
        {message.length > maxLength * 0.8 && (
          <div
            className={cn(
              'text-right text-muted-foreground',
              fontSizes.characterCount
            )}
          >
            <span className={cn(isAtMaxLength && 'text-red-500')}>
              {message.length}/{maxLength}
            </span>
          </div>
        )}

        {/* Input Container */}
        <div className="flex w-full items-center gap-1 sm:gap-2">
          {/* Main Input Area */}
          <div className="relative flex-1 overflow-hidden">
            {/* Attachment Buttons - Inside left side of input */}
            <div className="-translate-y-1/2 absolute top-1/2 left-1 z-20 flex items-center gap-1 sm:left-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="h-8 w-4 p-0 sm:h-9 sm:w-5"
                    onClick={() => fileInputRef.current?.click()}
                    size="icon"
                    variant="ghost"
                  >
                    <Paperclip className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">Attach file</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="h-8 w-4 p-0 sm:h-9 sm:w-5"
                    onClick={() => imageInputRef.current?.click()}
                    size="icon"
                    variant="ghost"
                  >
                    <Image className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">Attach image</TooltipContent>
              </Tooltip>
            </div>

            <Textarea
              aria-label={placeholder}
              className={cn(
                'relative z-0 max-h-[200px] min-h-[44px] w-full resize-none bg-transparent pr-20 pl-20 sm:min-h-[52px] sm:pr-24 sm:pl-24',
                // Center caret vertically when inactive and empty
                !isActive && message.trim().length === 0
                  ? 'py-0 leading-[44px] sm:leading-[52px]'
                  : 'py-2 leading-normal',
                message.trim() || isActive ? 'text-left' : 'text-center',
                fontSizes.inputText
              )}
              disabled={disabled}
              maxLength={maxLength}
              onBlur={() => setIsActive(message.trim().length > 0)}
              onChange={(e) => {
                setMessage(e.target.value);
                // Trigger typing indicator
                if (onTyping && e.target.value.trim()) {
                  onTyping();
                }
              }}
              onFocus={() => setIsActive(true)}
              onKeyDown={handleKeyDown}
              // Use overlay for visual placeholder to center vertically
              placeholder=""
              ref={textareaRef}
              value={message}
            />

            {/* Centered overlay placeholder to match project styling */}
            {!isActive && message.trim().length === 0 && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute top-0 right-20 bottom-0 left-20 z-10 flex items-center justify-center sm:right-24 sm:left-24"
              >
                <span className="font-medium text-muted-foreground/80 tracking-wide">
                  {placeholder || 'Ask Anubis anything'}
                </span>
              </div>
            )}

            {/* Input Controls - Inside message input area on the right */}
            <div className="-translate-y-1/2 absolute top-1/2 right-1 z-20 flex items-center gap-1 sm:right-2">
              {/* Emoji Button (1x2 size, leftmost) */}
              <Tooltip>
                <Popover
                  onOpenChange={setShowEmojiPicker}
                  open={showEmojiPicker}
                >
                  <PopoverTrigger asChild>
                    <TooltipTrigger asChild>
                      <Button
                        aria-label="Add emoji"
                        className="h-8 w-4 p-0 sm:h-9 sm:w-5"
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <Smile
                          className={cn(
                            'h-3 w-3 transition-colors sm:h-3.5 sm:w-3.5',
                            showEmojiPicker && 'text-primary'
                          )}
                        />
                      </Button>
                    </TooltipTrigger>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    className="w-auto border-0 p-0 duration-100"
                    side="top"
                    sideOffset={6}
                    forceMount
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
                      lazyLoadEmojis
                    />
                  </PopoverContent>
                </Popover>
                <TooltipContent side="right">Add emoji</TooltipContent>
              </Tooltip>

              {/* Voice Button (1x2 size) */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className={cn(
                      'h-8 w-4 p-0 sm:h-9 sm:w-5',
                      isListening &&
                      'animate-pulse bg-red-500 text-white hover:bg-red-600'
                    )}
                    disabled={disabled || !isSpeechSupported}
                    onClick={handleVoiceToggle}
                    size="icon"
                    variant={isListening ? 'default' : 'ghost'}
                  >
                    {isListening ? (
                      <MicOff className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    ) : (
                      <Mic className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs" side="right">
                  {isSpeechSupported ? (
                    isListening ? (
                      'Stop speaking'
                    ) : (
                      <div className="space-y-1">
                        <div className="font-semibold">Speak to type</div>
                        <div className="text-xs opacity-90">
                          Say "period", "comma", "question mark" for punctuation
                        </div>
                        <div className="text-xs opacity-80">
                          Say "new line" or "capital" for formatting
                        </div>
                      </div>
                    )
                  ) : (
                    'Speech recognition not supported'
                  )}
                </TooltipContent>
              </Tooltip>

              {/* Reasoning Button (1x2 size) */}
              {reasoningEnabled && (
                <Popover>
                  <Tooltip>
                    <PopoverTrigger asChild>
                      <TooltipTrigger asChild>
                        <Button
                          aria-label="Toggle multi-step reasoning"
                          className={cn(
                            'h-8 w-4 p-0 sm:h-9 sm:w-5',
                            useReasoning &&
                            'bg-blue-500 text-white hover:bg-blue-600'
                          )}
                          size="icon"
                          type="button"
                          variant={useReasoning ? 'default' : 'ghost'}
                        >
                          <Brain className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </Button>
                      </TooltipTrigger>
                    </PopoverTrigger>
                    <TooltipContent side="right">
                      Multi-step reasoning
                    </TooltipContent>
                  </Tooltip>
                  <PopoverContent
                    align="end"
                    className="w-80 p-4"
                    side="top"
                    sideOffset={8}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Multi-step Reasoning</h4>
                        <Switch
                          aria-label="Enable multi-step reasoning"
                          checked={useReasoning}
                          onCheckedChange={(checked) =>
                            setUseReasoning(checked)
                          }
                        />
                      </div>
                      <div className="space-y-2 text-sm">
                        <p>
                          Enable deep analysis with up to 10 reasoning steps for
                          complex questions.
                        </p>
                        <div className="rounded-lg bg-amber-50 p-3 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                          ⚠️ Consumes 2 messages per send while enabled
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {/* Send Button (2x2 size, rightmost) */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                    disabled={disabled || !isMessageValid}
                    onClick={handleSend}
                    size="icon"
                    variant="default"
                  >
                    <Send className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Send message (Enter)
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Voice Transcription Status */}
        {isListening && (
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
            <span className="font-medium text-xs sm:text-sm">
              {interimTranscript
                ? `Listening: "${interimTranscript}"`
                : 'Speak now...'}
            </span>
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
