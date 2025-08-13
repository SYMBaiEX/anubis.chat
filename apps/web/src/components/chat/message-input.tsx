'use client';

import EmojiPicker, { EmojiStyle, Theme } from 'emoji-picker-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Brain,
  FileText,
  FileVideo,
  Image,
  Mic,
  MicOff,
  Paperclip,
  Send,
  Smile,
  Sparkles,
  X,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useRef, useState } from 'react';
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

// Helper function to format file sizes
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`;
};

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
  const [attachments, setAttachments] = useState<
    Array<{
      id: string;
      name: string;
      size: number;
      type: string;
      preview?: string;
      storageId?: string;
      url?: string;
      kind: 'image' | 'file' | 'video';
    }>
  >([]);
  const [isActive, setIsActive] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [useReasoning, setUseReasoning] = useState(false);
  const [isSending, setIsSending] = useState(false);
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

  // Enhanced auto-resize textarea with smooth transitions
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 200);
      textarea.style.height = `${newHeight}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [message, adjustTextareaHeight]);

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled || isSending) {
      return;
    }

    // Set sending state for instant visual feedback
    setIsSending(true);

    try {
      // Send message with instant feedback
      await onSend(
        trimmedMessage,
        useReasoning,
        attachments.map((a) => ({
          fileId: a.storageId || a.id,
          url: a.url,
          mimeType: a.type,
          size: a.size,
          type: a.kind,
        }))
      );

      // Clear inputs immediately for instant response
      setMessage('');
      setShowEmojiPicker(false);
      setUseReasoning(false); // Reset reasoning toggle after sending
      setAttachments([]);
    } finally {
      // Reset sending state
      setIsSending(false);
    }
  };

  const handleEmojiClick = (emojiData: { emoji: string }) => {
    setMessage((prev) => prev + emojiData.emoji);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Trigger typing indicator on any key press
    if (onTyping) {
      onTyping();
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

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const selected = Array.from(files);
      // Upload each file to Convex storage via http route
      const uploaded: typeof attachments = [];
      for (const file of selected) {
        try {
          // Request presigned upload URL
          const convexSite = process.env.NEXT_PUBLIC_CONVEX_URL?.replace(
            'wss://',
            'https://'
          ).replace('.convex.cloud', '.convex.site');
          if (!convexSite) throw new Error('Convex URL not configured');

          const presign = await fetch(`${convexSite}/generateUploadUrl`, {
            method: 'POST',
          });
          const { url } = (await presign.json()) as { url: string };

          // Upload binary directly to Convex
          const put = await fetch(url, {
            method: 'POST',
            body: file,
            headers: {
              'Content-Type': file.type || 'application/octet-stream',
            },
          });
          if (!put.ok) throw new Error('Upload failed');
          const { storageId } = (await put.json()) as { storageId: string };

          // Get the public URL for the uploaded file
          const publicUrl = `${convexSite}/serveStorage?id=${storageId}`;

          uploaded.push({
            id: crypto.randomUUID(),
            name: file.name,
            size: file.size,
            type: file.type,
            storageId,
            // Create preview for documents and images
            preview:
              file.type.startsWith('image/') || file.type === 'application/pdf'
                ? URL.createObjectURL(file)
                : undefined,
            url: publicUrl,
            kind: file.type.startsWith('image/')
              ? 'image'
              : file.type.startsWith('video/')
                ? 'video'
                : 'file',
          });

          log.debug('File uploaded successfully', {
            fileName: file.name,
            storageId,
            url: publicUrl,
          });
        } catch (error) {
          log.error('File upload failed', { error, fileName: file.name });
          // Optionally show a toast notification
          // toast.error(`Failed to upload ${file.name}`);
        }
      }

      setAttachments((prev) => [...prev, ...uploaded]);
      // Reset input
      event.target.value = '';
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const selected = Array.from(files);
      const uploaded: typeof attachments = [];
      for (const file of selected) {
        try {
          const convexSite = process.env.NEXT_PUBLIC_CONVEX_URL?.replace(
            'wss://',
            'https://'
          ).replace('.convex.cloud', '.convex.site');
          if (!convexSite) throw new Error('Convex URL not configured');

          const presign = await fetch(`${convexSite}/generateUploadUrl`, {
            method: 'POST',
          });
          const { url } = (await presign.json()) as { url: string };

          const put = await fetch(url, {
            method: 'POST',
            body: file,
            headers: {
              'Content-Type': file.type || 'image/jpeg',
            },
          });
          if (!put.ok) throw new Error('Upload failed');
          const { storageId } = (await put.json()) as { storageId: string };

          // Get the public URL for the uploaded image
          const publicUrl = `${convexSite}/serveStorage?id=${storageId}`;

          uploaded.push({
            id: crypto.randomUUID(),
            name: file.name,
            size: file.size,
            type: file.type,
            storageId,
            preview: URL.createObjectURL(file),
            url: publicUrl,
            kind: 'image',
          });

          log.debug('Image uploaded successfully', {
            fileName: file.name,
            storageId,
            url: publicUrl,
          });
        } catch (error) {
          log.error('Image upload failed', { error, fileName: file.name });
          // Optionally show a toast notification
          // toast.error(`Failed to upload ${file.name}`);
        }
      }

      setAttachments((prev) => [...prev, ...uploaded]);
      // Reset input
      event.target.value = '';
    }
  };

  const isMessageValid =
    message.trim().length > 0 && message.length <= maxLength;
  const isAtMaxLength = message.length >= maxLength;

  return (
    <TooltipProvider>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className={cn('flex w-full flex-col space-y-1 sm:space-y-2', className)}
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.3 }}
      >
        {/* Animated Character Count */}
        <AnimatePresence>
          {message.length > maxLength * 0.8 && (
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                'text-right text-muted-foreground',
                fontSizes.characterCount
              )}
              exit={{ opacity: 0, scale: 0.9 }}
              initial={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <span
                className={cn(isAtMaxLength && 'font-semibold text-red-500')}
              >
                {message.length}/{maxLength}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

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
            {/* Animated Attachment Preview */}
            <AnimatePresence>
              {attachments.length > 0 && (
                <motion.div
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mb-2 flex flex-wrap items-center gap-2 px-2"
                  exit={{ height: 0, opacity: 0 }}
                  initial={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {attachments.map((a) => {
                    const isImage = a.kind === 'image';
                    const isPdf = a.type === 'application/pdf';
                    const fileIcon = isImage ? (
                      <Image className="h-3.5 w-3.5" />
                    ) : a.kind === 'video' ? (
                      <FileVideo className="h-3.5 w-3.5" />
                    ) : isPdf ? (
                      <FileText className="h-3.5 w-3.5" />
                    ) : (
                      <Paperclip className="h-3.5 w-3.5" />
                    );

                    return (
                      <motion.div
                        animate={{ scale: 1, opacity: 1 }}
                        className="group relative inline-flex items-center gap-2 rounded-lg border bg-muted/50 px-2.5 py-1.5 text-xs transition-colors hover:bg-muted"
                        exit={{ scale: 0.8, opacity: 0 }}
                        initial={{ scale: 0.8, opacity: 0 }}
                        key={a.id}
                        transition={{ duration: 0.15 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {/* Thumbnail or icon */}
                        {a.preview && isImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            alt={a.name}
                            className="h-8 w-8 rounded object-cover"
                            src={a.preview}
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded bg-muted-foreground/10">
                            {fileIcon}
                          </div>
                        )}

                        {/* File info */}
                        <div className="flex flex-col">
                          <span className="max-w-[120px] truncate font-medium">
                            {a.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatFileSize(a.size)}
                          </span>
                        </div>

                        {/* Remove button */}
                        <button
                          aria-label={`Remove ${a.name}`}
                          className="ml-1 rounded-md p-1 transition-colors hover:bg-destructive/20"
                          onClick={() => {
                            // Clean up object URLs to prevent memory leaks
                            if (a.preview && a.preview.startsWith('blob:')) {
                              URL.revokeObjectURL(a.preview);
                            }
                            setAttachments((prev) =>
                              prev.filter((x) => x.id !== a.id)
                            );
                          }}
                          type="button"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

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
                    forceMount
                    side="top"
                    sideOffset={6}
                  >
                    <EmojiPicker
                      emojiStyle={EmojiStyle.NATIVE}
                      height={400}
                      lazyLoadEmojis
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

              {/* Animated Send Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    animate={{
                      scale: isMessageValid ? 1 : 0.9,
                      opacity: isMessageValid ? 1 : 0.6,
                    }}
                    transition={{
                      duration: 0.2,
                      type: 'spring',
                      stiffness: 500,
                    }}
                    whileHover={{ scale: isMessageValid ? 1.1 : 0.9 }}
                    whileTap={{ scale: isMessageValid ? 0.95 : 0.9 }}
                  >
                    <Button
                      className={cn(
                        'h-8 w-8 p-0 transition-all sm:h-9 sm:w-9',
                        isMessageValid &&
                          'bg-primary shadow-lg hover:bg-primary/90',
                        isSending && 'animate-pulse'
                      )}
                      disabled={disabled || !isMessageValid || isSending}
                      onClick={handleSend}
                      size="icon"
                      variant={isMessageValid ? 'default' : 'ghost'}
                    >
                      {isSending ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: 'linear',
                          }}
                        >
                          <Sparkles className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                        </motion.div>
                      ) : isMessageValid ? (
                        <motion.div
                          animate={{ rotate: 0 }}
                          initial={{ rotate: -45 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Send className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                        </motion.div>
                      ) : (
                        <Send className="h-4 w-4 opacity-50 sm:h-4.5 sm:w-4.5" />
                      )}
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {isSending
                    ? 'Sending...'
                    : isMessageValid
                      ? 'Send message (Enter)'
                      : 'Type a message to send'}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Animated Voice Transcription Status */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center space-x-2 rounded-lg bg-red-50 p-2 text-red-600 dark:bg-red-900/20 dark:text-red-400"
              exit={{ opacity: 0, y: -10 }}
              initial={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex space-x-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    className="h-2 w-2 rounded-full bg-red-500"
                    key={i}
                    transition={{
                      duration: 1.5,
                      repeat: Number.POSITIVE_INFINITY,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
              <span className="font-medium text-xs sm:text-sm">
                {interimTranscript
                  ? `Listening: "${interimTranscript}"`
                  : 'Speak now...'}
              </span>
              <Button onClick={handleVoiceToggle} size="sm" variant="ghost">
                <MicOff className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* File Inputs (Hidden) */}
        <input
          accept=".pdf,.doc,.docx,.txt,.md,.json,.csv,.xml"
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
      </motion.div>
    </TooltipProvider>
  );
}

export default MessageInput;
