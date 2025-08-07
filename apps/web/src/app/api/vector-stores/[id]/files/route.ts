/**
 * Vector Store Files Management Endpoint
 * Handles adding, listing, and removing files from vector stores
 */

import { nanoid } from 'nanoid';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { api, convex } from '@/lib/database/convex';
import { type AuthenticatedRequest, withAuth } from '@/lib/middleware/auth';
import { aiRateLimit } from '@/lib/middleware/rate-limit';
import type {
  CreateVectorStoreFileRequest,
  VectorStoreFile,
} from '@/lib/types/api';
import {
  addSecurityHeaders,
  createdResponse,
  notFoundResponse,
  paginatedResponse,
  successResponse,
  validationErrorResponse,
} from '@/lib/utils/api-response';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('api/vector-stores/[id]/files');

// =============================================================================
// Request Validation
// =============================================================================

const createVectorStoreFileSchema = z.object({
  fileId: z.string().min(1, 'File ID is required'),
  chunkingStrategy: z
    .object({
      type: z.enum(['static', 'auto']),
      static: z
        .object({
          maxChunkSizeTokens: z.number().min(100).max(4096),
          chunkOverlapTokens: z.number().min(0).max(1000),
        })
        .optional(),
    })
    .optional(),
});

const listFilesSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  order: z.enum(['asc', 'desc']).default('desc'),
  after: z.string().optional(),
  before: z.string().optional(),
  filter: z.enum(['in_progress', 'completed', 'failed']).optional(),
});

// =============================================================================
// GET /api/vector-stores/[id]/files - List files in vector store
// =============================================================================

async function handleList(
  req: AuthenticatedRequest,
  vectorStoreId: string
) {
  try {
    const url = new URL(req.url);
    const searchParams = Object.fromEntries(url.searchParams);

    // Validate query parameters
    const validation = listFilesSchema.safeParse(searchParams);
    if (!validation.success) {
      log.warn('Invalid query parameters', { errors: validation.error.errors });
      return validationErrorResponse(validation.error);
    }

    const { limit, order, after, before, filter } = validation.data;

    // Verify vector store ownership
    const vectorStore = await convex.query(api.vectorStores.get, {
      id: vectorStoreId,
      walletAddress: req.user.walletAddress,
    });

    if (!vectorStore) {
      return notFoundResponse('Vector store not found');
    }

    // Fetch files from Convex
    const files = await convex.query(api.vectorStoreFiles.list, {
      vectorStoreId,
      walletAddress: req.user.walletAddress,
      limit,
      order,
      cursor: after || before,
      filter,
    });

    // Transform to API format
    const apiFiles: VectorStoreFile[] = files.items.map((file) => ({
      id: file._id,
      vectorStoreId: file.vectorStoreId,
      fileId: file.fileId,
      status: file.status,
      lastError: file.lastError,
      chunkingStrategy: file.chunkingStrategy,
      createdAt: file.createdAt,
    }));

    log.info('Listed vector store files', {
      vectorStoreId,
      count: apiFiles.length,
      walletAddress: req.user.walletAddress,
    });

    return paginatedResponse(
      apiFiles,
      {
        cursor: files.cursor,
        nextCursor: files.nextCursor,
        hasMore: files.hasMore,
        limit,
      },
      {
        'X-Request-Id': nanoid(),
        'X-Vector-Store-Id': vectorStoreId,
      }
    );
  } catch (error) {
    log.error('Failed to list vector store files', { error, vectorStoreId });
    throw error;
  }
}

// =============================================================================
// POST /api/vector-stores/[id]/files - Add file to vector store
// =============================================================================

