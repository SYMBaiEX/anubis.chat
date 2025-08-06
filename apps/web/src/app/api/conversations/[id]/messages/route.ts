/**
 * Conversation Messages API
 * Handles message management within conversations
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { convex, api } from '@/lib/database/convex';
import type { Id } from '@/../../packages/backend/convex/_generated/dataModel';
import { type AuthenticatedRequest, withAuth } from '@/lib/middleware/auth';
import { aiRateLimit } from '@/lib/middleware/rate-limit';
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

const addMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(50_000),
  metadata: z.record(z.string(), z.unknown()).optional(),
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
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
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
        console.error('Get messages error:', error);
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
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
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

        // Create message in Convex
        const messageId = await convex.mutation(api.messages.create, {
          chatId: conversationId as Id<'chats'>,
          walletAddress,
          role,
          content,
          metadata: metadata ? {
            model: metadata.model as string | undefined,
            finishReason: metadata.finishReason as string | undefined,
            usage: metadata.usage ? {
              inputTokens: metadata.usage.inputTokens as number,
              outputTokens: metadata.usage.outputTokens as number,
              totalTokens: metadata.usage.totalTokens as number,
            } : undefined,
            tools: metadata.tools as any,
            reasoning: metadata.reasoning as string | undefined,
            citations: metadata.citations as string[] | undefined,
          } : undefined,
        });

        // Get the created message to return
        const message = await convex.query(api.messages.getById, {
          id: messageId,
        });

        console.log(`Added message to conversation ${conversationId}`);

        const response = createdResponse({
          conversationId,
          message,
        });

        return addSecurityHeaders(response);
      } catch (error) {
        console.error('Add message error:', error);
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
