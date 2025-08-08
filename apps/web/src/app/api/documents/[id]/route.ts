/**
 * Individual Document API Endpoint
 * Handles getting, updating, and deleting specific documents
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { api, convex } from '@/lib/database/convex';
import { type AuthenticatedRequest, withAuth } from '@/lib/middleware/auth';
import { generalRateLimit } from '@/lib/middleware/rate-limit';
import type { Document, DocumentUpdateResponse } from '@/lib/types/documents';
import {
  addSecurityHeaders,
  notFoundResponse,
  successResponse,
  validationErrorResponse,
} from '@/lib/utils/api-response';
import { createModuleLogger } from '@/lib/utils/logger';

// =============================================================================
// Logger
// =============================================================================

const log = createModuleLogger('api/documents');

// =============================================================================
// Request Validation Schemas
// =============================================================================

const updateDocumentSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .optional(),
  content: z
    .string()
    .min(1, 'Content is required')
    .max(100_000, 'Content must be 100,000 characters or less')
    .optional(),
  metadata: z
    .object({
      source: z.string().optional(),
      author: z.string().optional(),
      tags: z.array(z.string()).optional(),
      category: z.string().optional(),
      language: z.string().optional(),
    })
    .optional(),
});

// =============================================================================
// Route Handlers
// =============================================================================

/**
 * GET /api/documents/[id] - Get a specific document
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return generalRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress } = authReq.user;
        const { id: documentId } = await params;
        // Check if document exists and user can access it
        const document = await convex.query(api.documents.getById, {
          id: documentId as any,
        });
        if (!document) {
          return notFoundResponse('Document not found');
        }
        if (document.ownerId !== walletAddress) {
          return notFoundResponse('Document not found');
        }

        log.apiRequest('GET /api/documents/[id]', {
          documentId,
          walletAddress,
          operation: 'get_document',
        });

        const response = successResponse(document);
        return addSecurityHeaders(response);
      } catch (error) {
        log.error('Failed to retrieve document', {
          error,
          documentId,
          operation: 'get_document',
        });
        const response = NextResponse.json(
          { error: 'Failed to retrieve document' },
          { status: 500 }
        );
        return addSecurityHeaders(response);
      }
    });
  });
}

/**
 * PUT /api/documents/[id] - Update a specific document
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return generalRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress } = authReq.user;
        const { id: documentId } = await params;
        // Check if document exists and user can access it
        const existing = await convex.query(api.documents.getById, {
          id: documentId as any,
        });
        if (!existing || existing.ownerId !== walletAddress) {
          return notFoundResponse('Document not found');
        }

        // Parse and validate request body
        const body = await req.json();
        const validation = updateDocumentSchema.safeParse(body);

        if (!validation.success) {
          return validationErrorResponse(
            'Invalid document update request',
            validation.error.flatten().fieldErrors
          );
        }

        const { title, content, metadata } = validation.data;

        // Prepare updates
        const updates: Partial<Document> = {
          ...(title && { title }),
          ...(content && { content }),
          metadata: {
            ...metadata,
            ...(content && {
              wordCount: content
                .trim()
                .split(/\s+/)
                .filter((word) => word.length > 0).length,
              characterCount: content.length,
            }),
          },
          updatedAt: Date.now(),
        };

        const patched = await convex.mutation(api.documents.update, {
          id: documentId as any,
          ownerId: walletAddress,
          title: updates.title,
          content: updates.content,
          metadata: updates.metadata,
        });

        log.dbOperation('document_updated', {
          documentId,
          walletAddress,
          hasTitle: !!title,
          hasContent: !!content,
          hasMetadata: !!metadata,
          wordCount: updates.metadata?.wordCount,
          characterCount: updates.metadata?.characterCount,
        });

        const responseData: DocumentUpdateResponse = {
          document: {
            id: patched._id,
            title: patched.title,
            content: patched.content,
            type: patched.type,
            ownerId: patched.ownerId,
            metadata: patched.metadata,
            createdAt: patched.createdAt,
            updatedAt: patched.updatedAt,
          },
          message: 'Document updated successfully',
        };

        const response = successResponse(responseData);
        return addSecurityHeaders(response);
      } catch (error) {
        log.error('Failed to update document', {
          error,
          documentId,
          operation: 'update_document',
        });
        const response = NextResponse.json(
          { error: 'Failed to update document' },
          { status: 500 }
        );
        return addSecurityHeaders(response);
      }
    });
  });
}

/**
 * DELETE /api/documents/[id] - Delete a specific document
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return generalRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress } = authReq.user;
        const { id: documentId } = await params;
        // Check if document exists and user can access it
        const existing = await convex.query(api.documents.getById, {
          id: documentId as any,
        });
        if (!existing || existing.ownerId !== walletAddress) {
          return notFoundResponse('Document not found');
        }

        await convex.mutation(api.documents.remove, {
          id: documentId as any,
          ownerId: walletAddress,
        });

        log.dbOperation('document_deleted', {
          documentId,
          walletAddress,
          operation: 'delete_document',
        });

        const response = successResponse({
          message: 'Document deleted successfully',
          documentId,
        });
        return addSecurityHeaders(response);
      } catch (error) {
        log.error('Failed to delete document', {
          error,
          documentId,
          operation: 'delete_document',
        });
        const response = NextResponse.json(
          { error: 'Failed to delete document' },
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
