/**
 * Chat Messages Endpoint with AI Streaming
 * Handles message creation and AI streaming responses
 */

import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, streamText } from 'ai';
import { nanoid } from 'nanoid';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { type AuthenticatedRequest, withAuth } from '@/lib/middleware/auth';
import { messageRateLimit } from '@/lib/middleware/rate-limit';
import type { ChatMessage, SendMessageRequest } from '@/lib/types/api';
import { MessageRole } from '@/lib/types/api';
import {
  addSecurityHeaders,
  createdResponse,
  notFoundResponse,
  paginatedResponse,
  successResponse,
  validationErrorResponse,
} from '@/lib/utils/api-response';
import { createModuleLogger } from '@/lib/utils/logger';

// =============================================================================
// Logger
// =============================================================================

const log = createModuleLogger('api/chats/messages');

// =============================================================================
// Request Validation
// =============================================================================

const sendMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message content is required')
    .max(10_000, 'Message must be 10000 characters or less'),
  role: z.nativeEnum(MessageRole).default(MessageRole.USER),
  stream: z.boolean().default(true),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(8000).optional(),
});

const listMessagesSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
});

// =============================================================================
// Helper Functions
// =============================================================================

async function getChatById(chatId: string, walletAddress: string) {
  // TODO: Implement Convex query to get chat
  // return await getChat(chatId, walletAddress);

  // Mock implementation
  if (chatId.length < 10) return null;

  return {
    _id: chatId,
    walletAddress,
    model: 'gpt-4o',
    systemPrompt: 'You are a helpful AI assistant.',
    temperature: 0.7,
    maxTokens: 2000,
  };
}

async function getChatMessages(
  chatId: string,
  walletAddress: string,
  options: { cursor?: string; limit: number }
) {
  // TODO: Implement Convex query to get messages
  // return await getMessages(chatId, walletAddress, options);

  // Mock implementation
  const mockMessages: ChatMessage[] = Array.from(
    { length: Math.min(options.limit, 10) },
    (_, i) => ({
      _id: nanoid(12),
      chatId,
      walletAddress,
      role: i % 2 === 0 ? MessageRole.USER : MessageRole.ASSISTANT,
      content:
        i % 2 === 0 ? 'User message content' : 'Assistant response content',
      tokenCount: Math.floor(Math.random() * 100) + 20,
      metadata:
        i % 2 === 1
          ? {
              model: 'gpt-4o',
              finishReason: 'stop',
              usage: {
                inputTokens: 50,
                outputTokens: 75,
                totalTokens: 125,
              },
            }
          : undefined,
      createdAt: Date.now() - i * 30 * 1000, // 30 seconds apart
    })
  );

  return {
    messages: mockMessages,
    hasMore: mockMessages.length === options.limit,
    nextCursor:
      mockMessages.length === options.limit
        ? mockMessages[mockMessages.length - 1]._id
        : undefined,
  };
}

