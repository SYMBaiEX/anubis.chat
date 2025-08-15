/**
 * Type System Entry Point
 * Comprehensive type exports for the ANUBIS Chat application
 * Strict TypeScript - No any, unknown, or void types allowed
 */

// =============================================================================
// Core Types - Foundation types used throughout the app
// =============================================================================

export * from './convex-integration';
export type { Err, Ok, Result } from './result';

// =============================================================================
// API and Backend Integration Types
// =============================================================================

export * from './api';
export * from './api-schemas';

// =============================================================================
// Component and UI Types
// =============================================================================

export * from './components';

// =============================================================================
// AI and Agent System Types
// =============================================================================

export * from './agentic';
export * from './ai';
export * from './mcp';
export * from './tools';

// =============================================================================
// Document and Knowledge Management Types
// =============================================================================

export * from './documents';
export * from './memory';
export * from './rag-system';

// =============================================================================
// Real-time and Streaming Types
// =============================================================================

export * from './streaming-types';

// =============================================================================
// Business Logic Types
// =============================================================================

export * from './subscription-billing';

// =============================================================================
// Type Utilities and Helpers
// =============================================================================

// Import Convex types for proper typing
import type { Id as ConvexId } from '@convex/_generated/dataModel';

// Common utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] };
export type Nullable<T> = T | null;
export type NonNullable<T> = T extends null | undefined ? never : T;

// Array and object utilities
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

// Function utilities
export type AsyncFunction<T extends readonly unknown[], R> = (
  ...args: T
) => Promise<R>;
export type SyncFunction<T extends readonly unknown[], R> = (...args: T) => R;
export type AnyFunction = (...args: readonly unknown[]) => unknown;

// Event utilities
export type EventHandler<T = Event> = (event: T) => void;
export type AsyncEventHandler<T = Event> = (event: T) => Promise<void>;

// ID and reference utilities
export type EntityWithId<T extends string> = {
  _id: ConvexId<T>;
  _creationTime: number;
};
export type EntityReference<T extends string> = ConvexId<T> | EntityWithId<T>;

// Validation utilities
export type ValidationError = {
  field: string;
  message: string;
  code: string;
};

export type ValidationResult<T> = Result<T, ValidationError[]>;

// Pagination utilities
export type PaginatedData<T> = {
  data: T[];
  hasMore: boolean;
  nextCursor?: string;
  total?: number;
};

export type PaginationOptions = {
  limit?: number;
  cursor?: string;
  offset?: number;
};

// Search utilities
export type SearchOptions<T> = {
  query: string;
  filters?: Partial<T>;
  sort?: {
    field: keyof T;
    direction: 'asc' | 'desc';
  };
  pagination?: PaginationOptions;
};

export type SearchResults<T> = PaginatedData<T> & {
  query: string;
  searchTime: number;
  facets?: Record<string, Array<{ value: string; count: number }>>;
};

// State management utilities
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type AsyncState<T, E = Error> = {
  state: LoadingState;
  data?: T;
  error?: E;
};

export type OptimisticUpdate<T> = {
  id: string;
  data: T;
  status: 'pending' | 'success' | 'error';
  timestamp: number;
};

// Theme and styling utilities
export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorScheme = 'blue' | 'green' | 'purple' | 'orange' | 'red';
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ComponentVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

// Configuration utilities
export type FeatureFlag = {
  name: string;
  enabled: boolean;
  description?: string;
  rolloutPercentage?: number;
  conditions?: Record<string, unknown>;
};

export type AppConfig = {
  apiUrl: string;
  wsUrl: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  features: FeatureFlag[];
  limits: {
    maxFileSize: number;
    maxAttachments: number;
    maxMessageLength: number;
  };
};

// =============================================================================
// Common Enums and Constants
// =============================================================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

export const WS_READY_STATE = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
} as const;

export const MIME_TYPES = {
  JSON: 'application/json',
  HTML: 'text/html',
  PLAIN: 'text/plain',
  PDF: 'application/pdf',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  PNG: 'image/png',
  JPEG: 'image/jpeg',
  GIF: 'image/gif',
  SVG: 'image/svg+xml',
  MP4: 'video/mp4',
  WEBM: 'video/webm',
  MP3: 'audio/mpeg',
  WAV: 'audio/wav',
} as const;

export const FILE_EXTENSIONS = {
  PDF: '.pdf',
  DOCX: '.docx',
  XLSX: '.xlsx',
  TXT: '.txt',
  MD: '.md',
  HTML: '.html',
  JSON: '.json',
  CSV: '.csv',
  PNG: '.png',
  JPG: '.jpg',
  JPEG: '.jpeg',
  GIF: '.gif',
  SVG: '.svg',
  MP4: '.mp4',
  WEBM: '.webm',
  MP3: '.mp3',
  WAV: '.wav',
} as const;

// =============================================================================
// Type Guards and Runtime Checks
// =============================================================================

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isFunction(value: unknown): value is AnyFunction {
  return typeof value === 'function';
}

export function isPromise<T>(value: unknown): value is Promise<T> {
  return value instanceof Promise;
}

export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

export function isDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidUuid(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Result type guards
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.success === true;
}

export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return result.success === false;
}

// Optional and nullable guards
export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

export function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

export function isNonNullable<T>(
  value: T | null | undefined
): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

// =============================================================================
// Common Constants
// =============================================================================

export const DEFAULT_PAGINATION_LIMIT = 20;
export const MAX_PAGINATION_LIMIT = 100;
export const DEFAULT_SEARCH_TIMEOUT = 30_000; // 30 seconds
export const DEFAULT_REQUEST_TIMEOUT = 10_000; // 10 seconds
export const DEFAULT_WS_RECONNECT_DELAY = 1000; // 1 second
export const MAX_WS_RECONNECT_ATTEMPTS = 5;
export const DEFAULT_DEBOUNCE_DELAY = 300; // 300ms
export const DEFAULT_THROTTLE_DELAY = 1000; // 1 second

// File size limits
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_DOCUMENT_SIZE = 50 * 1024 * 1024; // 50MB

// Message limits
export const MAX_MESSAGE_LENGTH = 32_768; // 32K characters
export const MAX_MESSAGES_PER_CHAT = 10_000;
export const MAX_ATTACHMENTS_PER_MESSAGE = 10;

// Token limits
export const MAX_TOKENS_PER_REQUEST = 100_000;
export const MAX_CONTEXT_LENGTH = 200_000;

// Rate limiting
export const DEFAULT_RATE_LIMIT = 60; // requests per minute
export const BURST_RATE_LIMIT = 10; // requests per second

// =============================================================================
// Global Type Declarations
// =============================================================================

// Extend Window interface for global properties
declare global {
  interface Window {
    // Add any global window properties here
    __APP_CONFIG__?: AppConfig;
    __FEATURE_FLAGS__?: FeatureFlag[];
  }
}

// Environment variables
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_CONVEX_URL: string;
      NEXT_PUBLIC_APP_URL: string;
      NEXT_PUBLIC_WS_URL: string;
      NEXT_PUBLIC_ENVIRONMENT: 'development' | 'staging' | 'production';
    }
  }
}

// =============================================================================
// Module Augmentations
// =============================================================================

// Augment the Convex types if needed
declare module '@convex/_generated/dataModel' {
  // Add any additional type augmentations here
}

// Augment React types if needed
declare module 'react' {
  // Add any React type augmentations here
}
