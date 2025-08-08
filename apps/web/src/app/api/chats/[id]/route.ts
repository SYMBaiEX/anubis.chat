/**
 * Individual Chat Management Endpoint
 * Handles CRUD operations for specific chat sessions
 */

import { api } from '@convex/_generated/api';
import { fetchMutation, fetchQuery } from 'convex/nextjs';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { type AuthenticatedRequest, withAuth } from '@/lib/middleware/auth';
import { chatRateLimit } from '@/lib/middleware/rate-limit';
import type { Chat, UpdateChatRequest } from '@/lib/types/api';
import {
  addSecurityHeaders,
  noContentResponse,
  notFoundResponse,
  successResponse,
  validationErrorResponse,
} from '@/lib/utils/api-response';
import { createModuleLogger } from '@/lib/utils/logger';

// =============================================================================
// Logger
// =============================================================================

const log = createModuleLogger('api/chats');

// =============================================================================
// Request Validation
// =============================================================================

const updateChatSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  systemPrompt: z.string().max(2000).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(8000).optional(),
  isPinned: z.boolean().optional(),
});

// =============================================================================
// Helper Functions
// =============================================================================

async function getChatById(
  chatId: string,
  walletAddress: string
): Promise<Chat | null> {
  const chat = await fetchQuery(api.chats.getById, { id: chatId as any });
  if (!chat || chat.ownerId !== walletAddress) return null;
  return {
    _id: chat._id,
    walletAddress: chat.ownerId,
    title: chat.title,
    description: chat.description,
    model: chat.model,
    systemPrompt: chat.systemPrompt,
    temperature: chat.temperature ?? 0.7,
    maxTokens: chat.maxTokens ?? 2000,
    isArchived: chat.isActive === false,
    isPinned: chat.isPinned ?? false,
    messageCount: chat.messageCount ?? 0,
    tokensUsed: chat.totalTokens ?? 0,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
    lastMessageAt: chat.lastMessageAt,
  };
}

// =============================================================================
// Route Handlers
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return chatRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress } = authReq.user;
        const { id: chatId } = await params;
        // Fetch chat by ID
        const chat = await getChatById(chatId, walletAddress);

        if (!chat) {
          return notFoundResponse('Chat not found');
        }

        log.apiRequest('GET /api/chats/[id]', {
          chatId,
          walletAddress,
          operation: 'get_chat',
        });

        const response = successResponse(chat);
        return addSecurityHeaders(response);
      } catch (error) {
        log.error('Failed to retrieve chat', {
          error,
          chatId,
          operation: 'get_chat',
        });
        return validationErrorResponse('Failed to retrieve chat');
      }
    });
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return chatRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress } = authReq.user;
        const { id: chatId } = await params;
        // Check if chat exists
        const existingChat = await getChatById(chatId, walletAddress);
        if (!existingChat) {
          return notFoundResponse('Chat not found');
        }

        // Parse and validate request body
        const body = await req.json();
        const validation = updateChatSchema.safeParse(body);

        if (!validation.success) {
          return validationErrorResponse(
            'Invalid chat data',
            validation.error.flatten().fieldErrors
          );
        }

        const updates = validation.data;

        // Update chat in Convex
        const patched = await fetchMutation(api.chats.update, {
          id: chatId as any,
          ownerId: walletAddress,
          title: updates.title,
          model: undefined,
          systemPrompt: updates.systemPrompt,
          temperature: updates.temperature,
          maxTokens: updates.maxTokens,
          isActive:
            updates.isArchived === undefined ? undefined : !updates.isArchived,
        });

        const updatedChat: Chat = {
          _id: patched._id,
          walletAddress: patched.ownerId,
          title: patched.title,
          description: patched.description,
          model: patched.model,
          systemPrompt: patched.systemPrompt,
          temperature: patched.temperature ?? 0.7,
          maxTokens: patched.maxTokens ?? 2000,
          isArchived: patched.isActive === false,
          isPinned: patched.isPinned ?? false,
          messageCount: patched.messageCount ?? 0,
          tokensUsed: patched.totalTokens ?? 0,
          createdAt: patched.createdAt,
          updatedAt: patched.updatedAt,
          lastMessageAt: patched.lastMessageAt,
        };

        log.dbOperation('chat_updated', {
          chatId,
          walletAddress,
          updatedFields: Object.keys(updates),
          hasTitle: !!updates.title,
          hasDescription: updates.description !== undefined,
          hasSystemPrompt: updates.systemPrompt !== undefined,
          temperature: updates.temperature,
          maxTokens: updates.maxTokens,
          isPinned: updates.isPinned,
        });

        const response = successResponse(updatedChat);
        return addSecurityHeaders(response);
      } catch (error) {
        log.error('Failed to update chat', {
          error,
          chatId,
          operation: 'update_chat',
        });
        return validationErrorResponse('Failed to update chat');
      }
    });
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return chatRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress } = authReq.user;
        const { id: chatId } = await params;
        // Check if chat exists
        const existingChat = await getChatById(chatId, walletAddress);
        if (!existingChat) {
          return notFoundResponse('Chat not found');
        }

        // Delete chat and all associated messages in Convex
        await fetchMutation(api.chats.remove, {
          id: chatId as any,
          ownerId: walletAddress,
        });

        log.dbOperation('chat_deleted', {
          chatId,
          walletAddress,
          operation: 'delete_chat',
        });

        const response = noContentResponse();
        return addSecurityHeaders(response);
      } catch (error) {
        log.error('Failed to delete chat', {
          error,
          chatId,
          operation: 'delete_chat',
        });
        return validationErrorResponse('Failed to delete chat');
      }
    });
  });
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  return addSecurityHeaders(response);
}
