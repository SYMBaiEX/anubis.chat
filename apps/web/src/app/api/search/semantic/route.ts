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
// External Storage References
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
 * In production, this would use vector embeddings and similarity search
 */
function performSemanticSearch(
  userWallet: string,
  options: SemanticSearchOptions
): SemanticSearchResponse {
  const startTime = Date.now();
  const userDocIds = userDocuments.get(userWallet) || new Set();
  
  // Expand query based on context and intent
  let expandedQuery = expandSearchQuery(options);
  const searchTerms = expandedQuery.toLowerCase().split(/\s+/);
  const results: DocumentSearchResult[] = [];
  
  for (const docId of userDocIds) {
    const doc = documents.get(docId);
    if (!doc) continue;
    
    // Apply filters
    if (!passesFilters(doc, options.filters)) continue;
    
    // Enhanced scoring with semantic awareness
    const score = calculateSemanticScore(doc, searchTerms, options);
    
    if (score < 0.2) continue; // Higher threshold for semantic search
    
    // Extract relevant snippets
    const snippets = extractRelevantSnippets(doc, searchTerms, options.contextLength);
    
    results.push({
      document: doc,
      score,
      highlights: {
        title: extractHighlights(doc.title, searchTerms),
        content: extractHighlights(doc.content, searchTerms),
      },
    });
  }
  
  // Sort by score and apply limit
  results.sort((a, b) => b.score - a.score);
  const limitedResults = results.slice(0, options.limit);
  
  // Generate context for AI
  const context = generateRAGContext(limitedResults, options);
  
  // Prepare context sources
  const contextSources = limitedResults.map(result => ({
    documentId: result.document.id,
    title: result.document.title,
    score: result.score,
    snippets: extractRelevantSnippets(result.document, searchTerms, 200),
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
 * Check if document passes all filters
 */
function passesFilters(doc: Document, filters?: SemanticSearchOptions['filters']): boolean {
  if (!filters) return true;
  
  // Type filter
  if (filters.type && !filters.type.includes(doc.type)) return false;
  
  // Category filter
  if (filters.category && doc.metadata?.category) {
    if (!filters.category.includes(doc.metadata.category)) return false;
  }
  
  // Tags filter
  if (filters.tags && doc.metadata?.tags) {
    const hasMatchingTag = filters.tags.some(filterTag => 
      doc.metadata?.tags?.includes(filterTag)
    );
    if (!hasMatchingTag) return false;
  }
  
  // Date range filter
  if (filters.dateRange) {
    if (filters.dateRange.start && doc.createdAt < filters.dateRange.start) return false;
    if (filters.dateRange.end && doc.createdAt > filters.dateRange.end) return false;
  }
  
  return true;
}

/**
 * Calculate semantic score with enhanced weighting
 */
function calculateSemanticScore(
  doc: Document,
  searchTerms: string[],
  options: SemanticSearchOptions
): number {
  const titleLower = doc.title.toLowerCase();
  const contentLower = doc.content.toLowerCase();
  let score = 0;
  
  for (const term of searchTerms) {
    // Title matches (highest weight)
    if (titleLower.includes(term)) {
      score += 5;
    }
    
    // Content frequency with diminishing returns
    const contentMatches = (contentLower.match(new RegExp(term, 'g')) || []).length;
    score += Math.min(contentMatches * 1.5, 10);
    
    // Tag matches (high weight)
    if (doc.metadata?.tags?.some(tag => tag.toLowerCase().includes(term))) {
      score += 3;
    }
    
    // Category match (medium weight)
    if (doc.metadata?.category?.toLowerCase().includes(term)) {
      score += 2;
    }
  }
  
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
  
  // Normalize score
  return Math.min(1, score / (searchTerms.length * 8));
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
            validation.error.issues.reduce((acc, issue) => {
              const path = issue.path.join('.');
              if (!acc[path]) acc[path] = [];
              acc[path].push(issue.message);
              return acc;
            }, {} as Record<string, string[]>)
          );
        }
        
        const searchOptions = validation.data;
        
        // Perform semantic search
        const searchResponse = performSemanticSearch(walletAddress, searchOptions);
        
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