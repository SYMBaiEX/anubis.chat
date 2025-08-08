/**
 * Chat Management Endpoint
 * Handles CRUD operations for chat sessions
 */

import { nanoid } from 'nanoid';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createModuleLogger } from '@/lib/utils/logger';
import { fetchMutation, fetchQuery } from 'convex/nextjs';
import { api } from '@convex/_generated/api';

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
      const { walletAddress } = authReq.user;

      try {
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

        // Basic fetch from Convex; pagination can be added later (Convex supports take/skip via queries)
        const chats = await fetchQuery(api.chats.getByOwner, {
          ownerId: walletAddress,
          limit,
          isActive: archived === undefined ? undefined : !archived,
        });

        const normalized: Chat[] = (chats || []).map((c: any) => ({
          _id: c._id,
          walletAddress,
          title: c.title,
          description: c.description,
          model: c.model,
          systemPrompt: c.systemPrompt,
          temperature: c.temperature ?? 0.7,
          maxTokens: c.maxTokens ?? 2000,
          isArchived: c.isActive === false,
          isPinned: c.isPinned ?? false,
          messageCount: c.messageCount ?? 0,
          tokensUsed: c.totalTokens ?? 0,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          lastMessageAt: c.lastMessageAt,
        })).filter((c) =>
          search ? c.title.toLowerCase().includes(search.toLowerCase()) : true
        );

        const hasMore = normalized.length === limit; // approximate until proper cursor
        const nextCursor = hasMore ? normalized[normalized.length - 1]._id : undefined;

        log.apiRequest('GET /api/chats', {
          walletAddress,
          chatCount: normalized.length,
          cursor,
          limit,
          hasMore,
        });

        const response = paginatedResponse(normalized, {
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
      const { walletAddress } = authReq.user;

      try {
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

        const created = await fetchMutation(api.chats.create, {
          title: chatData.title,
          ownerId: walletAddress,
          model: chatData.model,
          systemPrompt: chatData.systemPrompt,
          temperature: chatData.temperature,
          maxTokens: chatData.maxTokens,
        });

        if (chatData.initialMessage) {
          await fetchMutation(api.messages.create, {
            chatId: created._id,
            walletAddress,
            role: 'user',
            content: chatData.initialMessage,
          });
        }

        log.dbOperation('chat_created', {
          chatId: created._id,
          walletAddress,
          model: created.model,
          title: created.title,
          temperature: created.temperature,
          maxTokens: created.maxTokens,
        });

        const response = createdResponse({
          _id: created._id,
          walletAddress,
          title: created.title,
          description: created.description,
          model: created.model,
          systemPrompt: created.systemPrompt,
          temperature: created.temperature ?? 0.7,
          maxTokens: created.maxTokens ?? 2000,
          isArchived: created.isActive === false,
          isPinned: created.isPinned ?? false,
          messageCount: created.messageCount ?? 0,
          tokensUsed: created.totalTokens ?? 0,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
          lastMessageAt: created.lastMessageAt,
        } as Chat);
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
