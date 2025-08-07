/**
 * Document Management API Endpoint
 * Handles document upload, storage, and retrieval for RAG system
 */

import { nanoid } from 'nanoid';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStorage } from '@/lib/database/storage';
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

        // Get user's documents using storage layer
        const storage = getStorage();
        const { documents: paginatedDocs, total } =
          await storage.getUserDocuments(walletAddress, {
            page,
            limit,
            category,
            search,
          });

        const totalPages = Math.ceil(total / limit);

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
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
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
        const documentId = nanoid(16);
        const now = Date.now();

        // Create document
        const document: Document = {
          id: documentId,
          title,
          content,
          type,
          ownerId: walletAddress,
          metadata: {
            ...metadata,
            wordCount: content
              .trim()
              .split(/\s+/)
              .filter((word) => word.length > 0).length,
            characterCount: content.length,
          },
          createdAt: now,
          updatedAt: now,
        };

        // Store document using storage layer
        const storage = getStorage();
        await storage.createDocument(document);
        await storage.addDocumentToUser(walletAddress, documentId);

        log.dbOperation('document_created', {
          documentId,
          walletAddress,
          title,
          type,
          contentLength: content.length,
          wordCount: document.metadata?.wordCount,
          hasMetadata: !!metadata,
        });

        const responseData: DocumentUploadResponse = {
          document,
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
