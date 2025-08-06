/**
 * Semantic Search API Endpoint
 * Handles RAG-based semantic search with context generation for AI chat
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
import { getStorage } from '@/lib/database/storage';
import type { 
  Document,
  DocumentSearchResult
} from '@/lib/types/documents';

// =============================================================================
// Request Validation Schemas
// =============================================================================

const semanticSearchSchema = z.object({
  query: z.string().min(1, 'Query is required').max(500, 'Query must be 500 characters or less'),
  limit: z.number().min(1).max(20).default(5),
  contextLength: z.number().min(100).max(2000).default(500),
  filters: z.object({
    type: z.array(z.enum(['text', 'markdown', 'pdf', 'url'])).optional(),
    category: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    dateRange: z.object({
      start: z.number().optional(),
      end: z.number().optional(),
    }).optional(),
  }).optional(),
  context: z.object({
    conversationHistory: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })).max(10).optional(), // Limit conversation history for performance
    userIntent: z.enum(['question', 'summarization', 'analysis', 'generation', 'research']).optional(),
    topicFocus: z.array(z.string()).max(5).optional(), // Key topics to focus on
  }).optional(),
});


// =============================================================================
// Semantic Search Implementation
// =============================================================================

interface SemanticSearchOptions {
  query: string;
  limit: number;
  contextLength: number;
  filters?: {
    type?: string[];
    category?: string[];
    tags?: string[];
    dateRange?: { start?: number; end?: number };
  };
  context?: {
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    userIntent?: string;
    topicFocus?: string[];
  };
}

interface SemanticSearchResponse {
  results: DocumentSearchResult[];
  context: string;
  contextSources: Array<{
    documentId: string;
    title: string;
    score: number;
    snippets: string[];
  }>;
  query: string;
  expandedQuery?: string;
  total: number;
  processingTime: number;
}

/**
 * Enhanced semantic search with context awareness
 * Uses storage layer with additional semantic enhancements
 */
async function performSemanticSearch(
  userWallet: string,
  options: SemanticSearchOptions
): Promise<SemanticSearchResponse> {
  const startTime = Date.now();
  
  // Expand query based on context and intent
  const expandedQuery = expandSearchQuery(options);
  
  // Use storage layer for basic search
  const storage = getStorage();
  const searchOptions = {
    query: expandedQuery,
    limit: options.limit,
    filters: options.filters ? {
      type: options.filters.type as ('text' | 'markdown' | 'pdf' | 'url')[] | undefined,
      category: options.filters.category,
      tags: options.filters.tags,
    } : undefined,
    similarity: { threshold: 0.2, algorithm: 'cosine' as const }, // Higher threshold for semantic search
  };
  
  const results = await storage.searchDocuments(userWallet, expandedQuery, searchOptions);
  
  // Enhance results with semantic context
  const enhancedResults = results.map(result => ({
    ...result,
    score: enhanceSemanticScore(result.score, result.document, options),
  })).sort((a, b) => b.score - a.score);
  
  const limitedResults = enhancedResults.slice(0, options.limit);
  
  // Generate context for AI
  const context = generateRAGContext(limitedResults, options);
  
  // Prepare context sources with snippets
  const contextSources = limitedResults.map(result => ({
    documentId: result.document.id,
    title: result.document.title,
    score: result.score,
    snippets: extractRelevantSnippets(result.document, expandedQuery.toLowerCase().split(/\s+/), 200),
  }));
  
  const processingTime = Date.now() - startTime;
  
  return {
    results: limitedResults,
    context,
    contextSources,
    query: options.query,
    expandedQuery: expandedQuery !== options.query ? expandedQuery : undefined,
    total: results.length,
    processingTime,
  };
}

/**
 * Expand search query based on context and user intent
 */
function expandSearchQuery(options: SemanticSearchOptions): string {
  let query = options.query;
  
  // Add topic focus if provided
  if (options.context?.topicFocus) {
    query += ' ' + options.context.topicFocus.join(' ');
  }
  
  // Consider conversation history for query expansion
  if (options.context?.conversationHistory) {
    const recentMessages = options.context.conversationHistory.slice(-2);
    const contextTerms = recentMessages
      .map(msg => msg.content)
      .join(' ')
      .split(/\s+/)
      .filter(term => term.length > 3)
      .slice(0, 5);
    
    query += ' ' + contextTerms.join(' ');
  }
  
  return query;
}

