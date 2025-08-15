/**
 * Streaming Types for Real-time Communication
 * Comprehensive type definitions for WebSocket streaming, real-time updates, and live chat features
 * Strict TypeScript - No any, unknown, or void types allowed
 */

import type {
  ChatId,
  ConvexStreamingArtifact,
  ConvexStreamingSession,
  ConvexStreamingToolCall,
  MessageId,
  StreamingSessionId,
  UserId,
} from './convex-integration';
import type { Result } from './result';

// =============================================================================
// WebSocket Connection Types
// =============================================================================

export interface WebSocketConnection {
  id: string;
  url: string;
  state: WebSocketState;
  protocols?: string[];
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  reconnectDelay: number;
  lastConnected?: number;
  lastDisconnected?: number;
  pingInterval?: number;
  pongTimeout?: number;
  metadata?: ConnectionMetadata;
}

export type WebSocketState =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'error'
  | 'closed';

export interface ConnectionMetadata {
  userId?: string;
  sessionId?: string;
  clientVersion?: string;
  userAgent?: string;
  ipAddress?: string;
  connectionQuality?: ConnectionQuality;
  bandwidth?: BandwidthInfo;
}

export interface ConnectionQuality {
  latency: number; // ms
  packetLoss: number; // percentage
  stability: QualityLevel;
  throughput: number; // bytes/sec
}

export type QualityLevel = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

export interface BandwidthInfo {
  upload: number; // bytes/sec
  download: number; // bytes/sec
  measurementTime: number;
  reliability: number; // 0-1
}

// =============================================================================
// Streaming Session Management Types
// =============================================================================

export interface StreamingSessionConfig {
  sessionId: string;
  chatId: ChatId;
  messageId?: MessageId;
  userId: UserId;
  streamType: StreamType;
  model?: string;
  parameters?: StreamingParameters;
  bufferSize?: number;
  flushInterval?: number;
  maxDuration?: number;
  quality?: StreamQuality;
}

export type StreamType =
  | 'text_generation'
  | 'tool_execution'
  | 'artifact_creation'
  | 'multi_modal'
  | 'code_execution'
  | 'reasoning'
  | 'mixed_content';

export interface StreamingParameters {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  stopSequences?: string[];
  enableReasoning?: boolean;
  includeThinking?: boolean;
  streamToolCalls?: boolean;
  streamArtifacts?: boolean;
}

export interface StreamQuality {
  level: StreamQualityLevel;
  targetLatency: number; // ms
  maxBufferDelay: number; // ms
  compressionLevel: number; // 0-9
  adaptiveStreaming: boolean;
  prioritizeAccuracy: boolean;
}

export type StreamQualityLevel =
  | 'low'
  | 'medium'
  | 'high'
  | 'ultra'
  | 'adaptive';

export interface StreamingSession extends ConvexStreamingSession {
  connection?: WebSocketConnection;
  localState?: StreamingLocalState;
  buffer?: StreamingBuffer;
  metrics?: StreamingMetrics;
}

export interface StreamingLocalState {
  lastReceivedChunk: number;
  expectedSequence: number;
  missingChunks: number[];
  bufferState: BufferState;
  displayState: DisplayState;
}

export type BufferState =
  | 'empty'
  | 'filling'
  | 'ready'
  | 'flushing'
  | 'overflow';
export type DisplayState =
  | 'waiting'
  | 'streaming'
  | 'paused'
  | 'completed'
  | 'error';

export interface StreamingBuffer {
  chunks: StreamingChunk[];
  maxSize: number;
  currentSize: number;
  flushThreshold: number;
  autoFlush: boolean;
  compression: boolean;
}

export interface StreamingChunk {
  id: string;
  sequence: number;
  type: ChunkType;
  data: ChunkData;
  metadata: ChunkMetadata;
  timestamp: number;
  size: number;
}

