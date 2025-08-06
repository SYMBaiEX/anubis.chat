/**
 * Conversation Messages API
 * Handles message management within conversations
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { memoryStore } from '@/lib/memory/store';
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
  { params }: { params: { id: string } }
) {
  return aiRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress } = authReq.user;
        const conversationId = params.id;

        const conversation = memoryStore.getConversation(conversationId);
        if (!conversation) {
          return notFoundResponse('Conversation not found');
        }

        // Check ownership
        if (conversation.userId !== walletAddress) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Get linked memories
        const memories = memoryStore.getConversationMemories(conversationId);

        const response = successResponse({
          conversationId,
          messages: conversation.messages,
          memories,
          metadata: conversation.metadata,
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
  { params }: { params: { id: string } }
) {
  return aiRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress } = authReq.user;
        const conversationId = params.id;

        const conversation = memoryStore.getConversation(conversationId);
        if (!conversation) {
          return notFoundResponse('Conversation not found');
        }

        // Check ownership
        if (conversation.userId !== walletAddress) {
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

        const message = memoryStore.addMessage(
          conversationId,
          role,
          content,
          metadata
        );

        if (!message) {
          return NextResponse.json(
            { error: 'Failed to add message' },
            { status: 500 }
          );
        }

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
