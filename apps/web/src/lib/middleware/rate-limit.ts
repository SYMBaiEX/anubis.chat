/**
 * Rate Limiting Middleware for ISIS Chat
 * Based on wallet addresses and August 2025 best practices
 */

import { NextRequest } from 'next/server';
import { APIErrorCode } from '../types/api';
import { rateLimitResponse, addRateLimitHeaders } from '../utils/api-response';
import { extractWalletFromRequest } from './auth';

// =============================================================================
// Extended Request Interface
// =============================================================================

interface ExtendedNextRequest extends NextRequest {
  ip?: string;
}

// =============================================================================
// Types
// =============================================================================

export interface RateLimitOptions {
  windowMs: number;           // Time window in milliseconds
  maxRequests: number;        // Max requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (request: NextRequest) => string;
  onLimitReached?: (key: string, request: NextRequest) => void;
}

export interface RateLimitInfo {
  totalHits: number;
  totalHitsRemaining: number;
  resetTime: Date;
  retryAfter?: number;
}

// =============================================================================
// In-Memory Store (Production should use Redis)
// =============================================================================

interface RateLimitEntry {
  totalHits: number;
  resetTime: Date;
}

class MemoryStore {
  private store = new Map<string, RateLimitEntry>();

  get(key: string): RateLimitEntry | undefined {
    const entry = this.store.get(key);
    
    // Remove expired entries
    if (entry && entry.resetTime < new Date()) {
      this.store.delete(key);
      return undefined;
    }
    
    return entry;
  }

  set(key: string, value: RateLimitEntry): void {
    this.store.set(key, value);
  }

  increment(key: string, windowMs: number): RateLimitEntry {
    const now = new Date();
    const resetTime = new Date(Date.now() + windowMs);
    
    let entry = this.get(key);
    
    if (!entry) {
      entry = { totalHits: 1, resetTime };
    } else {
      entry.totalHits++;
    }
    
    this.set(key, entry);
    return entry;
  }

  cleanup(): void {
    const now = new Date();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now) {
        this.store.delete(key);
      }
    }
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  entries(): IterableIterator<[string, RateLimitEntry]> {
    return this.store.entries();
  }
}

const store = new MemoryStore();

// Cleanup expired entries every 5 minutes
setInterval(() => store.cleanup(), 5 * 60 * 1000);

// =============================================================================
// Rate Limit Configurations
// =============================================================================

export const rateLimitConfigs = {
  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 10,           // 10 attempts per 15 minutes
  },
  
  // Message sending
  messages: {
    windowMs: 60 * 1000,       // 1 minute
    maxRequests: 30,           // 30 messages per minute
  },
  
  // Chat operations
  chats: {
    windowMs: 60 * 1000,       // 1 minute
    maxRequests: 60,           // 60 operations per minute
  },
  
  // AI requests
  ai: {
    windowMs: 60 * 1000,       // 1 minute
    maxRequests: 20,           // 20 AI requests per minute
  },
  
  // Document uploads
  documents: {
    windowMs: 60 * 1000,       // 1 minute
    maxRequests: 10,           // 10 uploads per minute
  },
  
  // Search requests
  search: {
    windowMs: 60 * 1000,       // 1 minute
    maxRequests: 100,          // 100 searches per minute
  },
  
  // General API
  general: {
    windowMs: 60 * 1000,       // 1 minute
    maxRequests: 200,          // 200 requests per minute
  },
  
  // Premium tier limits (higher)
  premium: {
    windowMs: 60 * 1000,       // 1 minute
    maxRequests: 500,          // 500 requests per minute
  },
} as const;

// =============================================================================
// Default Key Generators
// =============================================================================

export const keyGenerators = {
  // Rate limit by wallet address
  wallet: (request: NextRequest): string => {
    const walletAddress = extractWalletFromRequest(request);
    return walletAddress ? `wallet:${walletAddress}` : `ip:${getClientIP(request)}`;
  },
  
  // Rate limit by IP address
  ip: (request: NextRequest): string => {
    return `ip:${getClientIP(request)}`;
  },
  
  // Combined wallet + endpoint
  walletEndpoint: (request: NextRequest): string => {
    const walletAddress = extractWalletFromRequest(request);
    const endpoint = request.nextUrl.pathname;
    const key = walletAddress ? `wallet:${walletAddress}` : `ip:${getClientIP(request)}`;
    return `${key}:${endpoint}`;
  },
  
  // Global rate limit
  global: (_request: NextRequest): string => {
    return 'global';
  },
};

// =============================================================================
// Rate Limiting Middleware
// =============================================================================