export type ChunkType =
  | 'text_delta'
  | 'tool_call_start'
  | 'tool_call_delta'
  | 'tool_call_end'
  | 'artifact_start'
  | 'artifact_delta'
  | 'artifact_end'
  | 'reasoning_delta'
  | 'metadata_update'
  | 'error'
  | 'completion';

export type ChunkData =
  | TextDelta
  | ToolCallDelta
  | ArtifactDelta
  | ReasoningDelta
  | MetadataUpdate
  | ErrorDelta
  | CompletionDelta;

export interface TextDelta {
  content: string;
  position: number;
  isComplete: boolean;
}

export interface ToolCallDelta {
  toolCallId: string;
  toolName?: string;
  argumentsDelta?: string;
  resultDelta?: string;
  status?: ToolCallStatus;
  error?: string;
}

export type ToolCallStatus =
  | 'starting'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface ArtifactDelta {
  artifactId: string;
  artifactType?: string;
  title?: string;
  contentDelta?: string;
  metadata?: Record<string, string | number | boolean>;
  isComplete?: boolean;
}

export interface ReasoningDelta {
  step: string;
  thought?: string;
  conclusion?: string;
  confidence?: number;
}

export interface MetadataUpdate {
  field: string;
  value: string | number | boolean | null;
  operation: 'set' | 'append' | 'increment' | 'delete';
}

export interface ErrorDelta {
  code: string;
  message: string;
  details?: Record<string, string | number | boolean>;
  retryable: boolean;
  stage: string;
}

export interface CompletionDelta {
  reason: CompletionReason;
  totalTokens?: number;
  cost?: number;
  duration: number;
  quality?: QualityMetrics;
}

export type CompletionReason =
  | 'stop'
  | 'length'
  | 'tool_calls'
  | 'user_stop'
  | 'error'
  | 'timeout'
  | 'rate_limit';

export interface ChunkMetadata {
  sessionId: string;
  messageId?: MessageId;
  priority: ChunkPriority;
  compression?: CompressionInfo;
  checksum?: string;
  retryCount?: number;
  source?: string;
}

export type ChunkPriority = 'low' | 'normal' | 'high' | 'urgent' | 'critical';

export interface CompressionInfo {
  algorithm: 'none' | 'gzip' | 'brotli' | 'lz4';
  originalSize: number;
  compressedSize: number;
  ratio: number;
}

// =============================================================================
// Streaming Metrics and Analytics Types
// =============================================================================

export interface StreamingMetrics {
  session: SessionMetrics;
  performance: PerformanceMetrics;
  quality: QualityMetrics;
  network: NetworkMetrics;
  user: UserMetrics;
}

export interface SessionMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  totalChunks: number;
  successfulChunks: number;
  failedChunks: number;
  retransmissions: number;
  averageChunkSize: number;
  peakBufferSize: number;
}

export interface PerformanceMetrics {
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  throughput: number; // chunks/sec
  bandwidthUtilization: number; // bytes/sec
  cpuUsage?: number;
  memoryUsage?: number;
  renderingLatency?: number;
}

export interface QualityMetrics {
  overallScore: number; // 0-1
  completeness: number; // 0-1
  accuracy: number; // 0-1
  timeliness: number; // 0-1
  consistency: number; // 0-1
  issues?: QualityIssue[];
}

export interface QualityIssue {
  type: QualityIssueType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  affectedChunks?: string[];
}

export type QualityIssueType =
  | 'out_of_order'
  | 'missing_chunk'
  | 'duplicate_chunk'
  | 'corrupted_data'
  | 'format_error'
  | 'timeout'
  | 'buffer_overflow';

export interface NetworkMetrics {
  connectionCount: number;
  reconnections: number;
  bytesReceived: number;
  bytesSent: number;
  packetsLost: number;
  averageRtt: number;
  jitter: number;
  bandwidthPeakUsage: number;
}

export interface UserMetrics {
  interactionLatency: number;
  scrollEvents: number;
  clickEvents: number;
  typingEvents: number;
  focusTime: number;
  satisfaction?: UserSatisfaction;
}

