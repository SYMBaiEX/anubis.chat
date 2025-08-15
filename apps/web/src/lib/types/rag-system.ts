/**
 * RAG (Retrieval-Augmented Generation) System Types
 * Comprehensive type definitions for document processing, vector search, and knowledge management
 * Strict TypeScript - No any, unknown, or void types allowed
 */

import type {
  DocumentChunkId,
  DocumentId,
  KnowledgeBaseId,
  VectorStoreId,
} from './convex-integration';
import type { Result } from './result';

// =============================================================================
// Document Processing Types
// =============================================================================

export interface DocumentProcessingJob {
  id: string;
  documentId: DocumentId;
  status: DocumentProcessingStatus;
  type: DocumentProcessingType;
  config: DocumentProcessingConfig;
  progress: DocumentProcessingProgress;
  result?: DocumentProcessingResult;
  error?: ProcessingError;
  startedAt: number;
  completedAt?: number;
  estimatedCompletion?: number;
}

export type DocumentProcessingStatus =
  | 'queued'
  | 'processing'
  | 'chunking'
  | 'embedding'
  | 'indexing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type DocumentProcessingType =
  | 'upload_and_process'
  | 'reprocess'
  | 'extract_only'
  | 'chunk_only'
  | 'embed_only'
  | 'full_pipeline';

export interface DocumentProcessingConfig {
  extractText: boolean;
  extractImages: boolean;
  extractTables: boolean;
  extractMetadata: boolean;
  ocrEnabled: boolean;
  languageDetection: boolean;
  chunkingStrategy: ChunkingStrategy;
  embeddingModel: string;
  indexImmediately: boolean;
  preserveFormatting: boolean;
  customProcessors?: string[];
}

export interface ChunkingStrategy {
  method: ChunkingMethod;
  chunkSize: number;
  overlap: number;
  separators?: string[];
  respectBoundaries: boolean;
  minChunkSize?: number;
  maxChunkSize?: number;
  customSeparators?: ChunkingSeparator[];
}

export type ChunkingMethod =
  | 'fixed_size'
  | 'semantic'
  | 'markdown_hierarchy'
  | 'sentence_boundary'
  | 'paragraph_boundary'
  | 'custom_separators'
  | 'hybrid';

export interface ChunkingSeparator {
  pattern: string;
  priority: number;
  preserveInChunk: boolean;
  description?: string;
}

export interface DocumentProcessingProgress {
  stage: DocumentProcessingStatus;
  percentage: number;
  chunksProcessed: number;
  totalChunks: number;
  embeddingsGenerated: number;
  totalEmbeddings: number;
  currentOperation?: string;
  estimatedTimeRemaining?: number;
}

export interface DocumentProcessingResult {
  success: boolean;
  documentId: DocumentId;
  chunksCreated: number;
  embeddingsGenerated: number;
  tokensProcessed: number;
  processingTime: number;
  extractedText: string;
  extractedMetadata: ExtractedMetadata;
  qualityMetrics: ProcessingQualityMetrics;
  warnings?: string[];
}

export interface ExtractedMetadata {
  title?: string;
  author?: string;
  createdAt?: number;
  modifiedAt?: number;
  language?: string;
  pageCount?: number;
  wordCount?: number;
  characterCount?: number;
  extractedEntities?: ExtractedEntity[];
  topics?: string[];
  summary?: string;
  keywords?: string[];
  customFields?: Record<string, string | number | boolean>;
}

export interface ExtractedEntity {
  text: string;
  type: EntityType;
  confidence: number;
  startOffset: number;
  endOffset: number;
  metadata?: Record<string, string | number>;
}

export type EntityType =
  | 'person'
  | 'organization'
  | 'location'
  | 'date'
  | 'money'
  | 'percentage'
  | 'email'
  | 'url'
  | 'phone'
  | 'custom';

export interface ProcessingQualityMetrics {
  textExtractionAccuracy: number;
  chunkingQuality: number;
  embeddingDiversity: number;
  overallScore: number;
  issues?: QualityIssue[];
}

