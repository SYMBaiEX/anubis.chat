/**
 * User Usage Analytics Endpoint
 * Provides usage statistics and analytics for authenticated users
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth, type AuthenticatedRequest } from '@/lib/middleware/auth';
import { generalRateLimit } from '@/lib/middleware/rate-limit';
import { 
  successResponse,
  validationErrorResponse,
  addSecurityHeaders 
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
  includeModels: z.enum(['true', 'false']).transform(val => val === 'true').default('true'),
});

// =============================================================================
// Route Handlers
// =============================================================================

export async function GET(request: NextRequest) {
  return generalRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress } = authReq.user;
        
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
        
        // TODO: Fetch real usage data from Convex
        // const usageData = await getUserUsage(walletAddress, period);
        
        // Generate mock usage data based on period
        const daysCount = period === '7d' ? 7 : period === '30d' ? 30 : 90;
        const daily = Array.from({ length: daysCount }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (daysCount - 1 - i));
          
          return {
            date: date.toISOString().split('T')[0],
            tokensUsed: Math.floor(Math.random() * 500) + 50,
            messagesCount: Math.floor(Math.random() * 20) + 5,
            chatsCreated: Math.floor(Math.random() * 3),
            documentsUploaded: Math.floor(Math.random() * 2),
            searchesPerformed: Math.floor(Math.random() * 10) + 2,
          };
        });
        
        const totalTokensUsed = daily.reduce((sum, day) => sum + day.tokensUsed, 0);
        const totalMessages = daily.reduce((sum, day) => sum + day.messagesCount, 0);
        
        const usageStats: UsageStats = {
          current: {
            tokensUsed: totalTokensUsed,
            tokensLimit: 10000,
            messagesCount: totalMessages,
            chatsCount: 12,
            documentsCount: 3,
            searchesCount: daily.reduce((sum, day) => sum + day.searchesPerformed, 0),
          },
          daily,
          models: includeModels ? [
            {
              model: 'gpt-4o',
              tokensUsed: Math.floor(totalTokensUsed * 0.6),
              messagesCount: Math.floor(totalMessages * 0.6),
              avgResponseTime: 1200,
            },
            {
              model: 'claude-3.5-sonnet',
              tokensUsed: Math.floor(totalTokensUsed * 0.3),
              messagesCount: Math.floor(totalMessages * 0.3),
              avgResponseTime: 950,
            },
            {
              model: 'deepseek-v3',
              tokensUsed: Math.floor(totalTokensUsed * 0.1),
              messagesCount: Math.floor(totalMessages * 0.1),
              avgResponseTime: 800,
            },
          ] : [],
          subscription: {
            tier: 'free',
            features: ['basic_chat', 'document_upload', 'search'],
            limits: {
              messagesPerMinute: 30,
              aiRequestsPerMinute: 20,
              documentsPerMinute: 5,
              searchesPerMinute: 50,
            },
          },
        };
        
        console.log(`Usage stats requested for user ${walletAddress}, period: ${period}`);
        
        const response = successResponse(usageStats);
        return addSecurityHeaders(response);
        
      } catch (error) {
        console.error('Get usage stats error:', error);
        return validationErrorResponse('Failed to retrieve usage statistics');
      }
    });
  });
}

export async function OPTIONS() {
  const response = new Response(null, { status: 200 });
  return addSecurityHeaders(response);
}