/**
 * Enhance search score with semantic context awareness
 */
function enhanceSemanticScore(
  baseScore: number, 
  doc: Document, 
  options: SemanticSearchOptions
): number {
  let score = baseScore;
  
  // Intent-based scoring adjustment
  if (options.context?.userIntent === 'research') {
    // Boost longer, more detailed documents for research
    if (doc.content.length > 2000) score *= 1.2;
  } else if (options.context?.userIntent === 'summarization') {
    // Boost documents with clear structure
    if (doc.type === 'markdown' || doc.title.includes('summary')) score *= 1.1;
  }
  
  // Recency boost (slight preference for newer documents)
  const daysSinceCreated = (Date.now() - doc.createdAt) / (1000 * 60 * 60 * 24);
  if (daysSinceCreated < 7) {
    score *= 1.1;
  } else if (daysSinceCreated < 30) {
    score *= 1.05;
  }
  
  return Math.min(1, score);
}


/**
 * Extract relevant text snippets from document
 */
function extractRelevantSnippets(
  doc: Document,
  searchTerms: string[],
  maxLength: number
): string[] {
  const content = doc.content;
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const scoredSentences = sentences.map(sentence => {
    let score = 0;
    const sentenceLower = sentence.toLowerCase();
    
    for (const term of searchTerms) {
      if (sentenceLower.includes(term)) {
        score += 1;
      }
    }
    
    return { sentence: sentence.trim(), score };
  });
  
  // Get top scoring sentences
  scoredSentences.sort((a, b) => b.score - a.score);
  
  const snippets: string[] = [];
  let totalLength = 0;
  
  for (const { sentence } of scoredSentences) {
    if (totalLength + sentence.length > maxLength) break;
    if (sentence.length > 20) { // Skip very short sentences
      snippets.push(sentence);
      totalLength += sentence.length;
    }
  }
  
  return snippets.slice(0, 3); // Max 3 snippets per document
}

/**
 * Extract highlights for search terms
 */
function extractHighlights(text: string, searchTerms: string[]): string[] | undefined {
  const highlights = searchTerms.filter(term => 
    text.toLowerCase().includes(term)
  );
  return highlights.length > 0 ? highlights : undefined;
}

/**
 * Generate structured context for RAG
 */
function generateRAGContext(
  results: DocumentSearchResult[],
  options: SemanticSearchOptions
): string {
  if (results.length === 0) {
    return 'No relevant documents found for this query.';
  }
  
  let context = `Context for query: "${options.query}"\n\n`;
  
  // Add user intent if provided
  if (options.context?.userIntent) {
    context += `User intent: ${options.context.userIntent}\n\n`;
  }
  
  // Add document context
  results.forEach((result, index) => {
    const doc = result.document;
    context += `[Document ${index + 1}] ${doc.title}\n`;
    context += `Type: ${doc.type}, Score: ${result.score.toFixed(2)}\n`;
    
    if (doc.metadata?.category) {
      context += `Category: ${doc.metadata.category}\n`;
    }
    
    if (doc.metadata?.tags?.length) {
      context += `Tags: ${doc.metadata.tags.join(', ')}\n`;
    }
    
    // Add relevant content snippet
    const snippet = doc.content.slice(0, options.contextLength);
    context += `Content: ${snippet}${doc.content.length > options.contextLength ? '...' : ''}\n\n`;
  });
  
  context += `Total ${results.length} documents found with relevance scores ranging from ${results[results.length - 1]?.score.toFixed(2)} to ${results[0]?.score.toFixed(2)}.`;
  
  return context;
}

// =============================================================================
// Route Handler
// =============================================================================

export async function POST(request: NextRequest) {
  return searchRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress } = authReq.user;
        
        // Parse and validate request body
        const body = await req.json();
        const validation = semanticSearchSchema.safeParse(body);
        
        if (!validation.success) {
          return validationErrorResponse(
            'Invalid semantic search request',
            validation.error.flatten().fieldErrors
          );
        }
        
        const searchOptions = validation.data;
        
        // Perform semantic search
        const searchResponse = await performSemanticSearch(walletAddress, searchOptions);
        
        console.log(`Semantic search by ${walletAddress}: "${searchOptions.query}" -> ${searchResponse.total} results (${searchResponse.processingTime}ms)`);
        
        const response = successResponse(searchResponse);
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