/**
 * Context7 MCP Service Handler
 * Provides cached and rate-limited access to Context7 documentation
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { mcpManager } from '@/lib/mcp/client';
import { ensureMCPServersInitialized } from '@/lib/mcp/initialize';
import { type AuthenticatedRequest, withAuth } from '@/lib/middleware/auth';
import { aiRateLimit } from '@/lib/middleware/rate-limit';
import {
  addSecurityHeaders,
  successResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/utils/api-response';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('context7-api');

// =============================================================================
// Cache Management
// =============================================================================

interface CacheEntry {
  data: unknown;
  timestamp: number;
  ttl: number;
}

class Context7Cache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly DEFAULT_TTL = 3600000; // 1 hour in milliseconds

  get(key: string): unknown | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: unknown, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

const context7Cache = new Context7Cache();

// =============================================================================
// Request Validation
// =============================================================================

const resolveLibrarySchema = z.object({
  action: z.literal('resolve_library'),
  libraryName: z.string().min(1).max(100),
});

const getDocsSchema = z.object({
  action: z.literal('get_docs'),
  libraryId: z.string().min(1).max(200),
  tokens: z.number().min(100).max(50000).optional().default(10000),
  topic: z.string().max(100).optional(),
});

const requestSchema = z.discriminatedUnion('action', [
  resolveLibrarySchema,
  getDocsSchema,
]);

// =============================================================================
// Rate Limiting
// =============================================================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class Context7RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private readonly MAX_REQUESTS_PER_HOUR = 100;
  private readonly WINDOW_MS = 3600000; // 1 hour

  canProceed(userId: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(userId);

    if (!entry || now > entry.resetTime) {
      this.limits.set(userId, {
        count: 1,
        resetTime: now + this.WINDOW_MS,
      });
      return true;
    }

    if (entry.count >= this.MAX_REQUESTS_PER_HOUR) {
      return false;
    }

    entry.count++;
    return true;
  }

  getRemainingRequests(userId: string): number {
    const entry = this.limits.get(userId);
    if (!entry) return this.MAX_REQUESTS_PER_HOUR;
    
    const now = Date.now();
    if (now > entry.resetTime) {
      return this.MAX_REQUESTS_PER_HOUR;
    }

    return Math.max(0, this.MAX_REQUESTS_PER_HOUR - entry.count);
  }

  getResetTime(userId: string): number | null {
    const entry = this.limits.get(userId);
    if (!entry) return null;
    
    const now = Date.now();
    if (now > entry.resetTime) {
      return null;
    }

    return entry.resetTime;
  }
}

const rateLimiter = new Context7RateLimiter();

// =============================================================================
// Route Handlers
// =============================================================================

/**
 * POST /api/mcp/context7 - Interact with Context7 MCP server
 */