export interface QualityIssue {
  type:
    | 'low_text_extraction'
    | 'poor_chunking'
    | 'embedding_failure'
    | 'format_error';
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedChunks?: number[];
  suggestion?: string;
}

export interface ProcessingError {
  code: ProcessingErrorCode;
  message: string;
  stage: DocumentProcessingStatus;
  details?: Record<string, string | number | boolean>;
  retryable: boolean;
  suggestion?: string;
}

export type ProcessingErrorCode =
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_FORMAT'
  | 'EXTRACTION_FAILED'
  | 'CHUNKING_FAILED'
  | 'EMBEDDING_FAILED'
  | 'INDEXING_FAILED'
  | 'QUOTA_EXCEEDED'
  | 'RATE_LIMITED'
  | 'NETWORK_ERROR'
  | 'INTERNAL_ERROR';

// =============================================================================
// Vector Search Types
// =============================================================================

export interface VectorSearchRequest {
  query: string;
  vectorStoreId?: VectorStoreId;
  knowledgeBaseId?: KnowledgeBaseId;
  searchType: VectorSearchType;
  parameters: VectorSearchParameters;
  filters?: VectorSearchFilters;
  reranking?: RerankingConfig;
}

export type VectorSearchType =
  | 'semantic'
  | 'hybrid'
  | 'keyword'
  | 'dense_retrieval'
  | 'sparse_retrieval'
  | 'multi_vector';

export interface VectorSearchParameters {
  k: number; // Number of results to return
  threshold?: number; // Minimum similarity score
  alpha?: number; // For hybrid search (semantic vs keyword weight)
  embeddingModel?: string;
  searchStrategy?: SearchStrategy;
  diversityThreshold?: number;
  temporalWeighting?: TemporalWeighting;
}

export interface SearchStrategy {
  method: 'exhaustive' | 'approximate' | 'hierarchical' | 'adaptive';
  approximationFactor?: number;
  candidatePoolSize?: number;
  refinementSteps?: number;
}

export interface TemporalWeighting {
  enabled: boolean;
  decayFactor: number;
  referenceDate?: number;
  weightingFunction: 'linear' | 'exponential' | 'logarithmic';
}

export interface VectorSearchFilters {
  documentIds?: DocumentId[];
  chunkIds?: DocumentChunkId[];
  documentTypes?: string[];
  dateRange?: {
    start: number;
    end: number;
  };
  metadata?: MetadataFilter[];
  contentLength?: {
    min?: number;
    max?: number;
  };
  languages?: string[];
  tags?: string[];
  authors?: string[];
}

export interface MetadataFilter {
  field: string;
  operator: FilterOperator;
  value: string | number | boolean | null;
  caseSensitive?: boolean;
}

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'greater_equal'
  | 'less_equal'
  | 'contains'
  | 'starts_with'
  | 'ends_with'
  | 'in'
  | 'not_in'
  | 'exists'
  | 'regex';

export interface RerankingConfig {
  enabled: boolean;
  model?: string;
  strategy: RerankingStrategy;
  maxCandidates?: number;
  diversityWeight?: number;
  relevanceWeight?: number;
}

export type RerankingStrategy =
  | 'cross_encoder'
  | 'llm_based'
  | 'hybrid_scoring'
  | 'semantic_diversity'
  | 'temporal_relevance'
  | 'custom';

export interface VectorSearchResponse {
  results: VectorSearchResult[];
  totalResults: number;
  searchTime: number;
  queryEmbedding?: number[];
  searchMetadata: SearchResponseMetadata;
}

export interface VectorSearchResult {
  documentId: DocumentId;
  chunkId: DocumentChunkId;
  content: string;
  score: number;
  distance: number;
  rank: number;
  metadata: SearchResultMetadata;
  highlights?: SearchHighlight[];
  context?: ContextualInformation;
}

