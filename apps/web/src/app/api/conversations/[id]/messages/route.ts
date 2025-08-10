/**
 * Conversation Messages API
 * Handles message management within conversations
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { Id } from '@/../../packages/backend/convex/_generated/dataModel';
import { api, convex } from '@/lib/database/convex';
import { aiRateLimit } from '@/lib/middleware/rate-limit';
import { requireMessagesRemaining } from '@/lib/middleware/subscription-auth';
import { MessageRole } from '@/lib/types/api';
import {
  addSecurityHeaders,
  createdResponse,
  notFoundResponse,
  successResponse,
  validationErrorResponse,
} from '@/lib/utils/api-response';

// =============================================================================
// Request Validation
// =============================================================================

const toolResultSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  executionTime: z.number().optional(),
});

const toolSchema = z.object({
  id: z.string(),
  name: z.string(),
  args: z.unknown(),
  result: toolResultSchema.optional(),
});

const usageSchema = z.object({
  inputTokens: z.number(),
  outputTokens: z.number(),
  totalTokens: z.number(),
});

const messageMetadataSchema = z
  .object({
    model: z.string().optional(),
    finishReason: z.string().optional(),
    usage: usageSchema.optional(),
    tools: z.array(toolSchema).optional(),
    reasoning: z.string().optional(),
    citations: z.array(z.string()).optional(),
  })
  .strict();

// Note: Convex schema only supports 'user', 'assistant', 'system' roles
const supportedMessageRoles = [
  MessageRole.USER,
  MessageRole.ASSISTANT,
  MessageRole.SYSTEM,
] as const;

const addMessageSchema = z.object({
  role: z.enum([MessageRole.USER, MessageRole.ASSISTANT, MessageRole.SYSTEM]),
  content: z.string().min(1).max(50_000),
  metadata: messageMetadataSchema.optional(),
});

// =============================================================================
// Route Handlers
// =============================================================================

/**
 * GET /api/conversations/[id]/messages - Get conversation messages
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return aiRateLimit(request, async (req) => {
    return requireMessagesRemaining(req, async (authReq) => {
      try {
        const { walletAddress } = authReq.user;
        const { id: conversationId } = await params;

        // Get chat from Convex
        const chat = await convex.query(api.chats.getById, {
          id: conversationId as Id<'chats'>,
        });

        if (!chat) {
          return notFoundResponse('Conversation not found');
        }

        // Check ownership
        if (chat.ownerId !== walletAddress) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Get messages from Convex
        const messages = await convex.query(api.messages.getByChatId, {
          chatId: conversationId as Id<'chats'>,
        });

        const response = successResponse({
          conversationId,
          messages,
          chat,
        });

        return addSecurityHeaders(response);
      } catch (error) {
        const response = NextResponse.json(
          { error: 'Failed to retrieve messages' },
          { status: 500 }
        );
        return addSecurityHeaders(response);
      }
    });
  });
}

/**
 * POST /api/conversations/[id]/messages - Add message to conversation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return aiRateLimit(request, async (req) => {
    return requireMessagesRemaining(req, async (authReq) => {
      try {
        const { walletAddress } = authReq.user;
        const { id: conversationId } = await params;

        // Get chat from Convex to verify it exists and check ownership
        const chat = await convex.query(api.chats.getById, {
          id: conversationId as Id<'chats'>,
        });

        if (!chat) {
          return notFoundResponse('Conversation not found');
        }

        // Check ownership
        if (chat.ownerId !== walletAddress) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await req.json();
        const validation = addMessageSchema.safeParse(body);

        if (!validation.success) {
          return validationErrorResponse(
            'Invalid message data',
            validation.error.flatten().fieldErrors
          );
        }

        const { role, content, metadata } = validation.data;

        // Create message in Convex - the mutation returns the created message
        const message = await convex.mutation(api.messages.create, {
          chatId: conversationId as Id<'chats'>,
          walletAddress,
          role,
          content,
          metadata,
        });

        if (!message) {
          const response = NextResponse.json(
            { error: 'Failed to create message' },
            { status: 500 }
          );
          return addSecurityHeaders(response);
        }

        const response = createdResponse({
          conversationId,
          message,
        });

        return addSecurityHeaders(response);
      } catch (error) {
        const response = NextResponse.json(
          { error: 'Failed to add message' },
          { status: 500 }
        );
        return addSecurityHeaders(response);
      }
    });
  });
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  return addSecurityHeaders(response);
}
