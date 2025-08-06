/**
 * Chat Messages Endpoint with AI Streaming
 * Handles message creation and AI streaming responses
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { streamText, convertToModelMessages } from 'ai';
import { openai } from '@ai-sdk/openai';
import { withAuth, type AuthenticatedRequest } from '@/lib/middleware/auth';
import { messageRateLimit } from '@/lib/middleware/rate-limit';
import { 
  successResponse,
  createdResponse,
  notFoundResponse,
  validationErrorResponse,
  paginatedResponse,
  addSecurityHeaders 
} from '@/lib/utils/api-response';
import type { ChatMessage, SendMessageRequest } from '@/lib/types/api';
import { nanoid } from 'nanoid';

// =============================================================================
// Request Validation
// =============================================================================

const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(10000, 'Message must be 10000 characters or less'),
  role: z.enum(['user']).default('user'),
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

async function getChatMessages(chatId: string, walletAddress: string, options: { cursor?: string; limit: number }) {
  // TODO: Implement Convex query to get messages
  // return await getMessages(chatId, walletAddress, options);
  
  // Mock implementation
  const mockMessages: ChatMessage[] = Array.from({ length: Math.min(options.limit, 10) }, (_, i) => ({
    _id: nanoid(12),
    chatId,
    walletAddress,
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: i % 2 === 0 ? 'User message content' : 'Assistant response content',
    tokenCount: Math.floor(Math.random() * 100) + 20,
    metadata: i % 2 === 1 ? {
      model: 'gpt-4o',
      finishReason: 'stop',
      usage: {
        promptTokens: 50,
        completionTokens: 75,
        totalTokens: 125,
      },
    } : undefined,
    createdAt: Date.now() - (i * 30 * 1000), // 30 seconds apart
  }));
  
  return {
    messages: mockMessages,
    hasMore: mockMessages.length === options.limit,
    nextCursor: mockMessages.length === options.limit ? mockMessages[mockMessages.length - 1]._id : undefined,
  };
}

// =============================================================================
// Route Handlers
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return messageRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress } = authReq.user;
        const { id: chatId } = params;
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
        const { messages, hasMore, nextCursor } = await getChatMessages(chatId, walletAddress, { cursor, limit });
        
        console.log(`Retrieved ${messages.length} messages for chat ${chatId}`);
        
        const response = paginatedResponse(messages, {
          cursor,
          nextCursor,
          hasMore,
          limit,
        });
        
        return addSecurityHeaders(response);
        
      } catch (error) {
        console.error('Get messages error:', error);
        return validationErrorResponse('Failed to retrieve messages');
      }
    });
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return messageRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress } = authReq.user;
        const { id: chatId } = params;
        
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
        
        const { content, role, stream, temperature, maxTokens } = validation.data;
        
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
          console.log(`Message created for chat ${chatId}: ${userMessage._id}`);
          const response = createdResponse(userMessage);
          return addSecurityHeaders(response);
        }
        
        // For streaming, get chat history for AI context
        const { messages: historyMessages } = await getChatMessages(chatId, walletAddress, { limit: 20 });
        
        // Convert to AI SDK format and add new user message
        const conversationHistory = [
          ...historyMessages.reverse().map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          {
            role: userMessage.role,
            content: userMessage.content,
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
                role: 'assistant',
                content: text,
                tokenCount: usage.completionTokens || Math.floor(text.length / 4),
                metadata: {
                  model: chat.model,
                  finishReason: finishReason || 'stop',
                  usage: {
                    promptTokens: usage.promptTokens || 0,
                    completionTokens: usage.completionTokens || 0,
                    totalTokens: usage.totalTokens || 0,
                  },
                },
                createdAt: Date.now(),
              };
              
              // await saveMessage(assistantMessage);
              // await updateChatLastMessage(chatId, assistantMessage);
              
              console.log(`AI response completed for chat ${chatId}: ${assistantMessage._id}`);
            } catch (error) {
              console.error('Failed to save AI response:', error);
            }
          },
        });
        
        console.log(`Streaming AI response for chat ${chatId}`);
        
        // Return streaming response
        const streamResponse = result.toUIMessageStreamResponse({
          originalMessages: conversationHistory,
        });
        
        return addSecurityHeaders(streamResponse);
        
      } catch (error) {
        console.error('Send message error:', error);
        return validationErrorResponse('Failed to send message');
      }
    });
  });
}

export async function OPTIONS() {
  const response = new Response(null, { status: 200 });
  return addSecurityHeaders(response);
}

// =============================================================================
// Additional Configuration
// =============================================================================

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;