export interface SearchResultMetadata {
  documentTitle?: string;
  documentType?: string;
  chunkIndex: number;
  startOffset: number;
  endOffset: number;
  tokenCount: number;
  createdAt: number;
  lastModified?: number;
  author?: string;
  section?: string;
  pageNumber?: number;
  language?: string;
  extractedEntities?: ExtractedEntity[];
  customMetadata?: Record<string, string | number | boolean>;
}

export interface SearchHighlight {
  field: string;
  matches: HighlightMatch[];
}

export interface HighlightMatch {
  text: string;
  startOffset: number;
  endOffset: number;
  score: number;
}

export interface ContextualInformation {
  previousChunks?: ContextChunk[];
  nextChunks?: ContextChunk[];
  relatedDocuments?: RelatedDocument[];
  documentSummary?: string;
  topicContext?: string[];
}

export interface ContextChunk {
  chunkId: DocumentChunkId;
  content: string;
  position: number;
  relevanceScore?: number;
}

export interface RelatedDocument {
  documentId: DocumentId;
  title: string;
  similarity: number;
  relationshipType: DocumentRelationType;
}

export type DocumentRelationType =
  | 'same_author'
  | 'same_topic'
  | 'cited_by'
  | 'cites'
  | 'temporal_proximity'
  | 'semantic_similarity'
  | 'structural_similarity';

export interface SearchResponseMetadata {
  searchType: VectorSearchType;
  embeddingModel: string;
  searchStrategy: string;
  totalDocumentsSearched: number;
  totalChunksSearched: number;
  rerankingApplied: boolean;
  cacheHit: boolean;
  queryAnalysis?: QueryAnalysis;
}

export interface QueryAnalysis {
  queryType: QueryType;
  entities: ExtractedEntity[];
  intent: QueryIntent;
  complexity: QueryComplexity;
  suggestedFilters?: VectorSearchFilters;
}

export type QueryType =
  | 'factual'
  | 'analytical'
  | 'comparative'
  | 'definitional'
  | 'procedural'
  | 'troubleshooting'
  | 'creative'
  | 'exploratory';

export type QueryIntent =
  | 'find_information'
  | 'compare_options'
  | 'solve_problem'
  | 'learn_concept'
  | 'get_instructions'
  | 'verify_facts'
  | 'explore_topic';

export type QueryComplexity = 'simple' | 'moderate' | 'complex' | 'multi_part';

// =============================================================================
// Knowledge Base Management Types
// =============================================================================

export interface KnowledgeBaseStats {
  documentCount: number;
  chunkCount: number;
  totalTokens: number;
  averageChunkSize: number;
  embeddingModel: string;
  lastUpdated: number;
  storageUsed: number;
  indexingProgress?: IndexingProgress;
  qualityMetrics: KnowledgeBaseQuality;
  usage: KnowledgeBaseUsage;
}

export interface IndexingProgress {
  status: 'idle' | 'indexing' | 'updating' | 'optimizing' | 'error';
  documentsProcessed: number;
  totalDocuments: number;
  chunksIndexed: number;
  totalChunks: number;
  embeddingsGenerated: number;
  totalEmbeddings: number;
  estimatedCompletion?: number;
  currentDocument?: string;
}

export interface KnowledgeBaseQuality {
  overallScore: number;
  coverage: number; // How well the KB covers its intended domain
  coherence: number; // Internal consistency
  freshness: number; // How up-to-date the content is
  diversity: number; // Content variety
  redundancy: number; // Duplicate content level
  qualityIssues: QualityIssue[];
}

export interface KnowledgeBaseUsage {
  totalQueries: number;
  avgQueriesPerDay: number;
  topQueries: QueryStatistic[];
  avgResponseTime: number;
  successRate: number;
  userSatisfaction?: number;
  lastAccessed: number;
}

export interface QueryStatistic {
  query: string;
  count: number;
  avgScore: number;
  lastUsed: number;
}

export interface KnowledgeBaseConfig {
  embeddingModel: string;
  chunkingStrategy: ChunkingStrategy;
  indexingStrategy: IndexingStrategy;
  retrievalStrategy: RetrievalStrategy;
  autoUpdate: boolean;
  qualityThresholds: QualityThresholds;
  optimization: OptimizationConfig;
}