export interface UserSatisfaction {
  responseSpeed: number; // 1-5
  contentQuality: number; // 1-5
  interactionSmooth: number; // 1-5
  overallRating: number; // 1-5
  feedback?: string;
}

// =============================================================================
// Real-time Update Types
// =============================================================================

export interface RealtimeUpdate {
  id: string;
  type: UpdateType;
  target: UpdateTarget;
  action: UpdateAction;
  data: UpdateData;
  metadata: UpdateMetadata;
  timestamp: number;
  priority: UpdatePriority;
}

export type UpdateType =
  | 'message'
  | 'chat'
  | 'user_presence'
  | 'typing_indicator'
  | 'reaction'
  | 'system_notification'
  | 'agent_status'
  | 'tool_execution'
  | 'artifact_change';

export interface UpdateTarget {
  type: 'chat' | 'message' | 'user' | 'global';
  id: string;
  scope?: UpdateScope;
}

export type UpdateScope =
  | 'private'
  | 'chat_participants'
  | 'team'
  | 'public'
  | 'system';

export type UpdateAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'started'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused'
  | 'resumed';

export type UpdateData =
  | MessageUpdate
  | ChatUpdate
  | PresenceUpdate
  | TypingUpdate
  | ReactionUpdate
  | SystemUpdate
  | AgentUpdate
  | ToolUpdate
  | ArtifactUpdate;

