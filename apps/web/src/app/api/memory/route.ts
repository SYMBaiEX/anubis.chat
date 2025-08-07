/**
 * Memory Management API
 * Handles memory creation, retrieval, and search
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { Id } from '@/../../packages/backend/convex/_generated/dataModel';
import { api, convex } from '@/lib/database/convex';
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

const memoryMetadataSchema = z
  .object({
    tags: z.array(z.string().max(50)).max(10).optional(),
    importance: z.number().min(0).max(1).optional(),
    sourceId: z.string().optional(),
    sourceType: z.enum(['chat', 'document', 'agent', 'workflow']).optional(),
  })
  .strict();

const createMemorySchema = z.object({
  type: z.enum(['fact', 'preference', 'skill', 'goal', 'context']),
  content: z.string().min(1).max(5000),
  metadata: memoryMetadataSchema.optional(),
});

const searchMemorySchema = z.object({
  query: z.string().min(1).max(500),
  type: z.enum(['fact', 'preference', 'skill', 'goal', 'context']).optional(),
  limit: z.coerce.number().min(1).max(100).default(10),
});

const updateMemorySchema = z
  .object({
    content: z.string().min(1).max(5000).optional(),
    metadata: memoryMetadataSchema.optional(),
  })
  .refine((data) => data.content || data.metadata, {
    message: 'Content or metadata is required',
  });

const getMemoriesSchema = z.object({
  type: z.enum(['fact', 'preference', 'skill', 'goal', 'context']).optional(),
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

        // Validate the type parameter for get all memories
        const getValidation = getMemoriesSchema.safeParse({ type });
        if (!getValidation.success) {
          return validationErrorResponse(
            'Invalid memory type',
            getValidation.error.flatten().fieldErrors
          );
        }

        // Get all memories
        const memories = await convex.query(api.memories.getUserMemories, {
          userId: walletAddress,
          type: getValidation.data.type,
        });

        const response = successResponse({
          memories,
          count: memories.length,
        });

        return addSecurityHeaders(response);
      } catch (error) {
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
          tags: metadata?.tags,
          importance: metadata?.importance,
        });

        // Get the created memory to return
        const memory = await convex.query(api.memories.getById, {
          id: memoryId,
        });

        const response = createdResponse(memory);
        return addSecurityHeaders(response);
      } catch (error) {
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

        const validation = updateMemorySchema.safeParse(body);
        if (!validation.success) {
          return validationErrorResponse(
            'Invalid update data',
            validation.error.flatten().fieldErrors
          );
        }

        const { content, metadata } = validation.data;

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
          tags: metadata?.tags,
          importance: metadata?.importance,
        });

        // Get the updated memory to return
        const updatedMemory = await convex.query(api.memories.getById, {
          id: memoryId as Id<'memories'>,
        });

        if (!updatedMemory) {
          return notFoundResponse('Memory not found');
        }

        const response = successResponse(updatedMemory);
        return addSecurityHeaders(response);
      } catch (error) {
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

        const response = successResponse({
          message: 'Memory deleted successfully',
        });
        return addSecurityHeaders(response);
      } catch (error) {
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
