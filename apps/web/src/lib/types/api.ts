/**
 * API Types and Interfaces for ISIS Chat
 * Forward-thinking design with extensibility and type safety
 * Strict TypeScript - No any, unknown, or void types allowed
 */

import type { z } from 'zod';
import type { Result } from './result';

// =============================================================================
// Core API Response Types
// =============================================================================

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
  metadata?: APIResponseMetadata;
}

export interface APIResponseMetadata {
  requestId: string;
  timestamp: number;
  version: string;
  correlationId?: string;
  duration?: number;
}

export interface APIError {
  code: APIErrorCode;
  message: string;
  details?: APIErrorDetails;
  timestamp: number;
  requestId: string;
  statusCode?: number;
  path?: string;
  method?: string;
}

export interface APIErrorDetails {
  field?: string;
  value?: string | number | boolean;
  constraint?: string;
  context?: Record<string, string | number | boolean>;
  stack?: string;
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

// Type alias for convenience
export type User = UserProfile;

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

export enum Language {
  EN = 'en',
  ES = 'es',
  FR = 'fr',
  DE = 'de',
  ZH = 'zh',
  JA = 'ja',
  KO = 'ko',
  PT = 'pt',
  RU = 'ru',
  AR = 'ar',
}

export interface UserPreferences {
  theme: Theme;
  aiModel: string;
  notifications: boolean;
  language?: Language;
  temperature?: number;
  maxTokens?: number;
  streamResponses?: boolean;
  saveHistory?: boolean;
  compactMode?: boolean;
}

export enum SubscriptionTier {
  FREE = 'free',
  STARTER = 'starter',
  PRO = 'pro',
  TEAM = 'team',
  ENTERPRISE = 'enterprise',
}

export enum SubscriptionFeature {
  BASIC_CHAT = 'basic_chat',
  DOCUMENT_UPLOAD = 'document_upload',
  ADVANCED_MODELS = 'advanced_models',
  UNLIMITED_TOKENS = 'unlimited_tokens',
  PRIORITY_SUPPORT = 'priority_support',
  CUSTOM_TOOLS = 'custom_tools',
  TEAM_COLLABORATION = 'team_collaboration',
  API_ACCESS = 'api_access',
  WEBHOOK_INTEGRATION = 'webhook_integration',
  CUSTOM_BRANDING = 'custom_branding',
  AUDIT_LOGS = 'audit_logs',
}

export interface UserSubscription {
  tier: SubscriptionTier;
  expiresAt?: number;
  tokensUsed: number;
  tokensLimit: number;
  features: SubscriptionFeature[];
  billingCycle?: 'monthly' | 'yearly';
  autoRenew?: boolean;
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

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
  TOOL = 'tool',
  FUNCTION = 'function',
}

export enum MessageStatus {
  PENDING = 'pending',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  DELETED = 'deleted',
}

export interface ChatMessage {
  _id: string;
  chatId: string;
  walletAddress: string;
  role: MessageRole;
  content: string;
  tokenCount?: number;
  embedding?: number[];
  metadata?: MessageMetadata;
  status?: MessageStatus;
  parentMessageId?: string;
  createdAt: number;
  updatedAt?: number;
  editedAt?: number;
}

export interface MessageMetadata {
  model?: string;
  finishReason?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  tools?: ToolCall[];
  reasoning?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  args: ToolCallArguments;
  result?: ToolCallResult;
}

export interface ToolCallArguments {
  [key: string]:
    | string
    | number
    | boolean
    | null
    | ToolCallArguments
    | ToolCallArguments[];
}

export interface ToolCallResult {
  success: boolean;
  data?: string | number | boolean | Record<string, unknown>;
  error?: string;
  executionTime?: number;
}

// =============================================================================
// AI Integration Types
// =============================================================================

export enum AIProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  DEEPSEEK = 'deepseek',
  GOOGLE = 'google',
  MISTRAL = 'mistral',
  COHERE = 'cohere',
  HUGGINGFACE = 'huggingface',
}

export enum AICostTier {
  FREE = 'free',
  BUDGET = 'budget',
  STANDARD = 'standard',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}