// =============================================================================
// Route Handlers
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return messageRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      const { walletAddress } = authReq.user;
      const { id: chatId } = await params;
      
      try {
        const { searchParams } = new URL(req.url);

        // Validate chat exists and user has access
        const chat = await getChatById(chatId, walletAddress);
        if (!chat) {
          return notFoundResponse('Chat not found');
        }

        // Parse and validate query parameters
        const queryValidation = listMessagesSchema.safeParse({
          cursor: searchParams.get('cursor'),
          limit: searchParams.get('limit'),
        });

        if (!queryValidation.success) {
          return validationErrorResponse(
            'Invalid query parameters',
            queryValidation.error.flatten().fieldErrors
          );
        }

        const { cursor, limit } = queryValidation.data;

        // Fetch messages
        const { messages, hasMore, nextCursor } = await getChatMessages(
          chatId,
          walletAddress,
          { cursor, limit }
        );

        log.apiRequest('GET /api/chats/[id]/messages', {
          chatId,
          walletAddress,
          messageCount: messages.length,
          hasMore,
          cursor,
        });

        const response = paginatedResponse(messages, {
          cursor,
          nextCursor,
          hasMore,
          limit,
        });

        return addSecurityHeaders(response);
      } catch (error) {
        log.error('Failed to retrieve messages', {
          error,
          chatId: chatId,
          operation: 'get_messages',
        });
        return validationErrorResponse('Failed to retrieve messages');
      }
    });
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return messageRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      const { walletAddress } = authReq.user;
      const { id: chatId } = await params;
      
      try {

        // Validate chat exists and user has access
        const chat = await getChatById(chatId, walletAddress);
        if (!chat) {
          return notFoundResponse('Chat not found');
        }

        // Parse and validate request body
        const body = await req.json();
        const validation = sendMessageSchema.safeParse(body);

        if (!validation.success) {
          return validationErrorResponse(
            'Invalid message data',
            validation.error.flatten().fieldErrors
          );
        }

        const { content, role, stream, temperature, maxTokens } =
          validation.data;

        // Create user message
        const userMessage: ChatMessage = {
          _id: nanoid(12),
          chatId,
          walletAddress,
          role,
          content,
          tokenCount: Math.floor(content.length / 4), // Rough token estimate
          createdAt: Date.now(),
        };

        // TODO: Save user message to Convex
        // await saveMessage(userMessage);

        // If not streaming, return the saved message
        if (!stream) {
          log.dbOperation('message_created', {
            messageId: userMessage._id,
            chatId,
            walletAddress,
            role,
            tokenCount: userMessage.tokenCount,
          });
          const response = createdResponse(userMessage);
          return addSecurityHeaders(response);
        }

        // For streaming, get chat history for AI context
        const { messages: historyMessages } = await getChatMessages(
          chatId,
          walletAddress,
          { limit: 20 }
        );

        // Convert to AI SDK UI Message format
        const conversationHistory = [
          ...historyMessages.reverse().map((msg) => ({
            id: msg._id,
            role: msg.role as 'user' | 'assistant' | 'system',
            parts: [{ type: 'text' as const, text: msg.content }],
          })),
          {
            id: userMessage._id,
            role: userMessage.role as 'user' | 'assistant' | 'system',
            parts: [{ type: 'text' as const, text: userMessage.content }],
          },
        ];

        // Stream AI response
        const result = streamText({
          model: openai(chat.model),
          system: chat.systemPrompt || 'You are a helpful AI assistant.',
          messages: convertToModelMessages(conversationHistory),
          temperature: temperature ?? chat.temperature ?? 0.7,
          maxOutputTokens: maxTokens ?? chat.maxTokens ?? 2000,
          onFinish: async ({ text, finishReason, usage }) => {
            try {
              // TODO: Save assistant message to Convex
              const assistantMessage: ChatMessage = {
                _id: nanoid(12),
                chatId,
                walletAddress,
                role: MessageRole.ASSISTANT,
                content: text,
                tokenCount: usage.totalTokens || Math.floor(text.length / 4),
                metadata: {
                  model: chat.model,
                  finishReason: finishReason || 'stop',
                  usage: {
                    inputTokens: usage.inputTokens || 0,
                    outputTokens: usage.outputTokens || 0,
                    totalTokens: usage.totalTokens || 0,
                  },
                },
                createdAt: Date.now(),
              };

              // await saveMessage(assistantMessage);
              // await updateChatLastMessage(chatId, assistantMessage);

              log.dbOperation('ai_message_created', {
                messageId: assistantMessage._id,
                chatId,
                walletAddress,
                model: chat.model,
                tokenCount: assistantMessage.tokenCount,
                finishReason,
                usage,
              });
            } catch (error) {
              log.error('Failed to save AI response', {
                error,
                chatId,
                operation: 'save_ai_response',
              });
            }
          },
        });

        log.apiRequest('POST /api/chats/[id]/messages - Stream', {
          chatId,
          walletAddress,
          model: chat.model,
          temperature: temperature ?? chat.temperature ?? 0.7,
          maxTokens: maxTokens ?? chat.maxTokens ?? 2000,
          historyLength: conversationHistory.length,
        });

        // Return streaming response
        return result.toUIMessageStreamResponse({
          originalMessages: conversationHistory,
        });
      } catch (error) {
        log.error('Failed to send message', {
          error,
          chatId: chatId,
          operation: 'send_message',
        });
        return validationErrorResponse('Failed to send message');
      }
    });
  });
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  return addSecurityHeaders(response);
}

// =============================================================================
// Additional Configuration
// =============================================================================

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;
