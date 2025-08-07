/**
 * Search API Endpoint
 * Handles document search and RAG-based semantic search
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createModuleLogger } from '@/lib/utils/logger';

// Initialize logger
const log = createModuleLogger('api/search');

import { getStorage } from '@/lib/database/storage';
import { type AuthenticatedRequest, withAuth } from '@/lib/middleware/auth';
import { searchRateLimit } from '@/lib/middleware/rate-limit';
import type {
  Document,
  DocumentSearchRequest,
  DocumentSearchResponse,
  DocumentSearchResult,
} from '@/lib/types/documents';
import {
  addSecurityHeaders,
  successResponse,
  validationErrorResponse,
} from '@/lib/utils/api-response';

// =============================================================================
// Request Validation Schemas
// =============================================================================

const searchDocumentsSchema = z.object({
  query: z
    .string()
    .min(1, 'Query is required')
    .max(500, 'Query must be 500 characters or less')
    .refine((val) => {
      // Prevent potential ReDoS patterns
      const suspiciousPatterns = [
        /(\*{2,}|\+{2,}|\?{2,}|\|{2,})/, // Repeated quantifiers
        /\(.*\){20,}/, // Excessive groups
        /(.*\*.*){10,}/, // Nested quantifiers
      ];
      return !suspiciousPatterns.some((pattern) => pattern.test(val));
    }, 'Query contains potentially unsafe patterns'),
  limit: z.number().min(1).max(50).default(10),
  filters: z
    .object({
      type: z.array(z.enum(['text', 'markdown', 'pdf', 'url'])).optional(),
      category: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      ownerId: z.string().optional(),
    })
    .optional(),
  similarity: z
    .object({
      threshold: z.number().min(0).max(1).default(0.7),
      algorithm: z
        .enum(['cosine', 'dot_product', 'euclidean'])
        .default('cosine'),
    })
    .optional(),
  rerank: z
    .object({
      enabled: z.boolean().default(false),
      model: z.string().default('cross-encoder'),
      topK: z.number().min(1).max(100).default(20),
    })
    .optional(),
});

const semanticSearchSchema = z.object({
  query: z
    .string()
    .min(1, 'Query is required')
    .max(500, 'Query must be 500 characters or less'),
  limit: z.number().min(1).max(20).default(5),
  context: z
    .object({
      conversationHistory: z
        .array(
          z.object({
            role: z.enum(['user', 'assistant']),
            content: z.string(),
          })
        )
        .optional(),
      userIntent: z
        .enum(['question', 'summarization', 'analysis', 'generation'])
        .optional(),
    })
    .optional(),
});

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Extract relevant context from search results for RAG
 */
function extractContext(results: DocumentSearchResult[]): string {
  return results
    .map((result) => {
      const doc = result.document;
      // Get first 500 characters of content as context
      const contextSnippet = doc.content.slice(0, 500);
      return `Title: ${doc.title}\nContent: ${contextSnippet}${doc.content.length > 500 ? '...' : ''}`;
    })
    .join('\n\n---\n\n');
}

// =============================================================================
// Route Handlers
// =============================================================================

/**
 * POST /api/search - Search documents
 */
export async function POST(request: NextRequest) {
  return searchRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      const { walletAddress } = authReq.user;

      try {
        const startTime = Date.now();

        // Parse and validate request body
        const body = await req.json();
        const validation = searchDocumentsSchema.safeParse(body);

        if (!validation.success) {
          return validationErrorResponse(
            'Invalid search request',
            validation.error.flatten().fieldErrors
          );
        }

        const searchRequest = validation.data;

        // Perform search using storage layer
        const storage = getStorage();
        const results = await storage.searchDocuments(
          walletAddress,
          searchRequest.query,
          searchRequest
        );
        const processingTime = Date.now() - startTime;

        log.apiRequest('GET /api/search', {
          walletAddress,
          query: searchRequest.query,
          resultCount: results.length,
          processingTime,
          hasFilters: !!searchRequest.filters,
        });

        const responseData: DocumentSearchResponse = {
          results,
          query: searchRequest.query,
          total: results.length,
          processingTime,
          filters: searchRequest.filters,
        };

        const response = successResponse(responseData);
        return addSecurityHeaders(response);
      } catch (error) {
        log.error('Failed to search documents', {
          error,
          walletAddress,
          operation: 'search_documents',
        });
        const response = NextResponse.json(
          { error: 'Failed to search documents' },
          { status: 500 }
        );
        return addSecurityHeaders(response);
      }
    });
  });
}

/**
 * POST /api/search/semantic - RAG-based semantic search with context
 */
export async function GET(request: NextRequest) {
  return searchRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      const { walletAddress } = authReq.user;

      try {
        const { searchParams } = new URL(req.url);

        // Handle semantic search via query parameters for GET request
        const query = searchParams.get('q');
        const limitStr = searchParams.get('limit');

        if (!query) {
          return validationErrorResponse('Missing query parameter', {
            q: ['Query parameter "q" is required'],
          });
        }

        const limit = limitStr
          ? Math.min(20, Math.max(1, Number.parseInt(limitStr, 10)))
          : 5;

        // Perform basic search (in production, this would use vector embeddings)
        const searchOptions: DocumentSearchRequest = {
          query,
          limit,
          similarity: { threshold: 0.3, algorithm: 'cosine' },
        };

        const storage = getStorage();
        const results = await storage.searchDocuments(
          walletAddress,
          query,
          searchOptions
        );
        const context = extractContext(results.slice(0, 3)); // Use top 3 for context

        log.apiRequest('POST /api/search - Semantic', {
          walletAddress,
          query,
          resultCount: results.length,
          contextLength: context.length,
          limit,
          hasFilters: !!searchOptions.filters,
          hasContext: !!context,
        });

        const responseData = {
          results,
          context,
          query,
          total: results.length,
          contextSources: results.slice(0, 3).map((r) => ({
            documentId: r.document.id,
            title: r.document.title,
            score: r.score,
          })),
        };

        const response = successResponse(responseData);
        return addSecurityHeaders(response);
      } catch (error) {
        log.error('Failed to perform semantic search', {
          error,
          walletAddress,
          operation: 'semantic_search',
        });
        const response = NextResponse.json(
          { error: 'Failed to perform semantic search' },
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
