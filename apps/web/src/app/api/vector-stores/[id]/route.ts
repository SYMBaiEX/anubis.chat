/**
 * Individual Vector Store Operations Endpoint
 * Handles GET, PATCH, DELETE operations for specific vector stores
 */

import type { Id } from '@convex/_generated/dataModel';
import { nanoid } from 'nanoid';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { api, convex } from '@/lib/database/convex';
import { type AuthenticatedRequest, withAuth } from '@/lib/middleware/auth';
import { aiRateLimit } from '@/lib/middleware/rate-limit';
import type { UpdateVectorStoreRequest, VectorStore } from '@/lib/types/api';
import {
  addSecurityHeaders,
  notFoundResponse,
  successResponse,
  validationErrorResponse,
} from '@/lib/utils/api-response';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('api/vector-stores/[id]');

// =============================================================================
// Request Validation
// =============================================================================

const updateVectorStoreSchema = z.object({
  name: z
    .string()
    .min(1, 'Name cannot be empty')
    .max(100, 'Name must be 100 characters or less')
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional(),
  expiresAfter: z
    .object({
      anchor: z.literal('last_active_at'),
      days: z.number().min(1).max(365),
    })
    .optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

// =============================================================================
// GET /api/vector-stores/[id] - Get vector store
// =============================================================================

async function handleGet(req: AuthenticatedRequest, vectorStoreId: string) {
  try {
    // Fetch vector store from Convex
    const vectorStore = await convex.query(api.vectorStores.get, {
      id: vectorStoreId as Id<'vectorStores'>,
      walletAddress: req.user.walletAddress,
    });

    if (!vectorStore) {
      log.warn('Vector store not found', {
        id: vectorStoreId,
        walletAddress: req.user.walletAddress,
      });
      return notFoundResponse('Vector store not found');
    }

    // Transform to API format
    const apiVectorStore: VectorStore = {
      id: vectorStore._id,
      name: vectorStore.name,
      description: vectorStore.description,
      fileCounts: vectorStore.fileCounts,
      status: vectorStore.status,
      expiresAfter: vectorStore.expiresAfter,
      expiresAt: vectorStore.expiresAt,
      lastActiveAt: vectorStore.lastActiveAt,
      metadata: vectorStore.metadata || {},
      createdAt: vectorStore.createdAt,
      updatedAt: vectorStore.updatedAt,
      walletAddress: vectorStore.walletAddress,
    };

    log.info('Retrieved vector store', {
      id: apiVectorStore.id,
      walletAddress: req.user.walletAddress,
    });

    const response = successResponse(apiVectorStore, nanoid());
    response.headers.set('X-Vector-Store-Id', apiVectorStore.id);
    return response;
  } catch (error) {
    log.error('Failed to get vector store', { error, id: vectorStoreId });
    throw error;
  }
}

// =============================================================================
// PATCH /api/vector-stores/[id] - Update vector store
// =============================================================================

async function handleUpdate(req: AuthenticatedRequest, vectorStoreId: string) {
  try {
    const body = await req.json();

    // Validate request body
    const validation = updateVectorStoreSchema.safeParse(body);
    if (!validation.success) {
      log.warn('Invalid request body', { errors: validation.error.issues });
      return validationErrorResponse(
        'Invalid request body',
        validation.error.flatten().fieldErrors
      );
    }

    const data = validation.data as UpdateVectorStoreRequest;

    // Update vector store in Convex
    await convex.mutation(api.vectorStores.update, {
      id: vectorStoreId as Id<'vectorStores'>,
      walletAddress: req.user.walletAddress,
      ...data,
    });

    // Fetch the updated vector store
    const vectorStore = await convex.query(api.vectorStores.get, {
      id: vectorStoreId as Id<'vectorStores'>,
      walletAddress: req.user.walletAddress,
    });

    if (!vectorStore) {
      return notFoundResponse('Vector store not found');
    }

    // Transform to API format
    const apiVectorStore: VectorStore = {
      id: vectorStore._id,
      name: vectorStore.name,
      description: vectorStore.description,
      fileCounts: vectorStore.fileCounts,
      status: vectorStore.status,
      expiresAfter: vectorStore.expiresAfter,
      expiresAt: vectorStore.expiresAt,
      lastActiveAt: vectorStore.lastActiveAt,
      metadata: vectorStore.metadata || {},
      createdAt: vectorStore.createdAt,
      updatedAt: vectorStore.updatedAt,
      walletAddress: vectorStore.walletAddress,
    };

    log.info('Updated vector store', {
      id: apiVectorStore.id,
      walletAddress: req.user.walletAddress,
      updates: Object.keys(data),
    });

    const response = successResponse(apiVectorStore, nanoid());
    response.headers.set('X-Vector-Store-Id', apiVectorStore.id);
    return response;
  } catch (error) {
    log.error('Failed to update vector store', { error, id: vectorStoreId });
    throw error;
  }
}

// =============================================================================
// DELETE /api/vector-stores/[id] - Delete vector store
// =============================================================================

async function handleDelete(req: AuthenticatedRequest, vectorStoreId: string) {
  try {
    // Check if vector store exists
    const vectorStore = await convex.query(api.vectorStores.get, {
      id: vectorStoreId as Id<'vectorStores'>,
      walletAddress: req.user.walletAddress,
    });

    if (!vectorStore) {
      log.warn('Vector store not found for deletion', {
        id: vectorStoreId,
        walletAddress: req.user.walletAddress,
      });
      return notFoundResponse('Vector store not found');
    }

    // Delete vector store and all associated files
    await convex.mutation(api.vectorStores.deleteVectorStore, {
      id: vectorStoreId as Id<'vectorStores'>,
      walletAddress: req.user.walletAddress,
    });

    log.info('Deleted vector store', {
      id: vectorStoreId,
      name: vectorStore.name,
      walletAddress: req.user.walletAddress,
    });

    return successResponse(
      {
        id: vectorStoreId,
        deleted: true,
      },
      nanoid()
    );
  } catch (error) {
    log.error('Failed to delete vector store', { error, id: vectorStoreId });
    throw error;
  }
}

// =============================================================================
// Main Handler
// =============================================================================

async function handler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: vectorStoreId } = await params;

  if (!vectorStoreId) {
    return validationErrorResponse('Vector store ID is required', {
      id: ['Vector store ID is required'],
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, vectorStoreId);
      case 'PATCH':
        return await handleUpdate(req, vectorStoreId);
      case 'DELETE':
        return await handleDelete(req, vectorStoreId);
      default:
        return new NextResponse('Method not allowed', { status: 405 });
    }
  } catch (error) {
    log.error('Vector store operation failed', {
      error,
      method: req.method,
      id: vectorStoreId,
    });
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VECTOR_STORE_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to process vector store operation',
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return aiRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      return handler(authReq, context);
    });
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return aiRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      return handler(authReq, context);
    });
  });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return aiRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      return handler(authReq, context);
    });
  });
}