export interface MessageUpdate {
  messageId: MessageId;
  chatId: ChatId;
  content?: string;
  role?: string;
  status?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface ChatUpdate {
  chatId: ChatId;
  title?: string;
  lastMessageAt?: number;
  participantCount?: number;
  settings?: Record<string, string | number | boolean>;
}

export interface PresenceUpdate {
  userId: string;
  status: PresenceStatus;
  lastSeen?: number;
  currentChat?: ChatId;
  activity?: UserActivity;
}

export type PresenceStatus =
  | 'online'
  | 'away'
  | 'busy'
  | 'invisible'
  | 'offline';

export interface UserActivity {
  type: ActivityType;
  description?: string;
  timestamp: number;
  metadata?: Record<string, string | number | boolean>;
}

export type ActivityType =
  | 'typing'
  | 'reading'
  | 'browsing'
  | 'idle'
  | 'in_call'
  | 'presenting'
  | 'away_from_keyboard';

export interface TypingUpdate {
  userId: string;
  chatId: ChatId;
  isTyping: boolean;
  timestamp: number;
  estimatedFinish?: number;
}

export interface ReactionUpdate {
  messageId: MessageId;
  userId: string;
  reaction: string;
  action: 'added' | 'removed';
  timestamp: number;
}

export interface SystemUpdate {
  type: SystemUpdateType;
  message: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  affectedUsers?: string[];
  actionRequired?: boolean;
}

export type SystemUpdateType =
  | 'maintenance'
  | 'outage'
  | 'feature_update'
  | 'security_alert'
  | 'quota_warning'
  | 'rate_limit'
  | 'api_change';

export interface AgentUpdate {
  agentId: string;
  executionId?: string;
  status: string;
  progress?: number;
  currentStep?: string;
  output?: string;
  error?: string;
}

export interface ToolUpdate {
  toolCallId: string;
  toolName: string;
  status: ToolCallStatus;
  progress?: number;
  result?: string;
  error?: string;
}

export interface ArtifactUpdate {
  artifactId: string;
  type: string;
  title?: string;
  content?: string;
  status: ArtifactStatus;
  progress?: number;
}

export type ArtifactStatus =
  | 'creating'
  | 'updating'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface UpdateMetadata {
  source: string;
  version: string;
  retry?: number;
  correlationId?: string;
  causedBy?: string;
  batchId?: string;
}

export type UpdatePriority = 'low' | 'normal' | 'high' | 'urgent' | 'critical';

// =============================================================================
// Live Features Types
// =============================================================================

export interface LiveFeatures {
  typingIndicators: TypingIndicatorManager;
  presenceTracking: PresenceTracker;
  liveReactions: LiveReactionManager;
  collaborativeEditing: CollaborativeEditor;
  liveNotifications: LiveNotificationManager;
}

export interface TypingIndicatorManager {
  activeIndicators: Map<string, TypingIndicator>;
  config: TypingIndicatorConfig;
  startTyping: (chatId: ChatId, userId: string) => void;
  stopTyping: (chatId: ChatId, userId: string) => void;
  getTypingUsers: (chatId: ChatId) => TypingUser[];
}

export interface TypingIndicator {
  userId: string;
  chatId: ChatId;
  startTime: number;
  lastUpdate: number;
  estimatedFinish?: number;
}

export interface TypingIndicatorConfig {
  timeout: number; // ms
  updateInterval: number; // ms
  showEstimatedFinish: boolean;
  maxConcurrentIndicators: number;
  animationDuration: number;
}

export interface TypingUser {
  userId: string;
  displayName: string;
  avatar?: string;
  startTime: number;
  estimatedFinish?: number;
}

export interface PresenceTracker {
  userPresence: Map<string, UserPresence>;
  config: PresenceConfig;
  updatePresence: (userId: string, status: PresenceStatus) => void;
  getPresence: (userId: string) => UserPresence | null;
  subscribeToPresence: (
    userIds: string[],
    callback: PresenceCallback
  ) => SubscriptionHandle;
}

export interface UserPresence {
  userId: string;
  status: PresenceStatus;
  lastSeen: number;
  currentActivity?: UserActivity;
  metadata?: PresenceMetadata;
}

export interface PresenceMetadata {
  device?: string;
  location?: string;
  timezone?: string;
  capabilities?: string[];
}

export interface PresenceConfig {
  updateInterval: number; // ms
  awayTimeout: number; // ms
  offlineTimeout: number; // ms
  trackActivity: boolean;
  trackLocation: boolean;
}

export type PresenceCallback = (updates: PresenceUpdate[]) => void;

export interface LiveReactionManager {
  activeReactions: Map<string, LiveReaction[]>;
  config: LiveReactionConfig;
  addReaction: (messageId: MessageId, userId: string, reaction: string) => void;
  removeReaction: (
    messageId: MessageId,
    userId: string,
    reaction: string
  ) => void;
  getReactions: (messageId: MessageId) => LiveReaction[];
}

export interface LiveReaction {
  messageId: MessageId;
  userId: string;
  reaction: string;
  timestamp: number;
  animation?: ReactionAnimation;
}

export interface ReactionAnimation {
  type: 'bounce' | 'fade' | 'zoom' | 'slide' | 'pulse';
  duration: number;
  easing: string;
  delay?: number;
}

export interface LiveReactionConfig {
  maxReactionsPerMessage: number;
  animationDuration: number;
  groupSimilarReactions: boolean;
  showReactionCount: boolean;
  allowCustomReactions: boolean;
}

export interface CollaborativeEditor {
  sessions: Map<string, EditingSession>;
  cursors: Map<string, CursorPosition>;
  selections: Map<string, SelectionRange>;
  config: CollaborativeConfig;
}

export interface EditingSession {
  sessionId: string;
  userId: string;
  documentId: string;
  startTime: number;
  lastActivity: number;
  permissions: EditingPermissions;
}

export interface EditingPermissions {
  canEdit: boolean;
  canComment: boolean;
  canSuggest: boolean;
  canShare: boolean;
  sections?: string[];
}

export interface CursorPosition {
  userId: string;
  position: number;
  timestamp: number;
  color?: string;
  label?: string;
}

export interface SelectionRange {
  userId: string;
  start: number;
  end: number;
  timestamp: number;
  type: 'text' | 'code' | 'suggestion';
}

export interface CollaborativeConfig {
  maxConcurrentEditors: number;
  cursorUpdateInterval: number;
  conflictResolution: 'last_write_wins' | 'operational_transform' | 'crdt';
  showCursors: boolean;
  showSelections: boolean;
}

export interface LiveNotificationManager {
  activeNotifications: LiveNotification[];
  config: NotificationConfig;
  queue: NotificationQueue;
  showNotification: (notification: LiveNotification) => void;
  dismissNotification: (id: string) => void;
  clearAll: () => void;
}

export interface LiveNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  category: NotificationCategory;
  timestamp: number;
  expiresAt?: number;
  actions?: NotificationAction[];
  metadata?: NotificationMetadata;
}

