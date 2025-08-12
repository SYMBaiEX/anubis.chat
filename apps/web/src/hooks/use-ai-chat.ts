'use client';

import { useChat as useAIChat } from 'ai/react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { MessageAttachment } from '@/lib/types/api';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  attachments?: MessageAttachment[];
  toolInvocations?: Array<{
    toolCallId: string;
    toolName: string;
    args: any;
    result?: any;
  }>;
  annotations?: any[];
  createdAt?: Date;
}

interface UseAIChatOptions {
  chatId?: string;
  initialMessages?: AIMessage[];
  onFinish?: (message: AIMessage) => void;
  onError?: (error: Error) => void;
  maxSteps?: number;
  experimental_toolCallStreaming?: boolean;
}

export function useAIChat({
  chatId,
  initialMessages = [],
  onFinish,
  onError,
  maxSteps = 5,
  experimental_toolCallStreaming = true,
}: UseAIChatOptions = {}) {
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    messages,
    input,
    setInput,
    append,
    reload,
    stop,
    isLoading,
    error,
    setMessages,
    data,
    addToolResult,
  } = useAIChat({
    api: '/api/ai/chat',
    id: chatId,
    initialMessages,
    maxSteps,
    experimental_toolCallStreaming,
    body: {
      chatId,
      attachments,
    },
    onResponse: (response) => {
      if (!response.ok) {
        toast.error('Failed to get AI response');
      }
    },
    onFinish: (message) => {
      setIsProcessing(false);
      onFinish?.(message as AIMessage);
      
      // Clear attachments after successful send
      setAttachments([]);
    },
    onError: (err) => {
      setIsProcessing(false);
      console.error('AI Chat Error:', err);
      toast.error(err.message || 'An error occurred');
      onError?.(err);
    },
  });

  // Send message with attachments
  const sendMessage = useCallback(
    async (content: string, messageAttachments?: MessageAttachment[]) => {
      if (!content.trim() && (!messageAttachments || messageAttachments.length === 0)) {
        return;
      }

      setIsProcessing(true);
      
      // Set attachments for the next message
      if (messageAttachments) {
        setAttachments(messageAttachments);
      }

      // Append the message
      await append({
        role: 'user',
        content,
        experimental_attachments: messageAttachments,
      } as any);
    },
    [append]
  );

  // Handle file uploads
  const handleFileUpload = useCallback(
    async (files: File[]) => {
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
          console.error('Failed to process file:', error);
          toast.error(`Failed to upload ${file.name}`);
        }
      }
      
      setAttachments((prev) => [...prev, ...uploaded]);
      return uploaded;
    },
    []
  );

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

  return {
    // State
    messages: messages as AIMessage[],
    input,
    attachments,
    isLoading: isLoading || isProcessing,
    error,
    data,
    
    // Actions
    setInput,
    sendMessage,
    reload,
    stop,
    setMessages,
    addToolResult,
    handleFileUpload,
    removeAttachment,
    clearAttachments,
    
    // Utilities
    generateSuggestions,
  };
}