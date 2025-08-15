/**
 * Convex Integration Types
 * Comprehensive type definitions bridging frontend and backend Convex schemas
 * Strict TypeScript - No any, unknown, or void types allowed
 */

import type { Id, TableNames } from '@convex/_generated/dataModel';
import type { Result } from './result';

// =============================================================================
// Core ID Types - Bridging Convex IDs with Frontend
// =============================================================================

export type ConvexId<T extends TableNames> = Id<T>;

// Common ID types used throughout the application
export type ChatId = ConvexId<'chats'>;
export type MessageId = ConvexId<'messages'>;
export type UserId = ConvexId<'users'>;
export type AgentId = ConvexId<'agents'>;
export type DocumentId = ConvexId<'documents'>;
export type DocumentChunkId = ConvexId<'documentChunks'>;
export type VectorStoreId = ConvexId<'vectorStores'>;
export type KnowledgeBaseId = ConvexId<'knowledgeBases'>;
export type TeamId = ConvexId<'teams'>;
export type WorkflowId = ConvexId<'workflows'>;
export type AgentExecutionId = ConvexId<'agentExecutions'>;
export type StreamingSessionId = ConvexId<'streamingSessions'>;
export type McpServerId = ConvexId<'mcpServers'>;

// =============================================================================
// Enhanced Message Types with Complete Metadata
// =============================================================================

export interface ConvexMessage {
  _id: MessageId;
  _creationTime: number;
  chatId: ChatId;
  walletAddress: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokenCount?: number;
  embedding?: number[];
  metadata?: ConvexMessageMetadata;
  status?: string;
  parentMessageId?: MessageId;
}

export interface ConvexMessageMetadata {
  model?: string;
  finishReason?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  tools?: ConvexToolExecution[];
  reasoning?: string;
  citations?: string[]; // Document IDs for RAG
  attachments?: ConvexMessageAttachment[];
  // Message editing and reactions
  edited?: boolean;
  editedAt?: number;
  regenerated?: boolean;
  regeneratedAt?: number;
  reactions?: Record<string, MessageReaction[]>; // userId -> reactions
  lastReactionAt?: number;
}

export interface ConvexMessageAttachment {
  fileId: string;
  url?: string;
  mimeType: string;
  size: number;
  type: 'image' | 'file' | 'video';
}

export interface ConvexToolExecution {
  id: string;
  name: string;
  args: ConvexToolParameters;
  result?: {
    success: boolean;
    data?: ConvexToolResult;
    error?: string;
    executionTime?: number;
  };
}

export type ConvexToolParameters =
  | string
  | number
  | boolean
  | null
  | {
      query?: string;
      limit?: number;
      offset?: number;
      filters?: Record<string, string>;
      options?: Record<string, string | number | boolean>;
      data?: Record<string, string | number | boolean>;
      config?: Record<string, string | number | boolean>;
    }
  | Array<string | number | boolean>;

export type ConvexToolResult =
  | string
  | number
  | boolean
  | null
  | {
      status?: string;
      message?: string;
      data?: string | number | boolean;
      metadata?: Record<string, string | number | boolean>;
    }
  | Array<string | number | boolean>;

export type MessageReaction =
  | 'like'
  | 'dislike'
  | 'love'
  | 'celebrate'
  | 'insightful';

// =============================================================================
// Enhanced Chat Types with Agent Integration
// =============================================================================

export interface ConvexChat {
  _id: ChatId;
  _creationTime: number;
  title: string;
  description?: string;
  ownerId: string;
  model: string;
  systemPrompt?: string;
  agentPrompt?: string;
  agentId?: AgentId;
  temperature?: number;
  maxTokens?: number;
  isActive: boolean;
  isArchived: boolean;
  isPinned: boolean;
  lastMessageAt?: number;
  tokenUsage?: ConvexTokenUsage;
}

export interface ConvexTokenUsage {
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  totalCachedTokens: number;
  totalEstimatedCost: number;
  messageCount: number;
}

