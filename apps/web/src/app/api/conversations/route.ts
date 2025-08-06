/**
 * Conversation Management API
 * Handles conversation creation, retrieval, and message management
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { memoryStore } from '@/lib/memory/store';
import { type AuthenticatedRequest, withAuth } from '@/lib/middleware/auth';
import { aiRateLimit } from '@/lib/middleware/rate-limit';
import {
  addSecurityHeaders,
  createdResponse,
  successResponse,
  validationErrorResponse,
} from '@/lib/utils/api-response';

// =============================================================================
// Request Validation
// =============================================================================

const createConversationSchema = z.object({
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const getConversationsSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
});

// =============================================================================
// Route Handlers
// =============================================================================

/**
 * GET /api/conversations - Get user conversations
 */
export async function GET(request: NextRequest) {
  return aiRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress } = authReq.user;
        const { searchParams } = new URL(req.url);

        const limit = searchParams.get('limit');

        const validation = getConversationsSchema.safeParse({
          limit,
        });

        if (!validation.success) {
          return validationErrorResponse(
            'Invalid query parameters',
            validation.error.flatten().fieldErrors
          );
        }

        const conversations = memoryStore
          .getUserConversations(walletAddress)
          .slice(0, validation.data.limit);

        const response = successResponse({
          conversations,
          count: conversations.length,
        });

        return addSecurityHeaders(response);
      } catch (error) {
        console.error('Get conversations error:', error);
        const response = NextResponse.json(
          { error: 'Failed to retrieve conversations' },
          { status: 500 }
        );
        return addSecurityHeaders(response);
      }
    });
  });
}

/**
 * POST /api/conversations - Create a new conversation
 */
export async function POST(request: NextRequest) {
  return aiRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress } = authReq.user;
        const body = await req.json();

        const validation = createConversationSchema.safeParse(body);
        if (!validation.success) {
          return validationErrorResponse(
            'Invalid conversation data',
            validation.error.flatten().fieldErrors
          );
        }

        const { metadata } = validation.data;

        const conversation = memoryStore.createConversation(
          walletAddress,
          metadata
        );

        console.log(
          `Created conversation ${conversation.id} for user ${walletAddress}`
        );

        const response = createdResponse(conversation);
        return addSecurityHeaders(response);
      } catch (error) {
        console.error('Create conversation error:', error);
        const response = NextResponse.json(
          { error: 'Failed to create conversation' },
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
