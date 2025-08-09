'use client';

import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { useCallback, useState } from 'react';

export interface StreamingMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  isStreaming?: boolean;
}

export function useConvexChat(chatId: string | undefined) {
  const [streamingMessage, setStreamingMessage] =
    useState<StreamingMessage | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  // Convex queries and mutations
  const messages = useQuery(
    api.messages.getByChatId,
    chatId ? { chatId: chatId as Id<'chats'> } : 'skip'
  );

  const createMessage = useMutation(api.messages.create);

  // Send message with streaming response
  const sendMessage = useCallback(
    async (content: string, walletAddress: string, model?: string) => {
      if (!chatId) return;

      setIsStreaming(true);
      setStreamingMessage(null);

      try {
        // Get Convex deployment URL
        const deploymentUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.replace(
          'wss://',
          'https://'
        ).replace('.convex.cloud', '.convex.site');

        if (!deploymentUrl) {
          throw new Error('Convex deployment URL not configured');
        }

        // Make request to Convex HTTP action
        const response = await fetch(`${deploymentUrl}/stream-chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chatId,
            walletAddress,
            content,
            model, // Pass the selected model to the backend
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to stream response: ${response.status}`);
        }

        if (!response.body) {
          throw new Error('No response body');
        }

        // Create streaming message placeholder
        const tempId = `streaming-${Date.now()}`;
        setStreamingMessage({
          id: tempId,
          content: '',
          role: 'assistant',
          isStreaming: true,
        });

        // Process streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          
          // The response might be in plain text format
          // Just accumulate the chunks as they come
          accumulatedContent += chunk;

          // Update streaming message
          setStreamingMessage({
            id: tempId,
            content: accumulatedContent,
            role: 'assistant',
            isStreaming: true,
          });
        }

        // Clear streaming message once saved (Convex will update via subscription)
        setStreamingMessage(null);
      } catch (error) {
        console.error('Failed to send message:', error);
        throw error;
      } finally {
        setIsStreaming(false);
      }
    },
    [chatId]
  );

  // Combine regular messages with streaming message
  const allMessages = [
    ...(messages || []),
    ...(streamingMessage ? [streamingMessage] : []),
  ];

  return {
    messages: allMessages,
    sendMessage,
    isStreaming,
    streamingMessage,
  };
}
