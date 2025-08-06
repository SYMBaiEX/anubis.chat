/**
 * Memory Management API
 * Handles memory creation, retrieval, and search
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

const createMemorySchema = z.object({
  type: z.enum(['fact', 'preference', 'skill', 'goal', 'context']),
  content: z.string().min(1).max(5000),
  metadata: z.record(z.string(), z.any()).optional(),
});

const searchMemorySchema = z.object({
  query: z.string().min(1).max(500),
  type: z.enum(['fact', 'preference', 'skill', 'goal', 'context']).optional(),
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

          const memories = await convex.query(api.memories.searchMemories, {
            userId: walletAddress,
            query: validation.data.query,
            limit: validation.data.limit,
          });

          const response = successResponse({
            memories,
            count: memories.length,
          });

          return addSecurityHeaders(response);
        }
        // Get all memories
        const memories = await convex.query(api.memories.getUserMemories, {
          userId: walletAddress,
          type: type as any,
        });

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

        const memoryId = await convex.mutation(api.memories.create, {
          userId: walletAddress,
          content,
          type,
          tags: metadata?.tags as string[] | undefined,
          importance: metadata?.importance as number | undefined,
        });

        // Get the created memory to return
        const memory = await convex.query(api.memories.getById, {
          id: memoryId,
        });

        console.log(`Created memory ${memoryId} for user ${walletAddress}`);

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
        const existingMemory = await convex.query(api.memories.getById, {
          id: memoryId as Id<'memories'>,
        });
        
        if (!existingMemory) {
          return notFoundResponse('Memory not found');
        }

        if (existingMemory.userId !== walletAddress) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Update the memory
        await convex.mutation(api.memories.update, {
          id: memoryId as Id<'memories'>,
          content: content || existingMemory.content,
          tags: metadata?.tags as string[] | undefined,
          importance: metadata?.importance as number | undefined,
        });

        // Get the updated memory to return
        const updatedMemory = await convex.query(api.memories.getById, {
          id: memoryId as Id<'memories'>,
        });

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
        const existingMemory = await convex.query(api.memories.getById, {
          id: memoryId as Id<'memories'>,
        });
        
        if (!existingMemory) {
          return notFoundResponse('Memory not found');
        }

        if (existingMemory.userId !== walletAddress) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Delete the memory
        await convex.mutation(api.memories.remove, {
          id: memoryId as Id<'memories'>,
        });

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
