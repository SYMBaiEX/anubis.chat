/**
 * Document Management API Endpoint
 * Handles document upload, storage, and retrieval for RAG system
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { type AuthenticatedRequest, withAuth } from '@/lib/middleware/auth';
import { generalRateLimit } from '@/lib/middleware/rate-limit';
import type {
  Document,
  DocumentListResponse,
  DocumentUploadResponse,
} from '@/lib/types/documents';
import {
  addSecurityHeaders,
  successResponse,
  validationErrorResponse,
} from '@/lib/utils/api-response';
import { createModuleLogger } from '@/lib/utils/logger';
import { api, convex } from '@/lib/database/convex';

// =============================================================================
// Logger
// =============================================================================

const log = createModuleLogger('api/documents');

// =============================================================================
// Request Validation Schemas
// =============================================================================

const uploadDocumentSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),
  content: z
    .string()
    .min(1, 'Content is required')
    .max(100_000, 'Content must be 100,000 characters or less'),
  type: z.enum(['text', 'markdown', 'pdf', 'url']).default('text'),
  metadata: z
    .object({
      source: z.string().optional(),
      author: z.string().optional(),
      tags: z.array(z.string()).optional(),
      category: z.string().optional(),
      language: z.string().default('en'),
    })
    .optional(),
});

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
 * GET /api/documents - List user's documents
 */
export async function GET(request: NextRequest) {
  return generalRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      const { walletAddress } = authReq.user;

      try {
        const { searchParams } = new URL(req.url);

        // Parse query parameters
        const page = Math.max(
          1,
          Number.parseInt(searchParams.get('page') || '1', 10)
        );
        const limit = Math.min(
          50,
          Math.max(1, Number.parseInt(searchParams.get('limit') || '10', 10))
        );
        const category = searchParams.get('category') || undefined;
        const search = searchParams.get('search') || undefined;

        // Fetch documents from Convex
        const { documents: docs, pagination } = await convex.query(
          api.documents.getByOwner,
          {
            ownerId: walletAddress,
            page,
            limit,
            category: category || undefined,
          }
        );

        // Basic search filter (Convex search endpoint is separate)
        const filtered = search
          ? (docs || []).filter(
              (d) =>
                d.title.toLowerCase().includes(search.toLowerCase()) ||
                d.content.toLowerCase().includes(search.toLowerCase())
            )
          : docs || [];

        const paginatedDocs: Document[] = filtered.map((d: any) => ({
          id: d._id,
          title: d.title,
          content: d.content,
          type: d.type,
          ownerId: d.ownerId,
          metadata: d.metadata,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
        }));

        log.apiRequest('GET /api/documents', {
          walletAddress,
          documentCount: paginatedDocs.length,
          total,
          page,
          limit,
          category,
          search,
        });

        const responseData: DocumentListResponse = {
          documents: paginatedDocs,
          pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: pagination.total,
            totalPages: pagination.totalPages,
            hasNext: pagination.hasNext,
            hasPrev: pagination.hasPrev,
          },
          filters: {
            category,
            search,
          },
        };

        const response = successResponse(responseData);
        return addSecurityHeaders(response);
      } catch (error) {
        log.error('Failed to retrieve documents', {
          error,
          walletAddress,
          operation: 'get_documents',
        });
        const response = NextResponse.json(
          { error: 'Failed to retrieve documents' },
          { status: 500 }
        );
        return addSecurityHeaders(response);
      }
    });
  });
}

/**
 * POST /api/documents - Upload/create a new document
 */
export async function POST(request: NextRequest) {
  return generalRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      const { walletAddress } = authReq.user;

      try {
        // Parse and validate request body
        const body = await req.json();
        const validation = uploadDocumentSchema.safeParse(body);

        if (!validation.success) {
          return validationErrorResponse(
            'Invalid document upload request',
            validation.error.flatten().fieldErrors
          );
        }

        const { title, content, type, metadata } = validation.data;

        // Create document in Convex
        const created = await convex.mutation(api.documents.create, {
          title,
          content,
          type,
          ownerId: walletAddress,
          metadata,
        });

        log.dbOperation('document_created', {
          documentId: created._id,
          walletAddress,
          title,
          type,
          contentLength: content.length,
          wordCount: created.metadata?.wordCount,
          hasMetadata: !!metadata,
        });

        const responseData: DocumentUploadResponse = {
          document: {
            id: created._id,
            title: created.title,
            content: created.content,
            type: created.type,
            ownerId: created.ownerId,
            metadata: created.metadata,
            createdAt: created.createdAt,
            updatedAt: created.updatedAt,
          },
          message: 'Document uploaded successfully',
        };

        const response = successResponse(responseData);
        return addSecurityHeaders(response);
      } catch (error) {
        log.error('Failed to upload document', {
          error,
          walletAddress,
          operation: 'upload_document',
        });
        const response = NextResponse.json(
          { error: 'Failed to upload document' },
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
