/**
 * API Types and Interfaces for ISIS Chat
 * Forward-thinking design with extensibility and type safety
 */

// =============================================================================
// Core API Response Types
// =============================================================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  metadata?: {
    requestId: string;
    timestamp: number;
    version: string;
  };
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: number;
  requestId: string;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    cursor?: string;
    nextCursor?: string;
    hasMore: boolean;
    total?: number;
    limit: number;
  };
}

// =============================================================================
// Authentication Types
// =============================================================================

export interface WalletAuthChallenge {
  challenge: string;
  expiresAt: string;
  nonce: string;
}

export interface WalletAuthVerification {
  message: string;
  signature: string;
  publicKey: string;
}

export interface AuthSession {
  walletAddress: string;
  publicKey: string;
  token: string;
  refreshToken: string;
  expiresAt: number;
  user: UserProfile;
}

// =============================================================================
// User Types
// =============================================================================

export interface UserProfile {
  walletAddress: string;
  publicKey: string;
  displayName?: string;
  avatar?: string;
  preferences: UserPreferences;
  subscription: UserSubscription;
  createdAt: number;
  lastActiveAt: number;
  isActive: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  aiModel: string;
  notifications: boolean;
  language?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface UserSubscription {
  tier: 'free' | 'pro' | 'enterprise';
  expiresAt?: number;
  tokensUsed: number;
  tokensLimit: number;
  features: string[];
}

// =============================================================================
// Chat Types
// =============================================================================

export interface Chat {
  _id: string;
  walletAddress: string;
  title: string;
  description?: string;
  model: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  isArchived: boolean;
  isPinned: boolean;
  messageCount: number;
  tokensUsed: number;
  createdAt: number;
  updatedAt: number;
  lastMessageAt?: number;
}

export interface ChatMessage {
  _id: string;
  chatId: string;
  walletAddress: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokenCount?: number;
  embedding?: number[];
  metadata?: MessageMetadata;
  createdAt: number;
  updatedAt?: number;
}

export interface MessageMetadata {
  model?: string;
  finishReason?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  tools?: ToolCall[];
  reasoning?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, any>;
  result?: any;
}

// =============================================================================
// AI Integration Types
// =============================================================================

export interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'deepseek';
  contextWindow: number;
  maxTokens: number;
  strengths: string[];
  costTier: 'free' | 'budget' | 'premium';
  isAvailable: boolean;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  tools?: Tool[];
  systemPrompt?: string;
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface StreamingResponse {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: StreamingChoice[];
}

export interface StreamingChoice {
  index: number;
  delta: {
    content?: string;
    role?: string;
    tool_calls?: ToolCall[];
  };
  finish_reason?: string;
}

// =============================================================================
// Document Types
// =============================================================================

export interface Document {
  _id: string;
  walletAddress: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  status: 'uploaded' | 'processing' | 'processed' | 'failed';
  metadata: DocumentMetadata;
  chunks?: DocumentChunk[];
  createdAt: number;
  updatedAt: number;
}

export interface DocumentMetadata {
  pageCount?: number;
  wordCount?: number;
  language?: string;
  extractedText?: string;
  summary?: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  embedding: number[];
  metadata: ChunkMetadata;
  index: number;
}

export interface ChunkMetadata {
  page?: number;
  section?: string;
  tokenCount: number;
  source: string;
}

// =============================================================================
// Search Types
// =============================================================================

export interface SearchRequest {
  query: string;
  type: 'semantic' | 'hybrid' | 'keyword';
  filters?: SearchFilters;
  limit?: number;
  threshold?: number;
}

export interface SearchFilters {
  chatIds?: string[];
  documentIds?: string[];
  dateRange?: {
    start: number;
    end: number;
  };
  messageTypes?: ('user' | 'assistant' | 'system')[];
}

export interface SearchResult {
  id: string;
  type: 'message' | 'document';
  content: string;
  score: number;
  metadata: SearchResultMetadata;
}

export interface SearchResultMetadata {
  chatId?: string;
  messageId?: string;
  documentId?: string;
  chunkId?: string;
  title?: string;
  createdAt: number;
  context?: string;
}

// =============================================================================
// Request/Response Schemas
// =============================================================================

export interface CreateChatRequest {
  title: string;
  model: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  initialMessage?: string;
}

export interface UpdateChatRequest {
  title?: string;
  description?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  isPinned?: boolean;
}

export interface SendMessageRequest {
  content: string;
  role?: 'user';
  metadata?: Partial<MessageMetadata>;
}

export interface RegenerateMessageRequest {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

// =============================================================================
// Webhook Types
// =============================================================================

export interface WebhookEvent {
  id: string;
  type: string;
  data: Record<string, any>;
  timestamp: number;
  signature: string;
}

// =============================================================================
// Rate Limiting Types
// =============================================================================

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

// =============================================================================
// Error Types
// =============================================================================

export enum APIErrorCode {
  // Authentication
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_SIGNATURE = 'INVALID_SIGNATURE',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_REQUEST = 'INVALID_REQUEST',
  MISSING_PARAMETERS = 'MISSING_PARAMETERS',

  // Resources
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  RESOURCE_LIMIT_EXCEEDED = 'RESOURCE_LIMIT_EXCEEDED',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',

  // AI/Model
  MODEL_UNAVAILABLE = 'MODEL_UNAVAILABLE',
  CONTEXT_TOO_LONG = 'CONTEXT_TOO_LONG',
  UNSAFE_CONTENT = 'UNSAFE_CONTENT',

  // Server
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
}