export async function POST(request: NextRequest) {
  return aiRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const userId = authReq.user.id;

        // Check rate limit
        if (!rateLimiter.canProceed(userId)) {
          const resetTime = rateLimiter.getResetTime(userId);
          const response = NextResponse.json(
            {
              error: 'Rate limit exceeded',
              message: 'You have exceeded the maximum number of Context7 requests',
              resetTime,
            },
            { status: 429 }
          );
          response.headers.set('X-RateLimit-Limit', '100');
          response.headers.set('X-RateLimit-Remaining', '0');
          if (resetTime) {
            response.headers.set('X-RateLimit-Reset', resetTime.toString());
          }
          return addSecurityHeaders(response);
        }

        const body = await req.json();
        const validation = requestSchema.safeParse(body);

        if (!validation.success) {
          return validationErrorResponse(
            'Invalid request',
            validation.error.flatten().fieldErrors
          );
        }

        const requestData = validation.data;

        // Ensure MCP servers are initialized
        await ensureMCPServersInitialized();

        // Check if Context7 server is connected
        if (!mcpManager.isServerConnected('context7')) {
          return errorResponse(
            'Context7 server is not connected',
            503
          );
        }

        let result: unknown;
        let cacheKey: string;

        if (requestData.action === 'resolve_library') {
          cacheKey = `resolve:${requestData.libraryName}`;
          
          // Check cache first
          const cached = context7Cache.get(cacheKey);
          if (cached) {
            log.info('Context7 cache hit', { cacheKey });
            result = cached;
          } else {
            // Call Context7 to resolve library
            result = await mcpManager.callTool(
              'context7',
              'resolve_library_id',
              { libraryName: requestData.libraryName }
            );
            
            // Cache the result
            context7Cache.set(cacheKey, result);
            log.info('Context7 library resolved and cached', {
              libraryName: requestData.libraryName,
            });
          }
        } else {
          // Get documentation
          const { libraryId, tokens, topic } = requestData;
          cacheKey = `docs:${libraryId}:${tokens}:${topic || 'general'}`;
          
          // Check cache first
          const cached = context7Cache.get(cacheKey);
          if (cached) {
            log.info('Context7 cache hit', { cacheKey });
            result = cached;
          } else {
            // Call Context7 to get documentation
            result = await mcpManager.callTool(
              'context7',
              'get_library_docs',
              {
                context7CompatibleLibraryID: libraryId,
                tokens,
                ...(topic && { topic }),
              }
            );
            
            // Cache the result with shorter TTL for docs
            context7Cache.set(cacheKey, result, 1800000); // 30 minutes
            log.info('Context7 docs fetched and cached', {
              libraryId,
              tokens,
              topic,
            });
          }
        }

        // Add rate limit headers
        const remaining = rateLimiter.getRemainingRequests(userId);
        const resetTime = rateLimiter.getResetTime(userId);
        
        const response = successResponse({
          result,
          cached: !!context7Cache.get(cacheKey),
          rateLimit: {
            remaining,
            resetTime,
          },
        });

        response.headers.set('X-RateLimit-Limit', '100');
        response.headers.set('X-RateLimit-Remaining', remaining.toString());
        if (resetTime) {
          response.headers.set('X-RateLimit-Reset', resetTime.toString());
        }

        return addSecurityHeaders(response);
      } catch (error) {
        log.error('Context7 API error', {
          error: error instanceof Error ? error.message : String(error),
        });
        
        // Check if it's a Context7 server error
        if (error instanceof Error && error.message.includes('context7')) {
          return errorResponse(
            'Context7 service temporarily unavailable',
            503
          );
        }
        
        return errorResponse(
          'Failed to process Context7 request',
          500
        );
      }
    });
  });
}

/**
 * GET /api/mcp/context7 - Get Context7 service status
 */
export async function GET(request: NextRequest) {
  return aiRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const userId = authReq.user.id;
        
        // Ensure MCP servers are initialized
        await ensureMCPServersInitialized();

        const isConnected = mcpManager.isServerConnected('context7');
        const remaining = rateLimiter.getRemainingRequests(userId);
        const resetTime = rateLimiter.getResetTime(userId);

        const response = successResponse({
          status: isConnected ? 'connected' : 'disconnected',
          cacheSize: context7Cache.size(),
          rateLimit: {
            limit: 100,
            remaining,
            resetTime,
          },
        });

        return addSecurityHeaders(response);
      } catch (error) {
        log.error('Context7 status error', {
          error: error instanceof Error ? error.message : String(error),
        });
        
        return errorResponse(
          'Failed to get Context7 status',
          500
        );
      }
    });
  });
}

/**
 * DELETE /api/mcp/context7 - Clear Context7 cache (admin only)
 */
export async function DELETE(request: NextRequest) {
  return aiRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        // Check if user is admin
        if (authReq.user.role !== 'admin') {
          return errorResponse('Unauthorized', 403);
        }

        const previousSize = context7Cache.size();
        context7Cache.clear();

        log.info('Context7 cache cleared', {
          clearedEntries: previousSize,
          userId: authReq.user.id,
        });

        const response = successResponse({
          message: 'Cache cleared successfully',
          clearedEntries: previousSize,
        });

        return addSecurityHeaders(response);
      } catch (error) {
        log.error('Context7 cache clear error', {
          error: error instanceof Error ? error.message : String(error),
        });
        
        return errorResponse(
          'Failed to clear Context7 cache',
          500
        );
      }
    });
  });
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  return addSecurityHeaders(response);
}