export enum AIModelCapability {
  TEXT_GENERATION = 'text_generation',
  CODE_GENERATION = 'code_generation',
  REASONING = 'reasoning',
  VISION = 'vision',
  FUNCTION_CALLING = 'function_calling',
  STREAMING = 'streaming',
  EMBEDDINGS = 'embeddings',
}

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  contextWindow: number;
  maxTokens: number;
  strengths: string[];
  capabilities: AIModelCapability[];
  costTier: AICostTier;
  isAvailable: boolean;
  version?: string;
  releaseDate?: number;
  deprecatedDate?: number;
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
  parameters: ToolParameters;
  required?: string[];
  category?: ToolCategory;
}

export interface ToolParameters {
  type: 'object';
  properties: Record<string, ToolParameterProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface ToolParameterProperty {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
  description?: string;
  enum?: (string | number)[];
  default?: string | number | boolean | null;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  items?: ToolParameterProperty;
  properties?: Record<string, ToolParameterProperty>;
}

export enum ToolCategory {
  DATA_RETRIEVAL = 'data_retrieval',
  COMPUTATION = 'computation',
  COMMUNICATION = 'communication',
  FILE_SYSTEM = 'file_system',
  WEB_API = 'web_api',
  BLOCKCHAIN = 'blockchain',
  CUSTOM = 'custom',
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
// Document Types - imported from documents.ts to avoid conflicts
// =============================================================================

// Import document types from the comprehensive documents module
export type {
  Document,
  DocumentChunk,
  DocumentMetadata,
  DocumentSearchRequest,
  DocumentSearchResponse,
  DocumentSearchResult,
  DocumentType,
} from './documents';

// =============================================================================
// Search Types
// =============================================================================

export enum SearchType {
  SEMANTIC = 'semantic',
  HYBRID = 'hybrid',
  KEYWORD = 'keyword',
  FUZZY = 'fuzzy',
  VECTOR = 'vector',
}

export interface SearchRequest {
  query: string;
  type: SearchType;
  filters?: SearchFilters;
  limit?: number;
  offset?: number;
  threshold?: number;
  sort?: SearchSort[];
  highlight?: boolean;
}

export interface SearchSort {
  field: string;
  order: SortOrder;
}

export interface SearchFilters {
  chatIds?: string[];
  documentIds?: string[];
  dateRange?: DateRange;
  messageTypes?: MessageRole[];
  tags?: string[];
  walletAddresses?: string[];
  models?: string[];
}

export interface DateRange {
  start: number;
  end: number;
  timezone?: string;
}

export enum SearchResultType {
  MESSAGE = 'message',
  DOCUMENT = 'document',
  CHAT = 'chat',
  USER = 'user',
  AGENT = 'agent',
}

export interface SearchResult {
  id: string;
  type: SearchResultType;
  content: string;
  score: number;
  highlights?: string[];
  metadata: SearchResultMetadata;
  relevance?: number;
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
  type: WebhookEventType;
  data: WebhookEventData;
  timestamp: number;
  signature: string;
  version?: string;
}

export enum WebhookEventType {
  CHAT_CREATED = 'chat.created',
  CHAT_UPDATED = 'chat.updated',
  CHAT_DELETED = 'chat.deleted',
  MESSAGE_SENT = 'message.sent',
  MESSAGE_RECEIVED = 'message.received',
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  SUBSCRIPTION_CHANGED = 'subscription.changed',
  TOKEN_LIMIT_REACHED = 'token_limit.reached',
  ERROR_OCCURRED = 'error.occurred',
}

export interface WebhookEventData {
  resourceId: string;
  resourceType: 'chat' | 'message' | 'user' | 'subscription';
  action: 'created' | 'updated' | 'deleted' | 'sent' | 'received';
  payload: Record<string, string | number | boolean | null>;
  userId?: string;
  metadata?: Record<string, string | number | boolean>;
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
// Result Type Integration
// =============================================================================

export type APIResult<T> = Result<T, APIError>;
export type AsyncAPIResult<T> = Promise<APIResult<T>>;

// =============================================================================
// Common Enums
// =============================================================================

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum FilterOperator {
  EQUALS = 'eq',
  NOT_EQUALS = 'ne',
  GREATER_THAN = 'gt',
  GREATER_THAN_OR_EQUAL = 'gte',
  LESS_THAN = 'lt',
  LESS_THAN_OR_EQUAL = 'lte',
  IN = 'in',
  NOT_IN = 'nin',
  CONTAINS = 'contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
}

export enum CacheStrategy {
  NO_CACHE = 'no-cache',
  NO_STORE = 'no-store',
  RELOAD = 'reload',
  FORCE_CACHE = 'force-cache',
  ONLY_IF_CACHED = 'only-if-cached',
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
