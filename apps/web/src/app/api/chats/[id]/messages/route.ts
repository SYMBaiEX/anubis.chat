/**
 * Chat Messages Endpoint with AI Streaming
 * Handles message creation and AI streaming responses
 */

import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, streamText } from 'ai';
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
import { fetchMutation, fetchQuery } from 'convex/nextjs';
import { api } from '@convex/_generated/api';

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
  const chat = await fetchQuery(api.chats.getById, { id: chatId as any });
  if (!chat || chat.ownerId !== walletAddress) return null;
  return {
    _id: chat._id,
    walletAddress: chat.ownerId,
    model: chat.model,
    systemPrompt: chat.systemPrompt,
    temperature: chat.temperature ?? 0.7,
    maxTokens: chat.maxTokens ?? 2000,
  };
}

async function getChatMessages(
  chatId: string,
  walletAddress: string,
  options: { cursor?: string; limit: number }
) {
  const messages = await fetchQuery(api.messages.getByChatId, {
    chatId: chatId as any,
    limit: options.limit,
  });
  const normalized: ChatMessage[] = (messages || []).map((m: any) => ({
    _id: m._id,
    chatId,
    walletAddress: m.walletAddress,
    role: m.role,
    content: m.content,
    tokenCount: m.tokenCount ?? 0,
    metadata: m.metadata,
    createdAt: m.createdAt,
  }));
  return {
    messages: normalized,
    hasMore: false,
    nextCursor: undefined,
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
      try {
        const { walletAddress } = authReq.user;
        const { id: chatId } = await params;
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
          chatId,
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
      try {
        const { walletAddress } = authReq.user;
        const { id: chatId } = await params;
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
        const createdUserMessage = await fetchMutation(api.messages.create, {
          chatId: chatId as any,
          walletAddress,
          role: role as any,
          content,
        });

        // If not streaming, return the saved message
        if (!stream) {
          log.dbOperation('message_created', {
            messageId: createdUserMessage._id,
            chatId,
            walletAddress,
            role,
            tokenCount: createdUserMessage.tokenCount ?? 0,
          });
          const response = createdResponse({
            _id: createdUserMessage._id,
            chatId,
            walletAddress,
            role,
            content,
            tokenCount: createdUserMessage.tokenCount ?? 0,
            createdAt: createdUserMessage.createdAt,
          } satisfies ChatMessage);
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
            id: createdUserMessage._id,
            role: createdUserMessage.role as 'user' | 'assistant' | 'system',
            parts: [{ type: 'text' as const, text: createdUserMessage.content }],
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
              const saved = await fetchMutation(api.messages.create, {
                chatId: chatId as any,
                walletAddress,
                role: 'assistant' as any,
                content: text,
                metadata: {
                  model: chat.model,
                  finishReason: finishReason || 'stop',
                  usage: {
                    inputTokens: usage.inputTokens || 0,
                    outputTokens: usage.outputTokens || 0,
                    totalTokens: usage.totalTokens || 0,
                  },
                },
              });

              log.dbOperation('ai_message_created', {
                messageId: saved._id,
                chatId,
                walletAddress,
                model: chat.model,
                tokenCount: saved.tokenCount ?? 0,
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
          chatId,
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
