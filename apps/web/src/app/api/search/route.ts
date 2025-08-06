/**
 * Search API Endpoint
 * Handles document search and RAG-based semantic search
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, type AuthenticatedRequest } from '@/lib/middleware/auth';
import { searchRateLimit } from '@/lib/middleware/rate-limit';
import { 
  successResponse,
  validationErrorResponse,
  addSecurityHeaders 
} from '@/lib/utils/api-response';
import type { 
  Document,
  DocumentSearchRequest,
  DocumentSearchResponse,
  DocumentSearchResult
} from '@/lib/types/documents';

// =============================================================================
// Request Validation Schemas
// =============================================================================

const searchDocumentsSchema = z.object({
  query: z.string().min(1, 'Query is required').max(500, 'Query must be 500 characters or less'),
  limit: z.number().min(1).max(50).default(10),
  filters: z.object({
    type: z.array(z.enum(['text', 'markdown', 'pdf', 'url'])).optional(),
    category: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    ownerId: z.string().optional(),
  }).optional(),
  similarity: z.object({
    threshold: z.number().min(0).max(1).default(0.7),
    algorithm: z.enum(['cosine', 'dot_product', 'euclidean']).default('cosine'),
  }).optional(),
  rerank: z.object({
    enabled: z.boolean().default(false),
    model: z.string().default('cross-encoder'),
    topK: z.number().min(1).max(100).default(20),
  }).optional(),
});

const semanticSearchSchema = z.object({
  query: z.string().min(1, 'Query is required').max(500, 'Query must be 500 characters or less'),
  limit: z.number().min(1).max(20).default(5),
  context: z.object({
    conversationHistory: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })).optional(),
    userIntent: z.enum(['question', 'summarization', 'analysis', 'generation']).optional(),
  }).optional(),
});

// =============================================================================
// External Storage References (shared with documents)
// =============================================================================

declare global {
  var documentsStore: Map<string, Document>;
  var userDocumentsStore: Map<string, Set<string>>;
}

if (!global.documentsStore) {
  global.documentsStore = new Map<string, Document>();
  global.userDocumentsStore = new Map<string, Set<string>>();
}

const documents = global.documentsStore;
const userDocuments = global.userDocumentsStore;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Simple text-based search implementation
 * In production, this would use vector search with embeddings
 */
function searchDocuments(
  query: string, 
  userWallet: string, 
  options: DocumentSearchRequest
): DocumentSearchResult[] {
  const userDocIds = userDocuments.get(userWallet) || new Set();
  const searchTerms = query.toLowerCase().split(/\s+/);
  const results: DocumentSearchResult[] = [];
  
  for (const docId of userDocIds) {
    const doc = documents.get(docId);
    if (!doc) continue;
    
    // Apply type filter
    if (options.filters?.type && !options.filters.type.includes(doc.type)) {
      continue;
    }
    
    // Apply category filter
    if (options.filters?.category && doc.metadata?.category) {
      if (!options.filters.category.includes(doc.metadata.category)) {
        continue;
      }
    }
    
    // Apply tags filter
    if (options.filters?.tags && doc.metadata?.tags) {
      const hasMatchingTag = options.filters.tags.some(filterTag => 
        doc.metadata?.tags?.includes(filterTag)
      );
      if (!hasMatchingTag) {
        continue;
      }
    }
    
    // Calculate search score
    const titleLower = doc.title.toLowerCase();
    const contentLower = doc.content.toLowerCase();
    
    let score = 0;
    let titleHighlights: string[] = [];
    let contentHighlights: string[] = [];
    
    // Score calculation (simple TF-IDF-like approach)
    for (const term of searchTerms) {
      // Title matches (higher weight)
      if (titleLower.includes(term)) {
        score += 3;
        titleHighlights.push(term);
      }
      
      // Content matches
      const contentMatches = (contentLower.match(new RegExp(term, 'g')) || []).length;
      score += contentMatches * 1;
      
      if (contentMatches > 0) {
        contentHighlights.push(term);
      }
      
      // Tag matches (medium weight)
      if (doc.metadata?.tags?.some(tag => tag.toLowerCase().includes(term))) {
        score += 2;
      }
    }
    
    // Apply similarity threshold
    const normalizedScore = Math.min(1, score / (searchTerms.length * 5));
    if (normalizedScore < (options.similarity?.threshold || 0.1)) {
      continue;
    }
    
    results.push({
      document: doc,
      score: normalizedScore,
      highlights: {
        title: titleHighlights.length > 0 ? titleHighlights : undefined,
        content: contentHighlights.length > 0 ? contentHighlights : undefined,
      },
    });
  }
  
  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  
  // Apply limit
  return results.slice(0, options.limit || 10);
}

/**
 * Extract relevant context from search results for RAG
 */
function extractContext(results: DocumentSearchResult[]): string {
  return results
    .map(result => {
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
      try {
        const { walletAddress } = authReq.user;
        const startTime = Date.now();
        
        // Parse and validate request body
        const body = await req.json();
        const validation = searchDocumentsSchema.safeParse(body);
        
        if (!validation.success) {
          return validationErrorResponse(
            'Invalid search request',
            validation.error.issues.reduce((acc, issue) => {
              const path = issue.path.join('.');
              if (!acc[path]) acc[path] = [];
              acc[path].push(issue.message);
              return acc;
            }, {} as Record<string, string[]>)
          );
        }
        
        const searchRequest = validation.data;
        
        // Perform search
        const results = searchDocuments(searchRequest.query, walletAddress, searchRequest);
        const processingTime = Date.now() - startTime;
        
        console.log(`Search performed by ${walletAddress}: "${searchRequest.query}" -> ${results.length} results (${processingTime}ms)`);
        
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
        console.error('Search documents error:', error);
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
      try {
        const { walletAddress } = authReq.user;
        const { searchParams } = new URL(req.url);
        
        // Handle semantic search via query parameters for GET request
        const query = searchParams.get('q');
        const limitStr = searchParams.get('limit');
        
        if (!query) {
          return validationErrorResponse(
            'Missing query parameter',
            { q: ['Query parameter "q" is required'] }
          );
        }
        
        const limit = limitStr ? Math.min(20, Math.max(1, parseInt(limitStr, 10))) : 5;
        
        // Perform basic search (in production, this would use vector embeddings)
        const searchOptions: DocumentSearchRequest = {
          query,
          limit,
          similarity: { threshold: 0.3, algorithm: 'cosine' },
        };
        
        const results = searchDocuments(query, walletAddress, searchOptions);
        const context = extractContext(results.slice(0, 3)); // Use top 3 for context
        
        console.log(`Semantic search by ${walletAddress}: "${query}" -> ${results.length} results, context: ${context.length} chars`);
        
        const responseData = {
          results,
          context,
          query,
          total: results.length,
          contextSources: results.slice(0, 3).map(r => ({
            documentId: r.document.id,
            title: r.document.title,
            score: r.score,
          })),
        };
        
        const response = successResponse(responseData);
        return addSecurityHeaders(response);
        
      } catch (error) {
        console.error('Semantic search error:', error);
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