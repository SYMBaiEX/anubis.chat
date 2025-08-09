/**
 * User Usage Analytics Endpoint
 * Provides usage statistics and analytics for authenticated users
 */

import { api } from '@convex/_generated/api';
import { fetchQuery } from 'convex/nextjs';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createModuleLogger } from '@/lib/utils/logger';

// Initialize logger
const log = createModuleLogger('api/users/usage');

import { withSubscriptionAuth } from '@/lib/middleware/subscription-auth';
import { generalRateLimit } from '@/lib/middleware/rate-limit';
import {
  addSecurityHeaders,
  successResponse,
  validationErrorResponse,
} from '@/lib/utils/api-response';

// =============================================================================
// Types
// =============================================================================

interface UsageStats {
  current: {
    tokensUsed: number;
    tokensLimit: number;
    messagesCount: number;
    chatsCount: number;
    documentsCount: number;
    searchesCount: number;
  };
  daily: Array<{
    date: string;
    tokensUsed: number;
    messagesCount: number;
    chatsCreated: number;
    documentsUploaded: number;
    searchesPerformed: number;
  }>;
  models: Array<{
    model: string;
    tokensUsed: number;
    messagesCount: number;
    avgResponseTime: number;
  }>;
  subscription: {
    tier: 'free' | 'pro' | 'enterprise';
    expiresAt?: number;
    features: string[];
    limits: {
      messagesPerMinute: number;
      aiRequestsPerMinute: number;
      documentsPerMinute: number;
      searchesPerMinute: number;
    };
  };
}

// =============================================================================
// Request Validation
// =============================================================================

const usageQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d']).default('30d'),
  includeModels: z
    .enum(['true', 'false'])
    .default('true')
    .transform((val) => val === 'true'),
});

// =============================================================================
// Route Handlers
// =============================================================================

export async function GET(request: NextRequest) {
  return generalRateLimit(request, async (req) => {
    return withSubscriptionAuth(req, async (authReq) => {
      const { walletAddress, subscription, limits } = authReq.user;

      try {
        // Parse query parameters
        const { searchParams } = new URL(req.url);
        const queryValidation = usageQuerySchema.safeParse({
          period: searchParams.get('period'),
          includeModels: searchParams.get('includeModels'),
        });

        if (!queryValidation.success) {
          return validationErrorResponse(
            'Invalid query parameters',
            queryValidation.error.flatten().fieldErrors
          );
        }

        const { period, includeModels } = queryValidation.data;

        const usageData = await fetchQuery(api.users.getUsage, {
          walletAddress,
        });

        const usageStats: UsageStats = {
          current: {
            tokensUsed: 0, // Not tracked yet
            tokensLimit: 0, // Not tracked yet
            messagesCount: subscription.messagesUsed,
            chatsCount: 0, // Could be fetched from chats table
            documentsCount: 0, // Could be fetched from files table
            searchesCount: 0, // Not tracked yet
          },
          daily: [], // Could implement daily breakdowns
          models: includeModels ? [] : [], // Could implement model-specific stats
          subscription: {
            tier: subscription.tier === 'pro_plus' ? 'enterprise' : subscription.tier,
            expiresAt: subscription.currentPeriodEnd,
            features: [
              'basic_chat',
              ...(subscription.tier !== 'free' ? ['premium_models'] : []),
              ...(subscription.tier === 'pro_plus' ? ['api_access', 'large_files', 'advanced_features'] : []),
            ],
            limits: {
              messagesPerMinute: subscription.tier === 'free' ? 10 : subscription.tier === 'pro' ? 30 : 60,
              aiRequestsPerMinute: subscription.tier === 'free' ? 5 : subscription.tier === 'pro' ? 20 : 50,
              documentsPerMinute: subscription.tier === 'pro_plus' ? 20 : 5,
              searchesPerMinute: subscription.tier === 'free' ? 10 : subscription.tier === 'pro' ? 30 : 100,
            },
          },
        };

        log.apiRequest('GET /api/users/usage', {
          walletAddress,
          period,
          operation: 'get_usage_stats',
        });

        const response = successResponse(usageStats);
        return addSecurityHeaders(response);
      } catch (error) {
        log.error('Failed to get usage stats', {
          error,
          walletAddress,
          operation: 'get_usage_stats',
        });
        return validationErrorResponse('Failed to retrieve usage statistics');
      }
    });
  });
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  return addSecurityHeaders(response);
}
