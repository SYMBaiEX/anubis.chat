/**
 * Vector Store Management Endpoint
 * Handles CRUD operations for vector stores following OpenAI's pattern
 */

import { nanoid } from 'nanoid';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { api, convex } from '@/lib/database/convex';
import { type AuthenticatedRequest, withAuth } from '@/lib/middleware/auth';
import { aiRateLimit } from '@/lib/middleware/rate-limit';
import type {
  CreateVectorStoreRequest,
  VectorStore,
} from '@/lib/types/api-v2';
import {
  addSecurityHeaders,
  createdResponse,
  paginatedResponse,
  successResponse,
  validationErrorResponse,
} from '@/lib/utils/api-response';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('api/vector-stores');

// =============================================================================
// Request Validation
// =============================================================================

const createVectorStoreSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional(),
  fileIds: z.array(z.string()).optional(),
  expiresAfter: z
    .object({
      anchor: z.literal('last_active_at'),
      days: z.number().min(1).max(365),
    })
    .optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

const listVectorStoresSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  order: z.enum(['asc', 'desc']).default('desc'),
  after: z.string().optional(),
  before: z.string().optional(),
});

// =============================================================================
// GET /api/vector-stores - List vector stores
// =============================================================================

async function handleList(req: AuthenticatedRequest) {
  try {
    const url = new URL(req.url);
    const searchParams = Object.fromEntries(url.searchParams);

    // Validate query parameters
    const validation = listVectorStoresSchema.safeParse(searchParams);
    if (!validation.success) {
      log.warn('Invalid query parameters', { errors: validation.error.errors });
      return validationErrorResponse(validation.error);
    }

    const { limit, order, after, before } = validation.data;

    // Fetch vector stores from Convex
    const vectorStores = await convex.query(api.vectorStores.list, {
      walletAddress: req.user.walletAddress,
      limit,
      order,
      cursor: after || before,
    });

    // Transform to API format
    const apiVectorStores: VectorStore[] = vectorStores.items.map((vs) => ({
      id: vs._id,
      name: vs.name,
      description: vs.description,
      fileCounts: vs.fileCounts,
      status: vs.status,
      expiresAfter: vs.expiresAfter,
      expiresAt: vs.expiresAt,
      lastActiveAt: vs.lastActiveAt,
      metadata: vs.metadata || {},
      createdAt: vs.createdAt,
      updatedAt: vs.updatedAt,
      walletAddress: vs.walletAddress,
    }));

    log.info('Listed vector stores', {
      count: apiVectorStores.length,
      walletAddress: req.user.walletAddress,
    });

    return paginatedResponse(
      apiVectorStores,
      {
        cursor: vectorStores.cursor,
        nextCursor: vectorStores.nextCursor,
        hasMore: vectorStores.hasMore,
        limit,
      },
      {
        'X-Request-Id': nanoid(),
      }
    );
  } catch (error) {
    log.error('Failed to list vector stores', { error });
    throw error;
  }
}

// =============================================================================
// POST /api/vector-stores - Create vector store
// =============================================================================

async function handleCreate(req: AuthenticatedRequest) {
  try {
    const body = await req.json();

    // Validate request body
    const validation = createVectorStoreSchema.safeParse(body);
    if (!validation.success) {
      log.warn('Invalid request body', { errors: validation.error.errors });
      return validationErrorResponse(validation.error);
    }

    const data = validation.data as CreateVectorStoreRequest;

    // Create vector store in Convex
    const vectorStoreId = await convex.mutation(api.vectorStores.create, {
      walletAddress: req.user.walletAddress,
      name: data.name || `Vector Store ${new Date().toISOString()}`,
      description: data.description,
      fileIds: data.fileIds || [],
      expiresAfter: data.expiresAfter,
      metadata: data.metadata || {},
    });

    // Fetch the created vector store
    const vectorStore = await convex.query(api.vectorStores.get, {
      id: vectorStoreId,
      walletAddress: req.user.walletAddress,
    });

    if (!vectorStore) {
      throw new Error('Failed to create vector store');
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

    // Process files if provided
    if (data.fileIds && data.fileIds.length > 0) {
      // Queue file processing in background
      await convex.mutation(api.vectorStores.queueFileProcessing, {
        vectorStoreId,
        fileIds: data.fileIds,
        walletAddress: req.user.walletAddress,
      });
    }

    log.info('Created vector store', {
      id: apiVectorStore.id,
      name: apiVectorStore.name,
      walletAddress: req.user.walletAddress,
    });

    return createdResponse(apiVectorStore, {
      'X-Request-Id': nanoid(),
      'X-Vector-Store-Id': apiVectorStore.id,
    });
  } catch (error) {
    log.error('Failed to create vector store', { error });
    throw error;
  }
}

// =============================================================================
// Main Handler
// =============================================================================

async function handler(req: AuthenticatedRequest) {
  // Apply rate limiting
  const rateLimitResult = await aiRateLimit(req);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleList(req);
      case 'POST':
        return await handleCreate(req);
      default:
        return new NextResponse('Method not allowed', { status: 405 });
    }
  } catch (error) {
    log.error('Vector store operation failed', { error, method: req.method });
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
      {
        status: 500,
        headers: addSecurityHeaders({
          'X-Request-Id': nanoid(),
        }),
      }
    );
  }
}

export const GET = withAuth(handler);
export const POST = withAuth(handler);