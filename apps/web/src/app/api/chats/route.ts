/**
 * Chat Management Endpoint
 * Handles CRUD operations for chat sessions
 */

import { nanoid } from 'nanoid';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createModuleLogger } from '@/lib/utils/logger';

// Initialize logger
const log = createModuleLogger('api/chats');
import { type AuthenticatedRequest, withAuth } from '@/lib/middleware/auth';
import { chatRateLimit } from '@/lib/middleware/rate-limit';
import type { Chat, CreateChatRequest } from '@/lib/types/api';
import {
  addSecurityHeaders,
  createdResponse,
  paginatedResponse,
  successResponse,
  validationErrorResponse,
} from '@/lib/utils/api-response';

// =============================================================================
// Request Validation
// =============================================================================

const createChatSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be 100 characters or less'),
  model: z.string().min(1, 'AI model is required'),
  systemPrompt: z
    .string()
    .max(2000, 'System prompt must be 2000 characters or less')
    .optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(8000).optional(),
  initialMessage: z
    .string()
    .max(10_000, 'Initial message must be 10000 characters or less')
    .optional(),
});

const listChatsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  archived: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  search: z.string().max(100).optional(),
});

// =============================================================================
// Route Handlers
// =============================================================================

export async function GET(request: NextRequest) {
  return chatRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress } = authReq.user;
        const { searchParams } = new URL(req.url);

        // Parse and validate query parameters
        const queryValidation = listChatsSchema.safeParse({
          cursor: searchParams.get('cursor'),
          limit: searchParams.get('limit'),
          archived: searchParams.get('archived'),
          search: searchParams.get('search'),
        });

        if (!queryValidation.success) {
          return validationErrorResponse(
            'Invalid query parameters',
            queryValidation.error.flatten().fieldErrors
          );
        }

        const { cursor, limit, archived, search } = queryValidation.data;

        // TODO: Fetch chats from Convex with proper pagination
        // const chats = await getChats(walletAddress, { cursor, limit, archived, search });

        // Mock chat data
        const mockChats: Chat[] = Array.from(
          { length: Math.min(limit, 5) },
          (_, i) => ({
            _id: nanoid(12),
            walletAddress,
            title: search
              ? `Search: ${search} - Chat ${i + 1}`
              : `Chat ${i + 1}`,
            description: 'A conversation about various topics',
            model: i % 2 === 0 ? 'gpt-4o' : 'claude-3.5-sonnet',
            systemPrompt: 'You are a helpful AI assistant.',
            temperature: 0.7,
            maxTokens: 2000,
            isArchived: archived ?? false,
            isPinned: i === 0,
            messageCount: Math.floor(Math.random() * 50) + 5,
            tokensUsed: Math.floor(Math.random() * 5000) + 500,
            createdAt: Date.now() - i * 24 * 60 * 60 * 1000, // i days ago
            updatedAt: Date.now() - Math.random() * 24 * 60 * 60 * 1000,
            lastMessageAt: Date.now() - Math.random() * 24 * 60 * 60 * 1000,
          })
        );

        // Mock pagination info
        const hasMore = mockChats.length === limit;
        const nextCursor = hasMore
          ? mockChats[mockChats.length - 1]._id
          : undefined;

        log.apiRequest('GET /api/chats', {
          walletAddress,
          chatCount: mockChats.length,
          cursor,
          limit,
          hasMore,
        });

        const response = paginatedResponse(mockChats, {
          cursor,
          nextCursor,
          hasMore,
          limit,
        });

        return addSecurityHeaders(response);
      } catch (error) {
        log.error('Failed to list chats', {
          error,
          walletAddress,
          operation: 'list_chats',
        });
        return validationErrorResponse('Failed to retrieve chats');
      }
    });
  });
}

export async function POST(request: NextRequest) {
  return chatRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress } = authReq.user;

        // Parse and validate request body
        const body = await req.json();
        const validation = createChatSchema.safeParse(body);

        if (!validation.success) {
          return validationErrorResponse(
            'Invalid chat data',
            validation.error.flatten().fieldErrors
          );
        }

        const chatData = validation.data;

        // TODO: Create chat in Convex
        // const newChat = await createChat(walletAddress, chatData);

        // Mock new chat creation
        const newChat: Chat = {
          _id: nanoid(12),
          walletAddress,
          title: chatData.title,
          description: undefined,
          model: chatData.model,
          systemPrompt: chatData.systemPrompt,
          temperature: chatData.temperature || 0.7,
          maxTokens: chatData.maxTokens || 2000,
          isArchived: false,
          isPinned: false,
          messageCount: chatData.initialMessage ? 1 : 0,
          tokensUsed: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          lastMessageAt: chatData.initialMessage ? Date.now() : undefined,
        };

        // TODO: If initial message provided, create first message
        if (chatData.initialMessage) {
          // await createMessage(newChat._id, {
          //   role: 'user',
          //   content: chatData.initialMessage,
          //   walletAddress
          // });
        }

        log.dbOperation('chat_created', {
          chatId: newChat._id,
          walletAddress,
          model: newChat.model,
          title: newChat.title,
          temperature: newChat.temperature,
          maxTokens: newChat.maxTokens,
        });

        const response = createdResponse(newChat);
        return addSecurityHeaders(response);
      } catch (error) {
        log.error('Failed to create chat', {
          error,
          walletAddress,
          operation: 'create_chat',
        });
        return validationErrorResponse('Failed to create chat');
      }
    });
  });
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  return addSecurityHeaders(response);
}
