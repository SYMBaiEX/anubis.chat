/**
 * Individual Chat Management Endpoint
 * Handles CRUD operations for specific chat sessions
 */

import { nanoid } from 'nanoid';
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
  // TODO: Implement Convex query
  // return await getChat(chatId, walletAddress);

  // Mock implementation
  if (chatId.length < 10) return null;

  return {
    _id: chatId,
    walletAddress,
    title: 'Mock Chat',
    description: 'A test conversation',
    model: 'gpt-4o',
    systemPrompt: 'You are a helpful AI assistant.',
    temperature: 0.7,
    maxTokens: 2000,
    isArchived: false,
    isPinned: false,
    messageCount: 15,
    tokensUsed: 2500,
    createdAt: Date.now() - 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 60 * 60 * 1000,
    lastMessageAt: Date.now() - 30 * 60 * 1000,
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

        console.log(`Retrieved chat ${chatId} for user ${walletAddress}`);

        const response = successResponse(chat);
        return addSecurityHeaders(response);
      } catch (error) {
        console.error('Get chat error:', error);
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

        // TODO: Update chat in Convex
        // const updatedChat = await updateChat(chatId, walletAddress, updates);

        // Mock updated chat
        const updatedChat: Chat = {
          ...existingChat,
          title: updates.title || existingChat.title,
          description: updates.description ?? existingChat.description,
          systemPrompt: updates.systemPrompt ?? existingChat.systemPrompt,
          temperature: updates.temperature ?? existingChat.temperature,
          maxTokens: updates.maxTokens ?? existingChat.maxTokens,
          isPinned: updates.isPinned ?? existingChat.isPinned,
          updatedAt: Date.now(),
        };

        console.log(`Chat updated: ${chatId} for user ${walletAddress}`);

        const response = successResponse(updatedChat);
        return addSecurityHeaders(response);
      } catch (error) {
        console.error('Update chat error:', error);
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

        // TODO: Delete chat and all associated messages in Convex
        // await deleteChat(chatId, walletAddress);

        console.log(`Chat deleted: ${chatId} for user ${walletAddress}`);

        const response = noContentResponse();
        return addSecurityHeaders(response);
      } catch (error) {
        console.error('Delete chat error:', error);
        return validationErrorResponse('Failed to delete chat');
      }
    });
  });
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  return addSecurityHeaders(response);
}
