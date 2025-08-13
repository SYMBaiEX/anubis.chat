'use client';

import { useChat } from '@ai-sdk/react';
import type { UIMessage, UIMessagePart } from 'ai';
import { DefaultChatTransport } from 'ai';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { MessageAttachment } from '@/lib/types/api';
import { createModuleLogger } from '@/lib/utils/logger';

// Proper AI SDK v5 types
interface TextPart {
  type: 'text';
  text: string;
}

interface ToolPart {
  type: 'tool-invocation';
  toolName: string;
  toolCallId: string;
  state:
    | 'input-streaming'
    | 'input-available'
    | 'output-available'
    | 'output-error';
  input?: unknown;
  output?: unknown;
  errorText?: string;
}

export interface AIMessage extends Omit<UIMessage, 'content'> {
  content: string;
  attachments?: MessageAttachment[];
  createdAt?: number;
}

interface UseAIChatOptions {
  chatId?: string;
  initialMessages?: UIMessage[];
  onFinish?: (message: AIMessage) => void;
  onError?: (error: Error) => void;
  maxSteps?: number;
}

export function useAIChat({
  chatId,
  initialMessages = [],
  onFinish,
  onError,
  maxSteps = 5,
}: UseAIChatOptions = {}) {
  const log = createModuleLogger('use-ai-chat');
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // AI SDK v5: Manual input state management
  const [input, setInput] = useState('');

  const { messages, sendMessage, stop, error, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/ai/chat',
      body: {
        chatId,
        attachments,
        maxSteps,
      },
    }),
    messages: initialMessages,
    onFinish: ({ message }) => {
      setIsProcessing(false);
      onFinish?.(message as AIMessage);

      // Clear attachments after successful send
      setAttachments([]);
    },
    onError: (err) => {
      setIsProcessing(false);
      log.error('AI Chat Error', { error: err.message });
      toast.error(err.message || 'An error occurred');
      onError?.(err);
    },
  });

  // Send message with attachments - AI SDK v5 compatible
  const sendUserMessage = useCallback(
    async (content: string, messageAttachments?: MessageAttachment[]) => {
      if (
        !content.trim() &&
        (!messageAttachments || messageAttachments.length === 0)
      ) {
        return;
      }

      setIsProcessing(true);

      // Set attachments for the next message
      if (messageAttachments) {
        setAttachments(messageAttachments);
      }

      // Send message using AI SDK v5 format with proper typing
      const message: UIMessage = {
        id: '',
        role: 'user',
        parts: [{ type: 'text', text: content }],
      };

      await sendMessage(message);
    },
    [sendMessage]
  );

  // Handle file uploads
  const handleFileUpload = useCallback(async (files: File[]) => {
    const uploaded: MessageAttachment[] = [];

    for (const file of files) {
      try {
        // Create a temporary attachment object
        const attachment: MessageAttachment = {
          fileId: `temp-${Date.now()}-${file.name}`,
          mimeType: file.type,
          size: file.size,
          type: file.type.startsWith('image/')
            ? 'image'
            : file.type.startsWith('video/')
              ? 'video'
              : 'file',
          url: URL.createObjectURL(file),
        };

        uploaded.push(attachment);
      } catch (error) {
        log.error('Failed to process file', {
          error: error instanceof Error ? error.message : String(error),
        });
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setAttachments((prev) => [...prev, ...uploaded]);
    return uploaded;
  }, []);

  // Remove attachment
  const removeAttachment = useCallback((fileId: string) => {
    setAttachments((prev) => {
      const attachment = prev.find((a) => a.fileId === fileId);
      if (attachment?.url?.startsWith('blob:')) {
        URL.revokeObjectURL(attachment.url);
      }
      return prev.filter((a) => a.fileId !== fileId);
    });
  }, []);

  // Clear all attachments
  const clearAttachments = useCallback(() => {
    attachments.forEach((attachment) => {
      if (attachment.url?.startsWith('blob:')) {
        URL.revokeObjectURL(attachment.url);
      }
    });
    setAttachments([]);
  }, [attachments]);

  // Clean up blob URLs on unmount
  useEffect(() => {
    return () => {
      attachments.forEach((attachment) => {
        if (attachment.url?.startsWith('blob:')) {
          URL.revokeObjectURL(attachment.url);
        }
      });
    };
  }, [attachments]);

  // Generate suggestions based on conversation context
  const generateSuggestions = useCallback(() => {
    if (!messages || messages.length === 0) {
      return [
        'What can you help me with?',
        'Tell me about your capabilities',
        'How do I upload and analyze documents?',
        'Explain the AI models available',
      ];
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === 'assistant') {
      // Context-aware suggestions based on last response
      return [
        'Can you explain that in more detail?',
        'What are the alternatives?',
        'How can I implement this?',
        'Show me an example',
      ];
    }

    return [];
  }, [messages]);

  // Map messages to AIMessage type safely
  const typedMessages: AIMessage[] = messages.map((m) => {
    // Extract text content from parts array
    const content =
      m.parts
        ?.filter((part): part is TextPart => part.type === 'text')
        .map((part) => part.text)
        .join('') || '';

    return {
      ...m,
      content,
      attachments: (m as UIMessage & { attachments?: MessageAttachment[] })
        .attachments,
      createdAt: Date.now(),
    } as AIMessage;
  });

  return {
    // State
    messages: typedMessages,
    input,
    attachments,
    isLoading: isProcessing, // AI SDK v5: no isLoading from useChat
    error,

    // Actions
    setInput,
    sendMessage: sendUserMessage, // Use our wrapped function
    stop,
    setMessages,
    handleFileUpload,
    removeAttachment,
    clearAttachments,

    // Utilities
    generateSuggestions,
  };
}