export function createRateLimiter(options: RateLimitOptions) {
  return async function rateLimitMiddleware(
    request: NextRequest,
    handler: (req: NextRequest) => Promise<Response>
  ): Promise<Response> {
    const {
      windowMs,
      maxRequests,
      skipSuccessfulRequests = false,
      skipFailedRequests = false,
      keyGenerator = keyGenerators.wallet,
      onLimitReached,
    } = options;

    const key = keyGenerator(request);
    const entry = store.increment(key, windowMs);
    
    const totalHitsRemaining = Math.max(0, maxRequests - entry.totalHits);
    const isLimitExceeded = entry.totalHits > maxRequests;
    
    const rateLimitInfo: RateLimitInfo = {
      totalHits: entry.totalHits,
      totalHitsRemaining,
      resetTime: entry.resetTime,
      retryAfter: isLimitExceeded ? Math.ceil((entry.resetTime.getTime() - Date.now()) / 1000) : undefined,
    };

    // Check if limit is exceeded
    if (isLimitExceeded) {
      if (onLimitReached) {
        onLimitReached(key, request);
      }

      const retryAfter = Math.ceil((entry.resetTime.getTime() - Date.now()) / 1000);
      const response = rateLimitResponse(
        'Too many requests, please try again later',
        retryAfter
      );
      
      return addRateLimitHeaders(
        response,
        maxRequests,
        totalHitsRemaining,
        Math.floor(entry.resetTime.getTime() / 1000)
      );
    }

    // Execute the handler
    let response: Response;
    try {
      response = await handler(request);
    } catch (error) {
      // If handler throws, we still need to handle rate limiting
      throw error;
    }

    // Skip counting based on response status
    const shouldSkip = 
      (skipSuccessfulRequests && response.status < 400) ||
      (skipFailedRequests && response.status >= 400);

    if (shouldSkip) {
      // Decrement the counter if we're skipping
      if (entry.totalHits > 0) {
        entry.totalHits--;
        store.set(key, entry);
      }
    }

    // Add rate limit headers to response
    return addRateLimitHeaders(
      response,
      maxRequests,
      Math.max(0, maxRequests - entry.totalHits),
      Math.floor(entry.resetTime.getTime() / 1000)
    );
  };
}

// =============================================================================
// Preset Rate Limiters
// =============================================================================

export const authRateLimit = createRateLimiter({
  ...rateLimitConfigs.auth,
  keyGenerator: keyGenerators.ip, // Auth by IP to prevent wallet enumeration
});

export const messageRateLimit = createRateLimiter({
  ...rateLimitConfigs.messages,
  keyGenerator: keyGenerators.wallet,
  skipFailedRequests: true, // Don't count failed validations
});

export const chatRateLimit = createRateLimiter({
  ...rateLimitConfigs.chats,
  keyGenerator: keyGenerators.wallet,
});

export const aiRateLimit = createRateLimiter({
  ...rateLimitConfigs.ai,
  keyGenerator: keyGenerators.wallet,
  onLimitReached: (key, request) => {
    console.warn(`AI rate limit exceeded for ${key}`, {
      url: request.url,
      timestamp: new Date().toISOString(),
    });
  },
});

export const documentRateLimit = createRateLimiter({
  ...rateLimitConfigs.documents,
  keyGenerator: keyGenerators.wallet,
});

export const searchRateLimit = createRateLimiter({
  ...rateLimitConfigs.search,
  keyGenerator: keyGenerators.wallet,
  skipFailedRequests: true,
});

export const generalRateLimit = createRateLimiter({
  ...rateLimitConfigs.general,
  keyGenerator: keyGenerators.wallet,
});

// =============================================================================
// Tier-Based Rate Limiting
// =============================================================================

export interface UserTier {
  tier: 'free' | 'pro' | 'enterprise';
  limits: {
    messagesPerMinute: number;
    aiRequestsPerMinute: number;
    documentsPerMinute: number;
    searchesPerMinute: number;
  };
}

const tierLimits: Record<string, UserTier['limits']> = {
  free: {
    messagesPerMinute: 30,
    aiRequestsPerMinute: 20,
    documentsPerMinute: 5,
    searchesPerMinute: 50,
  },
  pro: {
    messagesPerMinute: 100,
    aiRequestsPerMinute: 60,
    documentsPerMinute: 20,
    searchesPerMinute: 200,
  },
  enterprise: {
    messagesPerMinute: 500,
    aiRequestsPerMinute: 200,
    documentsPerMinute: 100,
    searchesPerMinute: 1000,
  },
};

export function createTierRateLimit(limitType: keyof UserTier['limits']) {
  return async function tierRateLimitMiddleware(
    request: NextRequest & { user?: { tier?: string } },
    handler: (req: NextRequest) => Promise<Response>
  ): Promise<Response> {
    const userTier = (request as any).user?.tier || 'free';
    const limits = tierLimits[userTier];
    const maxRequests = limits[limitType];

    const rateLimiter = createRateLimiter({
      windowMs: 60 * 1000, // 1 minute
      maxRequests,
      keyGenerator: keyGenerators.wallet,
    });

    return rateLimiter(request, handler);
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

function getClientIP(request: ExtendedNextRequest): string {
  // Try various headers for client IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('x-client-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (clientIP) {
    return clientIP;
  }
  
  // Fallback to connection remote address  
  return request.ip || 'unknown';
}

// =============================================================================
// Monitoring and Analytics
// =============================================================================

export function getRateLimitStats(key: string): RateLimitInfo | null {
  const entry = store.get(key);
  
  if (!entry) {
    return null;
  }
  
  return {
    totalHits: entry.totalHits,
    totalHitsRemaining: Math.max(0, rateLimitConfigs.general.maxRequests - entry.totalHits),
    resetTime: entry.resetTime,
  };
}

export function clearRateLimit(key: string): void {
  store.delete(key);
}

export function getAllRateLimits(): Array<{ key: string; info: RateLimitInfo }> {
  const results: Array<{ key: string; info: RateLimitInfo }> = [];
  
  for (const [key, entry] of store.entries()) {
    if (entry.resetTime >= new Date()) {
      results.push({
        key,
        info: {
          totalHits: entry.totalHits,
          totalHitsRemaining: 0, // Would need limit context to calculate
          resetTime: entry.resetTime,
        },
      });
    }
  }
  
  return results;
}