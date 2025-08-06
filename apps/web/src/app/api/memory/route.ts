/**
 * Memory Management API
 * Handles memory creation, retrieval, and search
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

const createMemorySchema = z.object({
  type: z.enum(['conversation', 'fact', 'preference', 'context']),
  content: z.string().min(1).max(5000),
  metadata: z.record(z.string(), z.any()).optional(),
});

const searchMemorySchema = z.object({
  query: z.string().min(1).max(500),
  type: z.enum(['conversation', 'fact', 'preference', 'context']).optional(),
  limit: z.coerce.number().min(1).max(100).default(10),
});

// =============================================================================
// Route Handlers
// =============================================================================

/**
 * GET /api/memory - Get user memories or search
 */
export async function GET(request: NextRequest) {
  return aiRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress } = authReq.user;
        const { searchParams } = new URL(req.url);

        const query = searchParams.get('query');
        const type = searchParams.get('type');
        const limit = searchParams.get('limit');

        if (query) {
          // Search memories
          const validation = searchMemorySchema.safeParse({
            query,
            type,
            limit,
          });

          if (!validation.success) {
            return validationErrorResponse(
              'Invalid search parameters',
              validation.error.flatten().fieldErrors
            );
          }

          const memories = memoryStore.searchMemories(
            walletAddress,
            validation.data.query,
            validation.data.limit
          );

          const response = successResponse({
            memories,
            count: memories.length,
          });

          return addSecurityHeaders(response);
        }
        // Get all memories
        const memories = memoryStore.getUserMemories(
          walletAddress,
          type as any
        );

        const response = successResponse({
          memories,
          count: memories.length,
        });

        return addSecurityHeaders(response);
      } catch (error) {
        console.error('Get memories error:', error);
        const response = NextResponse.json(
          { error: 'Failed to retrieve memories' },
          { status: 500 }
        );
        return addSecurityHeaders(response);
      }
    });
  });
}

/**
 * POST /api/memory - Create a new memory
 */
export async function POST(request: NextRequest) {
  return aiRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress } = authReq.user;
        const body = await req.json();

        const validation = createMemorySchema.safeParse(body);
        if (!validation.success) {
          return validationErrorResponse(
            'Invalid memory data',
            validation.error.flatten().fieldErrors
          );
        }

        const { type, content, metadata } = validation.data;

        const memory = memoryStore.addMemory(
          walletAddress,
          type,
          content,
          metadata
        );

        console.log(`Created memory ${memory.id} for user ${walletAddress}`);

        const response = createdResponse(memory);
        return addSecurityHeaders(response);
      } catch (error) {
        console.error('Create memory error:', error);
        const response = NextResponse.json(
          { error: 'Failed to create memory' },
          { status: 500 }
        );
        return addSecurityHeaders(response);
      }
    });
  });
}

/**
 * PATCH /api/memory/:id - Update a memory
 */
export async function PATCH(request: NextRequest) {
  return aiRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress } = authReq.user;

        // Extract memory ID from URL
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        const memoryId = pathParts[pathParts.length - 1];

        if (!memoryId || memoryId === 'memory') {
          return validationErrorResponse('Memory ID is required', {});
        }

        const body = await req.json();
        const { content, metadata } = body;

        if (!(content || metadata)) {
          return validationErrorResponse('Content or metadata is required', {});
        }

        // Check if memory exists and belongs to user
        const existingMemory = memoryStore.getMemory(memoryId);
        if (!existingMemory) {
          return notFoundResponse('Memory not found');
        }

        if (existingMemory.userId !== walletAddress) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const updatedMemory = memoryStore.updateMemory(
          memoryId,
          content || existingMemory.content,
          metadata
        );

        if (!updatedMemory) {
          return notFoundResponse('Memory not found');
        }

        console.log(`Updated memory ${memoryId} for user ${walletAddress}`);

        const response = successResponse(updatedMemory);
        return addSecurityHeaders(response);
      } catch (error) {
        console.error('Update memory error:', error);
        const response = NextResponse.json(
          { error: 'Failed to update memory' },
          { status: 500 }
        );
        return addSecurityHeaders(response);
      }
    });
  });
}

/**
 * DELETE /api/memory/:id - Delete a memory
 */
export async function DELETE(request: NextRequest) {
  return aiRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress } = authReq.user;

        // Extract memory ID from URL
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        const memoryId = pathParts[pathParts.length - 1];

        if (!memoryId || memoryId === 'memory') {
          return validationErrorResponse('Memory ID is required', {});
        }

        // Check if memory exists and belongs to user
        const existingMemory = memoryStore.getMemory(memoryId);
        if (!existingMemory) {
          return notFoundResponse('Memory not found');
        }

        if (existingMemory.userId !== walletAddress) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const deleted = memoryStore.deleteMemory(memoryId);
        if (!deleted) {
          return notFoundResponse('Memory not found');
        }

        console.log(`Deleted memory ${memoryId} for user ${walletAddress}`);

        const response = successResponse({
          message: 'Memory deleted successfully',
        });
        return addSecurityHeaders(response);
      } catch (error) {
        console.error('Delete memory error:', error);
        const response = NextResponse.json(
          { error: 'Failed to delete memory' },
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