// =============================================================================
// Agent System Types from Backend Schema
// =============================================================================

export interface ConvexAgent {
  _id: AgentId;
  _creationTime: number;
  name: string;
  type: 'general' | 'trading' | 'defi' | 'nft' | 'dao' | 'portfolio' | 'custom';
  description: string;
  systemPrompt: string;
  capabilities: string[]; // List of available tools/actions
  model?: string;
  version?: string;
  temperature?: number;
  maxTokens?: number;
  config?: {
    rpcUrl?: string;
    priorityFee?: number;
    slippage?: number;
    gasBudget?: number;
  };
  mcpServers?: ConvexMcpServerConfig[];
  isActive: boolean;
  isPublic: boolean;
  createdBy?: string; // walletAddress for custom agents
  createdAt: number;
  updatedAt: number;
}

export interface ConvexMcpServerConfig {
  name: string; // Server name (e.g., 'context7', 'filesystem')
  enabled: boolean;
  config?: Record<string, string | number | boolean>; // Server-specific configuration
}

export interface ConvexAgentSession {
  _id: ConvexId<'agentSessions'>;
  _creationTime: number;
  chatId: ChatId;
  agentId: AgentId;
  userId: string; // walletAddress
  context?: {
    lastAction?: string;
    pendingTransactions?: string[];
    walletBalance?: number;
    activePositions?: string[];
    preferences?: {
      riskLevel?: 'low' | 'medium' | 'high';
      maxSlippage?: number;
      autoConfirm?: boolean;
    };
  };
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ConvexAgentExecution {
  _id: AgentExecutionId;
  _creationTime: number;
  agentId: AgentId;
  walletAddress: string;
  status:
    | 'pending'
    | 'running'
    | 'waiting_approval'
    | 'completed'
    | 'failed'
    | 'cancelled';
  input: string;
  result?: {
    success: boolean;
    output: string;
    finalStep: number;
    totalSteps: number;
    toolsUsed: string[];
    tokensUsed: {
      input: number;
      output: number;
      total: number;
    };
    executionTime: number;
    cost: number;
  };
  steps?: ConvexAgentStep[];
  error?: ConvexErrorDetails;
  startedAt: number;
  completedAt?: number;
  metadata?: ConvexExecutionMetadata;
}

export interface ConvexAgentStep {
  _id: ConvexId<'agentSteps'>;
  _creationTime: number;
  executionId: AgentExecutionId;
  stepNumber: number;
  type: 'reasoning' | 'tool_call' | 'wait_approval' | 'completed' | 'error';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'waiting_approval';
  input?: string;
  toolCalls?: string[]; // JSON serialized tool calls
  toolResults?: string[]; // JSON serialized tool results
  output?: string;
  reasoning?: string;
  error?: ConvexErrorDetails;
  startedAt: number;
  completedAt?: number;
  tokenUsage?: {
    input: number;
    output: number;
    total: number;
  };
  cost?: number;
  metadata?: ConvexExecutionMetadata;
}

export interface ConvexErrorDetails {
  code?: string;
  message?: string;
  stack?: string;
  context?: Record<string, string>;
  timestamp?: number;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface ConvexExecutionMetadata {
  source?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  tags?: string[];
  environment?: string;
  timeout?: number;
  retryPolicy?: {
    maxRetries: number;
    backoffMultiplier?: number;
    initialDelay?: number;
  };
  custom?: Record<string, string | number | boolean>;
}

// =============================================================================
// RAG System Types from Backend Schema
// =============================================================================

export interface ConvexDocument {
  _id: DocumentId;
  _creationTime: number;
  walletAddress: string;
  title: string;
  description?: string;
  type:
    | 'pdf'
    | 'txt'
    | 'docx'
    | 'md'
    | 'html'
    | 'csv'
    | 'json'
    | 'xml'
    | 'url'
    | 'api';
  content: string;
  url?: string;
  metadata?: ConvexDocumentMetadata;
  status: 'processing' | 'completed' | 'failed' | 'archived';
  size: number;
  hash: string; // Content hash for deduplication
  uploadedAt: number;
  processedAt?: number;
  lastAccessedAt?: number;
  accessCount: number;
  knowledgeBaseId?: KnowledgeBaseId;
  vectorStoreId?: VectorStoreId;
  // Chunking settings
  chunkingSettings?: {
    method: 'fixed' | 'semantic' | 'markdown' | 'auto';
    chunkSize: number;
    overlap: number;
    separators?: string[];
  };
  processingSettings?: {
    extractImages: boolean;
    extractTables: boolean;
    ocrEnabled: boolean;
    languageDetection: boolean;
  };
}

export interface ConvexDocumentMetadata {
  author?: string;
  createdAt?: number;
  modifiedAt?: number;
  language?: string;
  tags?: string[];
  category?: string;
  version?: string;
  source?: string;
  extractedMetadata?: Record<string, string | number | boolean>;
  customFields?: Record<string, string | number | boolean>;
}

export interface ConvexDocumentChunk {
  _id: DocumentChunkId;
  _creationTime: number;
  documentId: DocumentId;
  chunkIndex: number;
  content: string;
  embedding?: number[];
  startOffset: number;
  endOffset: number;
  metadata?: {
    section?: string;
    pageNumber?: number;
    headings?: string[];
    type?: 'text' | 'table' | 'image' | 'code';
    language?: string;
  };
  tokenCount: number;
  walletAddress: string;
}

export interface ConvexVectorStore {
  _id: VectorStoreId;
  _creationTime: number;
  name: string;
  description?: string;
  walletAddress: string;
  embeddingModel: string;
  dimensions: number;
  metric: 'cosine' | 'euclidean' | 'dot_product';
  documentCount: number;
  chunkCount: number;
  totalTokens: number;
  status: 'active' | 'indexing' | 'error' | 'archived';
  settings?: {
    indexType?: string;
    shards?: number;
    replicas?: number;
    threshold?: number;
  };
  createdAt: number;
  updatedAt: number;
  lastIndexedAt?: number;
}

export interface ConvexKnowledgeBase {
  _id: KnowledgeBaseId;
  _creationTime: number;
  name: string;
  description?: string;
  walletAddress: string;
  vectorStoreId: VectorStoreId;
  documentIds: DocumentId[];
  settings: {
    autoSync: boolean;
    syncSchedule?: string;
    embeddingModel: string;
    chunkingStrategy: 'fixed' | 'semantic' | 'markdown' | 'auto';
    chunkSize: number;
    overlap: number;
  };
  stats?: {
    totalDocuments: number;
    totalChunks: number;
    totalTokens: number;
    lastSyncAt?: number;
    avgRetrievalScore?: number;
  };
  isPublic: boolean;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

// =============================================================================
// Streaming Session Types from Backend Schema
// =============================================================================

export interface ConvexStreamingSession {
  _id: StreamingSessionId;
  _creationTime: number;
  chatId: ChatId;
  messageId: MessageId;
  userId: UserId;
  status: 'initializing' | 'streaming' | 'completed' | 'error' | 'cancelled';
  content: string;
  streamType: 'text' | 'tool_calls' | 'artifacts' | 'mixed';
  model?: string;
  tokens: {
    input: number;
    output: number;
    cached?: number;
  };
  artifacts?: ConvexStreamingArtifact[];
  toolCalls?: ConvexStreamingToolCall[];
  reasoning?: string;
  citations?: string[];
  error?: ConvexErrorDetails;
  startedAt: number;
  completedAt?: number;
  lastUpdatedAt: number;
  metadata?: {
    temperature?: number;
    maxTokens?: number;
    stopReason?: string;
    clientVersion?: string;
    userAgent?: string;
  };
}

export interface ConvexStreamingArtifact {
  id: string;
  type: 'document' | 'code' | 'markdown' | 'image' | 'chart' | 'table';
  title: string;
  content?: string;
  code?: string;
  language?: string;
  framework?: string;
  description?: string;
  metadata?: Record<string, string | number | boolean>;
  createdAt: number;
}

export interface ConvexStreamingToolCall {
  id: string;
  name: string;
  args: Record<string, string | number | boolean | null>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: ConvexToolResult;
  error?: string;
  startedAt: number;
  completedAt?: number;
}

// =============================================================================
// MCP Integration Types from Backend Schema
// =============================================================================

export interface ConvexMcpServer {
  _id: McpServerId;
  _creationTime: number;
  name: string;
  description?: string;
  url: string;
  transport: 'stdio' | 'sse' | 'http' | 'websocket';
  config: Record<string, string | number | boolean>;
  status: 'active' | 'inactive' | 'error' | 'maintenance';
  capabilities: {
    tools: boolean;
    resources: boolean;
    prompts: boolean;
    logging: boolean;
  };
  tools?: string[]; // Available tool names
  version?: string;
  isPublic: boolean;
  walletAddress?: string; // For private servers
  healthcheck?: {
    endpoint?: string;
    interval?: number;
    timeout?: number;
    retries?: number;
  };
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
    burstSize?: number;
  };
  createdAt: number;
  updatedAt: number;
  lastHealthCheck?: number;
  metadata?: Record<string, string | number | boolean>;
}

export interface ConvexMcpToolCall {
  _id: ConvexId<'mcpToolCalls'>;
  _creationTime: number;
  serverId: McpServerId;
  toolName: string;
  walletAddress: string;
  sessionId?: string;
  input: Record<string, string | number | boolean | null>;
  output?: Record<string, string | number | boolean | null>;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
  error?: ConvexErrorDetails;
  executionTime?: number;
  tokenUsage?: {
    input?: number;
    output?: number;
    total?: number;
  };
  cost?: number;
  startedAt: number;
  completedAt?: number;
  metadata?: Record<string, string | number | boolean>;
}

// =============================================================================
// Request/Response Types for Convex Functions
// =============================================================================

export interface CreateChatParams {
  title: string;
  ownerId: string;
  model: string;
  systemPrompt?: string;
  agentPrompt?: string;
  agentId?: AgentId;
  temperature?: number;
  maxTokens?: number;
}

export interface CreateMessageParams {
  chatId: ChatId;
  walletAddress: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: ConvexMessageAttachment[];
  tokenCount?: number;
  embedding?: number[];
  metadata?: ConvexMessageMetadata;
  status?: string;
  parentMessageId?: MessageId;
}

export interface UpdateChatParams {
  id: ChatId;
  ownerId: string;
  title?: string;
  model?: string;
  systemPrompt?: string;
  agentPrompt?: string;
  agentId?: AgentId;
  temperature?: number;
  maxTokens?: number;
  isActive?: boolean;
}

export interface StreamingSessionParams {
  chatId: ChatId;
  messageId: MessageId;
  userId: UserId;
  model?: string;
  streamType?: 'text' | 'tool_calls' | 'artifacts' | 'mixed';
  metadata?: Record<string, string | number | boolean>;
}

// =============================================================================
// Result Types
// =============================================================================

export type ConvexOperationResult<T> = Result<T, ConvexError>;
export type AsyncConvexOperationResult<T> = Promise<ConvexOperationResult<T>>;

export interface ConvexError {
  code: string;
  message: string;
  details?: Record<string, string | number | boolean>;
  statusCode?: number;
  timestamp: number;
}

// =============================================================================
// Export Helper Types
// =============================================================================

export type WithId<T> = T & { _id: string; _creationTime: number };
export type WithoutId<T> = Omit<T, '_id' | '_creationTime'>;
export type ConvexDocument_Args<T> = Omit<T, '_id' | '_creationTime'>;