export interface IndexingStrategy {
  method: 'batch' | 'streaming' | 'incremental' | 'adaptive';
  batchSize?: number;
  updateFrequency?: number;
  optimizationSchedule?: string;
  compressionEnabled?: boolean;
}

export interface RetrievalStrategy {
  defaultSearchType: VectorSearchType;
  defaultK: number;
  rerankingEnabled: boolean;
  contextExpansion: boolean;
  diversityFiltering: boolean;
  adaptiveRetrieval: boolean;
}

export interface QualityThresholds {
  minimumRelevanceScore: number;
  minimumChunkSize: number;
  maximumChunkSize: number;
  duplicateThreshold: number;
  freshnessThreshold: number; // Days
}

export interface OptimizationConfig {
  autoOptimize: boolean;
  optimizationTriggers: OptimizationTrigger[];
  compressionLevel: number;
  pruningEnabled: boolean;
  rebalancingEnabled: boolean;
}

export interface OptimizationTrigger {
  type:
    | 'size_threshold'
    | 'quality_degradation'
    | 'usage_pattern'
    | 'scheduled';
  threshold?: number;
  schedule?: string;
  enabled: boolean;
}

// =============================================================================
// Citation and Attribution Types
// =============================================================================

export interface Citation {
  id: string;
  documentId: DocumentId;
  chunkId: DocumentChunkId;
  content: string;
  relevanceScore: number;
  usageType: CitationUsageType;
  position: CitationPosition;
  metadata: CitationMetadata;
}

export type CitationUsageType =
  | 'direct_quote'
  | 'paraphrase'
  | 'supporting_evidence'
  | 'contradiction'
  | 'example'
  | 'definition'
  | 'statistic'
  | 'reference';

export interface CitationPosition {
  startIndex: number;
  endIndex: number;
  contextBefore?: string;
  contextAfter?: string;
}

export interface CitationMetadata {
  title: string;
  author?: string;
  publicationDate?: number;
  url?: string;
  pageNumber?: number;
  section?: string;
  accessedAt: number;
  confidence: number;
  verified: boolean;
}

export interface CitationValidation {
  isValid: boolean;
  accessibility: CitationAccessibility;
  accuracy: CitationAccuracy;
  freshness: CitationFreshness;
  issues?: CitationIssue[];
}

export type CitationAccessibility =
  | 'accessible'
  | 'restricted'
  | 'unavailable'
  | 'unknown';
export type CitationAccuracy =
  | 'verified'
  | 'likely_accurate'
  | 'questionable'
  | 'inaccurate';
export type CitationFreshness = 'current' | 'recent' | 'outdated' | 'unknown';

export interface CitationIssue {
  type: 'broken_link' | 'access_denied' | 'content_changed' | 'format_error';
  severity: 'low' | 'medium' | 'high';
  message: string;
  detectedAt: number;
}

// =============================================================================
// RAG Operation Types
// =============================================================================

export interface RAGRequest {
  query: string;
  context?: RAGContext;
  config?: RAGConfig;
  session?: RAGSession;
}

export interface RAGContext {
  conversationId?: string;
  userPreferences?: UserRAGPreferences;
  domainContext?: string[];
  temporalContext?: TemporalContext;
  previousQueries?: string[];
}

export interface UserRAGPreferences {
  preferredSources?: DocumentId[];
  excludedSources?: DocumentId[];
  responseLength: 'concise' | 'moderate' | 'detailed';
  citationStyle: 'inline' | 'footnotes' | 'bibliography' | 'minimal';
  freshnessBias: number; // 0-1, preference for recent content
  diversityPreference: number; // 0-1, preference for diverse sources
}

export interface TemporalContext {
  referenceDate?: number;
  timeframe?: TimeframeBias;
  historicalRelevance?: boolean;
}

export interface TimeframeBias {
  period: 'recent' | 'historical' | 'all_time' | 'custom';
  customRange?: {
    start: number;
    end: number;
  };
  weight: number;
}

