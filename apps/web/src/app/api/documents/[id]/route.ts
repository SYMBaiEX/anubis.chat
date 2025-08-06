/**
 * Individual Document API Endpoint
 * Handles getting, updating, and deleting specific documents
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStorage } from '@/lib/database/storage';
import { type AuthenticatedRequest, withAuth } from '@/lib/middleware/auth';
import { generalRateLimit } from '@/lib/middleware/rate-limit';
import type { Document, DocumentUpdateResponse } from '@/lib/types/documents';
import {
  addSecurityHeaders,
  notFoundResponse,
  successResponse,
  validationErrorResponse,
} from '@/lib/utils/api-response';

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
  { params }: { params: { id: string } }
) {
  return generalRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress } = authReq.user;
        const { id: documentId } = params;

        // Check if document exists and user can access it
        const storage = getStorage();
        if (!(await storage.canAccessDocument(walletAddress, documentId))) {
          return notFoundResponse('Document not found');
        }

        const document = await storage.getDocument(documentId);
        if (!document) {
          return notFoundResponse('Document not found');
        }

        console.log(`Document retrieved: ${documentId} by ${walletAddress}`);

        const response = successResponse(document);
        return addSecurityHeaders(response);
      } catch (error) {
        console.error('Get document error:', error);
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
  { params }: { params: { id: string } }
) {
  return generalRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress } = authReq.user;
        const { id: documentId } = params;

        // Check if document exists and user can access it
        const storage = getStorage();
        if (!(await storage.canAccessDocument(walletAddress, documentId))) {
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
              wordCount: content.trim().split(/\s+/).filter(word => word.length > 0).length,
              characterCount: content.length,
            }),
          },
          updatedAt: Date.now(),
        };

        // Update document using storage layer
        const updatedDocument = await storage.updateDocument(
          documentId,
          updates
        );
        if (!updatedDocument) {
          return notFoundResponse('Document not found');
        }

        console.log(`Document updated: ${documentId} by ${walletAddress}`);

        const responseData: DocumentUpdateResponse = {
          document: updatedDocument,
          message: 'Document updated successfully',
        };

        const response = successResponse(responseData);
        return addSecurityHeaders(response);
      } catch (error) {
        console.error('Update document error:', error);
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
  { params }: { params: { id: string } }
) {
  return generalRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress } = authReq.user;
        const { id: documentId } = params;

        // Check if document exists and user can access it
        const storage = getStorage();
        if (!(await storage.canAccessDocument(walletAddress, documentId))) {
          return notFoundResponse('Document not found');
        }

        // Remove document using storage layer
        await storage.deleteDocument(documentId);
        await storage.removeDocumentFromUser(walletAddress, documentId);

        console.log(`Document deleted: ${documentId} by ${walletAddress}`);

        const response = successResponse({
          message: 'Document deleted successfully',
          documentId,
        });
        return addSecurityHeaders(response);
      } catch (error) {
        console.error('Delete document error:', error);
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
