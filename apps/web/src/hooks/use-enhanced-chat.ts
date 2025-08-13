'use client';

import { useChat } from '@ai-sdk/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { DefaultChatTransport } from 'ai';
import { useMutation, useQuery } from 'convex/react';
import { useCallback, useMemo, useState, useRef } from 'react';
import type { MinimalMessage } from '@/lib/types/components';
import { createModuleLogger } from '@/lib/utils/logger';
import { MemoryManager } from '@/lib/memory/manager';

const log = createModuleLogger('hooks/use-enhanced-chat');

interface UseEnhancedChatOptions {
  chatId?: string;
  walletAddress?: string;
  onError?: (error: Error) => void;
}

/**
 * Enhanced chat hook that properly leverages AI SDK's useChat
 * Simplifies streaming, optimistic updates, and message management
 */
export function useEnhancedChat({
  chatId,
  walletAddress,
  onError,
}: UseEnhancedChatOptions) {
  // Initialize memory manager instance
  const memoryManager = useRef(new MemoryManager()).current;
  // Get Convex deployment URL for API endpoint
  const apiEndpoint = useMemo(() => {
    const deploymentUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.replace(
      'wss://',
      'https://'
    ).replace('.convex.cloud', '.convex.site');

    return deploymentUrl ? `${deploymentUrl}/stream-chat` : '/api/chat';
  }, []);

  // Convex queries for existing messages
  const convexMessages = useQuery(
    api.messagesAuth.getMyMessages,
    chatId ? { chatId: chatId as Id<'chats'> } : 'skip'
  );

  // Create message mutation for persistence
  const createMessage = useMutation(api.messagesAuth.createMyMessage);

  // Convert Convex messages to AI SDK format
  const _initialMessages = useMemo(() => {
    if (!convexMessages) {
      return [];
    }

    return convexMessages.map((msg) => ({
      id: msg._id,
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      createdAt: new Date(msg.createdAt ?? msg._creationTime ?? Date.now()),
    }));
  }, [convexMessages]);

  // Manual input state for AI SDK v5
  const [input, setInput] = useState('');

  // Get memory context for current conversation
  const getMemoryContext = useCallback(async (): Promise<string> => {
    if (!chatId) return '';

    try {
      // Retrieve recent memories related to this conversation
      const memories = await memoryManager.retrieveMemories({
        conversationId: chatId,
        limit: 5,
        minImportance: 0.5,
      });

      // Get conversation context if available
      const conversationContext = memoryManager.exportMemories().conversations.find(
        c => c.id === chatId
      );

      let contextParts: string[] = [];

      // Add conversation summary if available
      if (conversationContext?.summary) {
        contextParts.push(`Previous conversation summary: ${conversationContext.summary}`);
      }

      // Add key topics if available
      if (conversationContext?.topics && conversationContext.topics.length > 0) {
        contextParts.push(`Key topics discussed: ${conversationContext.topics.join(', ')}`);
      }

      // Add relevant memories
      if (memories.length > 0) {
        const memoryTexts = memories.map(m => m.content).join('; ');
        contextParts.push(`Relevant context: ${memoryTexts}`);
      }

      return contextParts.length > 0 
        ? `[Memory Context: ${contextParts.join(' | ')}]` 
        : '';
    } catch (err) {
      log.warn('Failed to retrieve memory context', { error: err });
      return '';
    }
  }, [chatId, memoryManager]);

  // Initialize memory system with existing messages
  const initializeMemoryFromConvex = useCallback(async () => {
    if (!chatId || !convexMessages || convexMessages.length === 0) return;

    try {
      // Convert Convex messages to UIMessage format
      const uiMessages = convexMessages.map((msg) => ({
        id: msg._id,
        role: msg.role as 'user' | 'assistant' | 'system',
        parts: [{ type: 'text' as const, text: msg.content }],
      }));

      // Update memory system with existing conversation
      await memoryManager.updateConversation(chatId, uiMessages);
      log.debug('Initialized memory system from Convex messages', { 
        messageCount: uiMessages.length 
      });
    } catch (err) {
      log.warn('Failed to initialize memory from Convex', { error: err });
    }
  }, [chatId, convexMessages, memoryManager]);

  // Initialize memory when Convex messages load
  useMemo(() => {
    initializeMemoryFromConvex();
  }, [initializeMemoryFromConvex]);

  // Use AI SDK's useChat hook with all its built-in features
  const {
    messages: aiMessages,
    sendMessage: aiSendMessage,
    stop,
    status,
    error,
  } = useChat({
    id: chatId,
    transport: new DefaultChatTransport({
      api: apiEndpoint,
    }),
    onFinish: async ({ message }) => {
      log.debug('Message finished streaming', { message });

      // Extract content from AI SDK v5 message format
      const content =
        (message as any).parts
          ?.filter((part: any) => part.type === 'text')
          .map((part: any) => part.text)
          .join('') || '';

      // Persist assistant message to Convex after streaming completes
      if (chatId && message.role === 'assistant') {
        try {
          await createMessage({
            chatId: chatId as Id<'chats'>,
            content,
            role: 'assistant',
            metadata: {
              model: (message as any).metadata?.model,
              usage: (message as any).metadata?.usage,
            },
          });

          // Update memory system with latest conversation context
          if (aiMessages && aiMessages.length > 0) {
            await memoryManager.updateConversation(chatId, aiMessages);
            log.debug('Updated memory system with conversation context', { 
              messageCount: aiMessages.length 
            });
          }
        } catch (err) {
          log.error('Failed to persist assistant message or update memory', { error: err });
        }
      }
    },
    onError: (err) => {
      log.error('Chat error', { error: err });
      onError?.(err);
    },
    experimental_throttle: 50, // Smooth streaming updates
  });

  // Enhanced send function with proper AI SDK integration
  const sendMessage = useCallback(
    async (
      content: string,
      _model?: string,
      _useReasoning?: boolean,
      attachments?: Array<{
        fileId: string;
        url?: string;
        mimeType: string;
        size: number;
        type: 'image' | 'file' | 'video';
      }>
    ) => {
      if (!(chatId && content.trim())) {
        return;
      }

      try {
        // Get memory context for this conversation
        const memoryContext = await getMemoryContext();
        
        // Persist user message to Convex first
        await createMessage({
          chatId: chatId as Id<'chats'>,
          content,
          role: 'user',
          attachments,
        });

        // Create enhanced message with memory context
        const enhancedContent = memoryContext 
          ? `${memoryContext}\n\nUser: ${content}`
          : content;

        // Use AI SDK's sendMessage for optimistic UI and streaming
        await aiSendMessage({
          role: 'user',
          parts: [{ type: 'text', text: enhancedContent }],
        });
        
        log.debug('Sent message with memory context', { 
          hasMemoryContext: !!memoryContext,
          originalLength: content.length,
          enhancedLength: enhancedContent.length 
        });
      } catch (err) {
        log.error('Failed to send message', { error: err });
        throw err;
      }
    },
    [chatId, aiSendMessage, createMessage, getMemoryContext]
  );

  // Regenerate last assistant message
  const regenerateLastMessage = useCallback(() => {
    // AI SDK v5 doesn't have reload - would need to implement differently
    log.warn('Regenerate not implemented for AI SDK v5');
  }, []);

  // Convert AI SDK messages to MinimalMessage format
  const formattedMessages = useMemo((): MinimalMessage[] => {
    // If we have Convex messages, prefer them as source of truth
    if (convexMessages && convexMessages.length > 0) {
      const convexMsgs: MinimalMessage[] = convexMessages.map((msg) => ({
        _id: msg._id,
        content: msg.content,
        role: msg.role,
        createdAt: msg.createdAt ?? msg._creationTime ?? Date.now(),
        attachments: (msg as any).attachments || [],
        metadata: msg.metadata,
      }));

      // Add streaming message if currently streaming
      if (status === 'streaming' && aiMessages.length > 0) {
        const lastAiMsg = aiMessages.at(-1);
        if (lastAiMsg?.role === 'assistant') {
          // Extract content from AI SDK v5 message format
          const content =
            lastAiMsg?.parts
              ?.filter((part: any) => part.type === 'text')
              .map((part: any) => part.text)
              .join('') || '';

          // Check if this is a new streaming message
          const isNew = !convexMsgs.some(
            (m) => m.content === content && m.role === 'assistant'
          );

          if (isNew) {
            convexMsgs.push({
              _id: `streaming-${Date.now()}`,
              content,
              role: 'assistant',
              createdAt: Date.now(),
              isStreaming: true,
            } as MinimalMessage);
          }
        }
      }

      return convexMsgs;
    }

    // Fallback to AI SDK messages
    return aiMessages.map((msg) => {
      // Extract content from AI SDK v5 message format
      const content =
        msg.parts
          ?.filter((part: any) => part.type === 'text')
          .map((part: any) => part.text)
          .join('') || '';

      return {
        _id: msg.id,
        content,
        role: msg.role as 'user' | 'assistant' | 'system',
        createdAt: Date.now(),
      };
    });
  }, [convexMessages, aiMessages, status]);

  return {
    // Messages
    messages: formattedMessages,
    streamingMessage: status === 'streaming' ? formattedMessages.at(-1) : null,

    // Input management
    input,
    setInput,

    // Actions
    sendMessage,
    regenerate: regenerateLastMessage,
    stop,

    // Status flags (much cleaner than manual state management)
    isStreaming: status === 'streaming',
    isLoading: status === 'submitted',
    isReady: status === 'ready',

    // Error handling
    error,
  };
}