export interface RAGConfig {
  retrievalConfig: VectorSearchParameters;
  generationConfig: GenerationConfig;
  citationConfig: CitationConfig;
  qualityConfig: QualityConfig;
}

export interface GenerationConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
  includeThinking?: boolean;
  responseFormat: ResponseFormat;
}

export type ResponseFormat =
  | 'text'
  | 'markdown'
  | 'structured'
  | 'json'
  | 'conversational';

export interface CitationConfig {
  includeCitations: boolean;
  citationStyle: 'inline' | 'footnotes' | 'bibliography';
  maxCitations: number;
  verifyAccessibility: boolean;
  includeMeta: boolean;
}

export interface QualityConfig {
  factualityCheck: boolean;
  consistencyCheck: boolean;
  completenessCheck: boolean;
  relevanceThreshold: number;
  confidenceThreshold: number;
}

export interface RAGSession {
  sessionId: string;
  startTime: number;
  queries: RAGQueryHistory[];
  context: SessionContext;
  preferences: UserRAGPreferences;
}

export interface RAGQueryHistory {
  query: string;
  timestamp: number;
  results: VectorSearchResult[];
  response?: string;
  feedback?: QueryFeedback;
}

export interface SessionContext {
  topic?: string;
  domain?: string;
  intent?: QueryIntent;
  userExpertise?: UserExpertiseLevel;
  conversationFlow?: ConversationFlow;
}

export type UserExpertiseLevel =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'expert';

export interface ConversationFlow {
  currentPhase: ConversationPhase;
  followUpSuggestions?: string[];
  clarificationNeeded?: string[];
}

export type ConversationPhase =
  | 'exploration'
  | 'deep_dive'
  | 'comparison'
  | 'synthesis'
  | 'conclusion';

export interface QueryFeedback {
  helpful: boolean;
  accurate: boolean;
  complete: boolean;
  relevance: number; // 1-5 scale
  comments?: string;
  suggestedImprovements?: string[];
}

export interface RAGResponse {
  answer: string;
  citations: Citation[];
  confidence: number;
  completeness: number;
  sources: SourceSummary[];
  metadata: RAGResponseMetadata;
  followUp?: FollowUpSuggestion[];
}

export interface SourceSummary {
  documentId: DocumentId;
  title: string;
  relevantChunks: number;
  contributionScore: number;
  lastAccessed: number;
}

export interface RAGResponseMetadata {
  retrievalTime: number;
  generationTime: number;
  totalTime: number;
  documentsSearched: number;
  chunksRetrieved: number;
  sourceQuality: number;
  freshness: number;
  factualityScore?: number;
  modelUsed: string;
  ragVersion: string;
}

export interface FollowUpSuggestion {
  question: string;
  reason: string;
  confidence: number;
  estimatedRelevance: number;
}

// =============================================================================
// Result Types
// =============================================================================

export type RAGOperationResult<T> = Result<T, RAGError>;
export type AsyncRAGOperationResult<T> = Promise<RAGOperationResult<T>>;

export interface RAGError {
  code: RAGErrorCode;
  message: string;
  stage: RAGErrorStage;
  details?: Record<string, string | number | boolean>;
  retryable: boolean;
  suggestion?: string;
}

export type RAGErrorCode =
  | 'QUERY_PROCESSING_FAILED'
  | 'RETRIEVAL_FAILED'
  | 'GENERATION_FAILED'
  | 'CITATION_FAILED'
  | 'QUALITY_CHECK_FAILED'
  | 'INSUFFICIENT_CONTEXT'
  | 'RATE_LIMITED'
  | 'QUOTA_EXCEEDED'
  | 'CONFIGURATION_ERROR'
  | 'INTERNAL_ERROR';

export type RAGErrorStage =
  | 'query_analysis'
  | 'document_retrieval'
  | 'context_preparation'
  | 'response_generation'
  | 'citation_processing'
  | 'quality_validation'
  | 'response_formatting';