async function handleCreate(
  req: AuthenticatedRequest,
  vectorStoreId: string
) {
  try {
    const body = await req.json();

    // Validate request body
    const validation = createVectorStoreFileSchema.safeParse(body);
    if (!validation.success) {
      log.warn('Invalid request body', { errors: validation.error.errors });
      return validationErrorResponse(validation.error);
    }

    const data = validation.data as CreateVectorStoreFileRequest;

    // Verify vector store ownership
    const vectorStore = await convex.query(api.vectorStores.get, {
      id: vectorStoreId,
      walletAddress: req.user.walletAddress,
    });

    if (!vectorStore) {
      return notFoundResponse('Vector store not found');
    }

    // Add file to vector store
    const fileId = await convex.mutation(api.vectorStoreFiles.create, {
      vectorStoreId,
      fileId: data.fileId,
      chunkingStrategy: data.chunkingStrategy || { type: 'auto' },
      walletAddress: req.user.walletAddress,
    });

    // Fetch the created file entry
    const file = await convex.query(api.vectorStoreFiles.get, {
      id: fileId,
      walletAddress: req.user.walletAddress,
    });

    if (!file) {
      throw new Error('Failed to create vector store file');
    }

    // Transform to API format
    const apiFile: VectorStoreFile = {
      id: file._id,
      vectorStoreId: file.vectorStoreId,
      fileId: file.fileId,
      status: file.status,
      lastError: file.lastError,
      chunkingStrategy: file.chunkingStrategy,
      createdAt: file.createdAt,
    };

    // Queue file processing
    await convex.mutation(api.vectorStores.queueFileProcessing, {
      vectorStoreId,
      fileIds: [data.fileId],
      walletAddress: req.user.walletAddress,
    });

    log.info('Added file to vector store', {
      vectorStoreId,
      fileId: data.fileId,
      walletAddress: req.user.walletAddress,
    });

    return createdResponse(apiFile, {
      'X-Request-Id': nanoid(),
      'X-Vector-Store-Id': vectorStoreId,
      'X-File-Id': apiFile.fileId,
    });
  } catch (error) {
    log.error('Failed to add file to vector store', { error, vectorStoreId });
    throw error;
  }
}

// =============================================================================
// DELETE /api/vector-stores/[id]/files/[fileId] - Remove file from vector store
// =============================================================================

async function handleDelete(
  req: AuthenticatedRequest,
  vectorStoreId: string
) {
  try {
    // Extract fileId from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const fileId = pathParts[pathParts.length - 1];

    if (!fileId || fileId === 'files') {
      return validationErrorResponse(
        new z.ZodError([
          {
            code: 'custom',
            path: ['fileId'],
            message: 'File ID is required in the URL path',
          },
        ])
      );
    }

    // Verify vector store ownership
    const vectorStore = await convex.query(api.vectorStores.get, {
      id: vectorStoreId,
      walletAddress: req.user.walletAddress,
    });

    if (!vectorStore) {
      return notFoundResponse('Vector store not found');
    }

    // Delete file from vector store
    await convex.mutation(api.vectorStoreFiles.delete, {
      vectorStoreId,
      fileId,
      walletAddress: req.user.walletAddress,
    });

    log.info('Removed file from vector store', {
      vectorStoreId,
      fileId,
      walletAddress: req.user.walletAddress,
    });

    return successResponse(
      {
        id: fileId,
        deleted: true,
      },
      {
        'X-Request-Id': nanoid(),
        'X-Vector-Store-Id': vectorStoreId,
      }
    );
  } catch (error) {
    log.error('Failed to remove file from vector store', {
      error,
      vectorStoreId,
    });
    throw error;
  }
}

// =============================================================================
// Main Handler
// =============================================================================

async function handler(
  req: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  // Apply rate limiting
  const rateLimitResult = await aiRateLimit(req);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  const vectorStoreId = params.id;

  if (!vectorStoreId) {
    return validationErrorResponse(
      new z.ZodError([
        {
          code: 'custom',
          path: ['id'],
          message: 'Vector store ID is required',
        },
      ])
    );
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleList(req, vectorStoreId);
      case 'POST':
        return await handleCreate(req, vectorStoreId);
      case 'DELETE':
        return await handleDelete(req, vectorStoreId);
      default:
        return new NextResponse('Method not allowed', { status: 405 });
    }
  } catch (error) {
    log.error('Vector store file operation failed', {
      error,
      method: req.method,
      vectorStoreId,
    });
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VECTOR_STORE_FILE_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to process vector store file operation',
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
export const DELETE = withAuth(handler);