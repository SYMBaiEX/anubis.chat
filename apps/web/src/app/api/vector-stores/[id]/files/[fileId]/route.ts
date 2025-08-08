/**
 * Individual Vector Store File Resource Endpoint
 * Handles operations on specific files within vector stores
 */

import type { Id } from '@convex/_generated/dataModel';
import { nanoid } from 'nanoid';
import { type NextRequest, NextResponse } from 'next/server';
import { api, convex } from '@/lib/database/convex';
import { type AuthenticatedRequest, withAuth } from '@/lib/middleware/auth';
import { aiRateLimit } from '@/lib/middleware/rate-limit';
import type { VectorStoreFile } from '@/lib/types/api';
import {
  addSecurityHeaders,
  notFoundResponse,
  successResponse,
  validationErrorResponse,
} from '@/lib/utils/api-response';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('api/vector-stores/[id]/files/[fileId]');

// =============================================================================
// GET /api/vector-stores/[id]/files/[fileId] - Get specific file details
// =============================================================================

async function handleGet(
  req: AuthenticatedRequest,
  vectorStoreId: string,
  fileId: string
) {
  try {
    // Verify vector store ownership
    const vectorStore = await convex.query(api.vectorStores.get, {
      id: vectorStoreId as Id<'vectorStores'>,
      walletAddress: req.user.walletAddress,
    });

    if (!vectorStore) {
      return notFoundResponse('Vector store not found');
    }

    // Fetch specific file
    const file = await convex.query(api.vectorStoreFiles.getByFileId, {
      vectorStoreId: vectorStoreId as Id<'vectorStores'>,
      fileId,
      walletAddress: req.user.walletAddress,
    });

    if (!file) {
      return notFoundResponse('File not found in vector store');
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

    log.info('Retrieved vector store file', {
      vectorStoreId,
      fileId,
      walletAddress: req.user.walletAddress,
    });

    const response = successResponse(apiFile, nanoid());
    response.headers.set('X-Vector-Store-Id', vectorStoreId);
    response.headers.set('X-File-Id', fileId);
    return response;
  } catch (error) {
    log.error('Failed to get vector store file', {
      error,
      vectorStoreId,
      fileId,
    });
    throw error;
  }
}

// =============================================================================
// DELETE /api/vector-stores/[id]/files/[fileId] - Remove specific file
// =============================================================================

async function handleDelete(
  req: AuthenticatedRequest,
  vectorStoreId: string,
  fileId: string
) {
  try {
    // Verify vector store ownership
    const vectorStore = await convex.query(api.vectorStores.get, {
      id: vectorStoreId as Id<'vectorStores'>,
      walletAddress: req.user.walletAddress,
    });

    if (!vectorStore) {
      return notFoundResponse('Vector store not found');
    }

    // Verify file exists in vector store
    const file = await convex.query(api.vectorStoreFiles.getByFileId, {
      vectorStoreId: vectorStoreId as Id<'vectorStores'>,
      fileId,
      walletAddress: req.user.walletAddress,
    });

    if (!file) {
      return notFoundResponse('File not found in vector store');
    }

    // Delete file from vector store
    await convex.mutation(api.vectorStoreFiles.deleteFile, {
      vectorStoreId: vectorStoreId as Id<'vectorStores'>,
      fileId,
      walletAddress: req.user.walletAddress,
    });

    log.info('Removed file from vector store', {
      vectorStoreId,
      fileId,
      walletAddress: req.user.walletAddress,
    });

    const response = successResponse(
      {
        id: fileId,
        deleted: true,
      },
      nanoid()
    );
    response.headers.set('X-Vector-Store-Id', vectorStoreId);
    response.headers.set('X-File-Id', fileId);
    return response;
  } catch (error) {
    log.error('Failed to remove file from vector store', {
      error,
      vectorStoreId,
      fileId,
    });
    throw error;
  }
}

// =============================================================================
// Main Handler
// =============================================================================

async function handler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const { id: vectorStoreId, fileId } = await params;

  if (!vectorStoreId) {
    return validationErrorResponse('Vector store ID is required', {
      id: ['Vector store ID is required'],
    });
  }

  if (!fileId) {
    return validationErrorResponse('File ID is required', {
      fileId: ['File ID is required'],
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, vectorStoreId, fileId);
      case 'DELETE':
        return await handleDelete(req, vectorStoreId, fileId);
      default:
        return new NextResponse('Method not allowed', { status: 405 });
    }
  } catch (error) {
    log.error('Vector store file operation failed', {
      error,
      method: req.method,
      vectorStoreId,
      fileId,
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
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; fileId: string }> }
) {
  return aiRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      const response = await handler(authReq, context);
      return addSecurityHeaders(response);
    });
  });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; fileId: string }> }
) {
  return aiRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      const response = await handler(authReq, context);
      return addSecurityHeaders(response);
    });
  });
}
