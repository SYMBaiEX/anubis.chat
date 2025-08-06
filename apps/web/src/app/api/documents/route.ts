/**
 * Document Management API Endpoint
 * Handles document upload, storage, and retrieval for RAG system
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, type AuthenticatedRequest } from '@/lib/middleware/auth';
import { generalRateLimit } from '@/lib/middleware/rate-limit';
import { 
  successResponse,
  validationErrorResponse,
  addSecurityHeaders 
} from '@/lib/utils/api-response';
import { nanoid } from 'nanoid';
import type { 
  Document, 
  DocumentListResponse, 
  DocumentUploadResponse 
} from '@/lib/types/documents';

// =============================================================================
// Request Validation Schemas
// =============================================================================

const uploadDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  content: z.string().min(1, 'Content is required').max(100000, 'Content must be 100,000 characters or less'),
  type: z.enum(['text', 'markdown', 'pdf', 'url']).default('text'),
  metadata: z.object({
    source: z.string().optional(),
    author: z.string().optional(),
    tags: z.array(z.string()).optional(),
    category: z.string().optional(),
    language: z.string().default('en'),
  }).optional(),
});

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
// In-Memory Storage (Production would use database/vector store)
// =============================================================================

const documents = new Map<string, Document>();
const userDocuments = new Map<string, Set<string>>(); // walletAddress -> Set<documentId>

// =============================================================================
// Helper Functions
// =============================================================================

function getUserDocuments(walletAddress: string): Document[] {
  const documentIds = userDocuments.get(walletAddress) || new Set();
  return Array.from(documentIds)
    .map(id => documents.get(id))
    .filter((doc): doc is Document => doc !== undefined)
    .sort((a, b) => b.createdAt - a.createdAt);
}

function addDocumentToUser(walletAddress: string, documentId: string): void {
  if (!userDocuments.has(walletAddress)) {
    userDocuments.set(walletAddress, new Set());
  }
  userDocuments.get(walletAddress)!.add(documentId);
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

function canAccessDocument(walletAddress: string, documentId: string): boolean {
  const document = documents.get(documentId);
  return document ? document.ownerId === walletAddress : false;
}

// =============================================================================
// Route Handlers
// =============================================================================

/**
 * GET /api/documents - List user's documents
 */
export async function GET(request: NextRequest) {
  return generalRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress } = authReq.user;
        const { searchParams } = new URL(req.url);
        
        // Parse query parameters
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
        const category = searchParams.get('category');
        const search = searchParams.get('search');
        
        // Get user's documents
        let userDocs = getUserDocuments(walletAddress);
        
        // Filter by category
        if (category) {
          userDocs = userDocs.filter(doc => doc.metadata?.category === category);
        }
        
        // Filter by search term (title and content)
        if (search) {
          const searchTerm = search.toLowerCase();
          userDocs = userDocs.filter(doc => 
            doc.title.toLowerCase().includes(searchTerm) ||
            doc.content.toLowerCase().includes(searchTerm) ||
            doc.metadata?.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
          );
        }
        
        // Pagination
        const total = userDocs.length;
        const totalPages = Math.ceil(total / limit);
        const offset = (page - 1) * limit;
        const paginatedDocs = userDocs.slice(offset, offset + limit);
        
        console.log(`Documents listed for ${walletAddress}: ${paginatedDocs.length}/${total} documents`);
        
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
        console.error('Get documents error:', error);
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
      try {
        const { walletAddress } = authReq.user;
        
        // Parse and validate request body
        const body = await req.json();
        const validation = uploadDocumentSchema.safeParse(body);
        
        if (!validation.success) {
          return validationErrorResponse(
            'Invalid document upload request',
            validation.error.issues.reduce((acc, issue) => {
              const path = issue.path.join('.');
              if (!acc[path]) acc[path] = [];
              acc[path].push(issue.message);
              return acc;
            }, {} as Record<string, string[]>)
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
            wordCount: content.split(/\s+/).length,
            characterCount: content.length,
          },
          createdAt: now,
          updatedAt: now,
        };
        
        // Store document
        documents.set(documentId, document);
        addDocumentToUser(walletAddress, documentId);
        
        console.log(`Document created: ${documentId} by ${walletAddress}, type: ${type}, length: ${content.length} chars`);
        
        const responseData: DocumentUploadResponse = {
          document,
          message: 'Document uploaded successfully',
        };
        
        const response = successResponse(responseData);
        return addSecurityHeaders(response);
        
      } catch (error) {
        console.error('Upload document error:', error);
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