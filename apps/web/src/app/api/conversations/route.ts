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

const conversationMetadataSchema = z
  .object({
    title: z.string().max(200).optional(),
    description: z.string().max(500).optional(),
    tags: z.array(z.string().max(50)).max(10).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    category: z.string().max(100).optional(),
  })
  .strict();

const createConversationSchema = z.object({
  metadata: conversationMetadataSchema.optional(),
});

const getConversationsSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
  offset: z.coerce.number().min(0).default(0),
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
        const cursor = searchParams.get('cursor');
        const offset = searchParams.get('offset');

        const validation = getConversationsSchema.safeParse({
          limit,
          cursor,
          offset,
        });

        if (!validation.success) {
          return validationErrorResponse(
            'Invalid query parameters',
            validation.error.flatten().fieldErrors
          );
        }

        // Use efficient pagination from memory store
        const result = memoryStore.getUserConversationsPaginated(
          walletAddress,
          {
            limit: validation.data.limit,
            offset: validation.data.offset,
            cursor: validation.data.cursor,
          }
        );

        const response = successResponse({
          conversations: result.conversations,
          pagination: result.pagination,
        });

        return addSecurityHeaders(response);
      } catch (error) {
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

        const response = createdResponse(conversation);
        return addSecurityHeaders(response);
      } catch (error) {
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
