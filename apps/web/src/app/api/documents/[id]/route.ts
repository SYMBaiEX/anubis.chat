/**
 * Individual Document API Endpoint
 * Handles getting, updating, and deleting specific documents
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, type AuthenticatedRequest } from '@/lib/middleware/auth';
import { generalRateLimit } from '@/lib/middleware/rate-limit';
import { 
  successResponse,
  validationErrorResponse,
  notFoundResponse,
  addSecurityHeaders 
} from '@/lib/utils/api-response';
import type { 
  Document, 
  DocumentUpdateResponse 
} from '@/lib/types/documents';

// =============================================================================
// Request Validation Schemas  
// =============================================================================

const updateDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less').optional(),
  content: z.string().min(1, 'Content is required').max(100000, 'Content must be 100,000 characters or less').optional(),
  metadata: z.object({
    source: z.string().optional(),
    author: z.string().optional(),
    tags: z.array(z.string()).optional(),
    category: z.string().optional(),
    language: z.string().optional(),
  }).optional(),
});

// =============================================================================
// External Storage References (shared with main documents route)
// =============================================================================

// Note: In production, these would be database/vector store operations
// For development, we're using in-memory storage (shared module would be ideal)
declare global {
  var documentsStore: Map<string, Document>;
  var userDocumentsStore: Map<string, Set<string>>;
}

// Initialize global storage if not exists
if (!global.documentsStore) {
  global.documentsStore = new Map<string, Document>();
  global.userDocumentsStore = new Map<string, Set<string>>();
}

const documents = global.documentsStore;
const userDocuments = global.userDocumentsStore;

// =============================================================================
// Helper Functions
// =============================================================================

function canAccessDocument(walletAddress: string, documentId: string): boolean {
  const document = documents.get(documentId);
  return document ? document.ownerId === walletAddress : false;
}

function removeDocumentFromUser(walletAddress: string, documentId: string): void {
  const userDocs = userDocuments.get(walletAddress);
  if (userDocs) {
    userDocs.delete(documentId);
    if (userDocs.size === 0) {
      userDocuments.delete(walletAddress);
    }
  }
}

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
        if (!canAccessDocument(walletAddress, documentId)) {
          return notFoundResponse('Document not found');
        }
        
        const document = documents.get(documentId)!;
        
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
        if (!canAccessDocument(walletAddress, documentId)) {
          return notFoundResponse('Document not found');
        }
        
        // Parse and validate request body
        const body = await req.json();
        const validation = updateDocumentSchema.safeParse(body);
        
        if (!validation.success) {
          return validationErrorResponse(
            'Invalid document update request',
            validation.error.issues.reduce((acc, issue) => {
              const path = issue.path.join('.');
              if (!acc[path]) acc[path] = [];
              acc[path].push(issue.message);
              return acc;
            }, {} as Record<string, string[]>)
          );
        }
        
        const { title, content, metadata } = validation.data;
        const existingDocument = documents.get(documentId)!;
        
        // Update document
        const updatedDocument: Document = {
          ...existingDocument,
          ...(title && { title }),
          ...(content && { content }),
          metadata: {
            ...existingDocument.metadata,
            ...metadata,
            ...(content && {
              wordCount: content.split(/\s+/).length,
              characterCount: content.length,
            }),
          },
          updatedAt: Date.now(),
        };
        
        // Store updated document
        documents.set(documentId, updatedDocument);
        
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
        if (!canAccessDocument(walletAddress, documentId)) {
          return notFoundResponse('Document not found');
        }
        
        // Remove document
        documents.delete(documentId);
        removeDocumentFromUser(walletAddress, documentId);
        
        console.log(`Document deleted: ${documentId} by ${walletAddress}`);
        
        const response = successResponse({ 
          message: 'Document deleted successfully',
          documentId 
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