export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'system'
  | 'message'
  | 'mention'
  | 'reaction';

export type NotificationPriority =
  | 'low'
  | 'normal'
  | 'high'
  | 'urgent'
  | 'critical';

export type NotificationCategory =
  | 'chat'
  | 'system'
  | 'agent'
  | 'tool'
  | 'security'
  | 'billing'
  | 'feature'
  | 'social';

export interface NotificationAction {
  id: string;
  label: string;
  action: NotificationActionType;
  url?: string;
  payload?: Record<string, string | number | boolean>;
  style?: 'primary' | 'secondary' | 'danger' | 'success';
}

export type NotificationActionType =
  | 'dismiss'
  | 'navigate'
  | 'callback'
  | 'external_link'
  | 'share'
  | 'download';

export interface NotificationMetadata {
  chatId?: ChatId;
  messageId?: MessageId;
  userId?: string;
  agentId?: string;
  correlationId?: string;
  source?: string;
}

export interface NotificationConfig {
  maxVisible: number;
  defaultDuration: number;
  groupSimilar: boolean;
  showToasts: boolean;
  playSound: boolean;
  persistentTypes: NotificationType[];
}

export interface NotificationQueue {
  pending: LiveNotification[];
  processing: LiveNotification[];
  maxSize: number;
  priorityOrdering: boolean;
  batchProcessing: boolean;
}

// =============================================================================
// Subscription and Event Handling Types
// =============================================================================

export interface SubscriptionHandle {
  id: string;
  type: string;
  target: string;
  active: boolean;
  unsubscribe: () => void;
  pause: () => void;
  resume: () => void;
}

export interface EventSubscription<T = UpdateData> {
  handle: SubscriptionHandle;
  filter?: EventFilter;
  callback: EventCallback<T>;
  config?: SubscriptionConfig;
}

export interface EventFilter {
  types?: UpdateType[];
  targets?: string[];
  actions?: UpdateAction[];
  priority?: UpdatePriority[];
  userId?: string;
  custom?: Record<string, string | number | boolean>;
}

export type EventCallback<T = UpdateData> = (
  event: RealtimeUpdate & { data: T }
) => void;

export interface SubscriptionConfig {
  bufferSize?: number;
  batchDelay?: number;
  errorRetry?: boolean;
  maxRetries?: number;
  backoffMultiplier?: number;
}

// =============================================================================
// Error and Result Types
// =============================================================================

export type StreamingResult<T> = Result<T, StreamingError>;
export type AsyncStreamingResult<T> = Promise<StreamingResult<T>>;

export interface StreamingError {
  code: StreamingErrorCode;
  message: string;
  stage: StreamingErrorStage;
  details?: Record<string, string | number | boolean>;
  retryable: boolean;
  suggestion?: string;
  networkRelated: boolean;
}

export type StreamingErrorCode =
  | 'CONNECTION_FAILED'
  | 'AUTHENTICATION_FAILED'
  | 'PROTOCOL_ERROR'
  | 'TIMEOUT'
  | 'RATE_LIMITED'
  | 'BUFFER_OVERFLOW'
  | 'CHUNK_CORRUPTION'
  | 'SEQUENCE_ERROR'
  | 'COMPRESSION_ERROR'
  | 'NETWORK_ERROR'
  | 'CLIENT_ERROR'
  | 'SERVER_ERROR';

export type StreamingErrorStage =
  | 'connection'
  | 'authentication'
  | 'session_setup'
  | 'data_streaming'
  | 'chunk_processing'
  | 'buffer_management'
  | 'display_rendering'
  | 'cleanup';
