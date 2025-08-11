'use client';

import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { useCallback, useEffect, useState } from 'react';
import type { StreamingMessage as UIStreamingMessage } from '@/lib/types/api';
import { MessageRole } from '@/lib/types/api';

// Avoid duplicate identifier by reusing the imported name directly
type StreamingMessage = UIStreamingMessage;

export function useConvexChat(chatId: string | undefined) {
  const [streamingMessage, setStreamingMessage] =
    useState<StreamingMessage | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamStartTime, setStreamStartTime] = useState<number | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  // Convex queries and mutations - using authenticated queries
  const messages = useQuery(
    api.messagesAuth.getMyMessages,
    chatId ? { chatId: chatId as Id<'chats'> } : 'skip'
  );

  const _createMessage = useMutation(api.messagesAuth.createMyMessage);

  // Send message with streaming response
  const sendMessage = useCallback(
    async (
      content: string,
      walletAddress: string,
      model?: string,
      useReasoning?: boolean
    ) => {
      if (!chatId) {
        return;
      }

      setIsStreaming(true);
      setIsFinishing(false);
      setStreamingMessage(null);
      setStreamStartTime(Date.now());

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
            useReasoning,
          }),
        });

        if (!response.ok) {
          // Try to get error details
          const errorText = await response.text();

          let errorMessage = `Failed to stream response: ${response.status}`;
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.error) {
              errorMessage = errorData.error;
            }
          } catch {
            // If not JSON, use the raw text
            if (errorText) {
              errorMessage = errorText;
            }
          }

          throw new Error(errorMessage);
        }

        if (!response.body) {
          throw new Error('No response body');
        }

        // Prepare streaming message (defer showing until first chunk arrives)
        const tempId = `streaming-${Date.now()}`;

        // Process streaming response
        const reader = response.body.getReader();
        const responseClone = response.clone();
        const decoder = new TextDecoder();
        let accumulatedContent = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });

          // The response might be in plain text format
          // Just accumulate the chunks as they come
          accumulatedContent += chunk;

          // Update or create the streaming message once we have content
          if (accumulatedContent.length > 0) {
            setStreamingMessage({
              id: tempId,
              content: accumulatedContent,
              role: MessageRole.ASSISTANT as any,
              isStreaming: true,
            });
          }
        }

        // If nothing streamed, fallback to full-body text read
        try {
          if (accumulatedContent.length === 0) {
            const fallbackText = (await responseClone.text()).trim();
            if (fallbackText.length > 0) {
              setStreamingMessage({
                id: tempId,
                content: fallbackText,
                role: MessageRole.ASSISTANT as any,
                isStreaming: true,
              });
            }
          }
        } catch {}

        // Do not clear immediately; wait for persisted message to arrive
        setIsFinishing(true);
      } finally {
        setIsStreaming(false);
      }
    },
    [chatId]
  );

  // Combine regular messages with streaming message
  const allMessages = (() => {
    if (!messages) {
      return streamingMessage ? [streamingMessage] : [];
    }
    // If streaming, hide any assistant messages created after stream start to avoid duplicates
    const filtered = streamStartTime && streamingMessage
      ? messages.filter((m) => {
          return !(
            (m as any).role === MessageRole.ASSISTANT &&
            (m as any).createdAt &&
            (m as any).createdAt >= streamStartTime
          );
        })
      : messages;
    return streamingMessage ? [...filtered, streamingMessage] : filtered;
  })();

  // Reconcile: once a persisted assistant message arrives after stream start, remove streaming placeholder
  useEffect(() => {
    if (!isFinishing || !streamStartTime || !streamingMessage || !messages) {
      return;
    }
    const hasNewAssistant = messages.some(
      (m) =>
        (m as any).role === MessageRole.ASSISTANT &&
        ((m as any).createdAt || (m as any)._creationTime) &&
        (((m as any).createdAt || (m as any)._creationTime) >= streamStartTime)
    );
    if (hasNewAssistant) {
      setStreamingMessage(null);
      setIsFinishing(false);
      setStreamStartTime(null);
    }
  }, [messages, isFinishing, streamStartTime, streamingMessage]);

  return {
    messages: allMessages,
    sendMessage,
    isStreaming,
    streamingMessage,
  };
}
