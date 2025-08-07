/**
 * AI Models Endpoint
 * Provides information about available AI models and their capabilities
 */

import { type NextRequest, NextResponse } from 'next/server';
import { type AuthenticatedRequest, withAuth } from '@/lib/middleware/auth';
import { generalRateLimit } from '@/lib/middleware/rate-limit';
import type { AIModel } from '@/lib/types/ai';
import { addSecurityHeaders, successResponse } from '@/lib/utils/api-response';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('ai-models-api');

// =============================================================================
// Available AI Models Configuration
// =============================================================================

const availableModels: AIModel[] = [
  // OpenAI Models
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    contextWindow: 128_000,
    maxTokens: 4096,
    strengths: [
      'General conversation',
      'Code generation',
      'Complex reasoning',
      'Image understanding',
    ],
    costTier: 'premium',
    isAvailable: true,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    contextWindow: 128_000,
    maxTokens: 4096,
    strengths: ['Fast responses', 'Cost-effective', 'General tasks'],
    costTier: 'budget',
    isAvailable: true,
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'openai',
    contextWindow: 8192,
    maxTokens: 4096,
    strengths: ['Complex reasoning', 'Code generation', 'Creative writing'],
    costTier: 'premium',
    isAvailable: true,
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    contextWindow: 16_384,
    maxTokens: 4096,
    strengths: ['Fast responses', 'General conversation', 'Code assistance'],
    costTier: 'budget',
    isAvailable: true,
  },
  // Anthropic Models (for future integration)
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    contextWindow: 200_000,
    maxTokens: 4096,
    strengths: [
      'Advanced reasoning',
      'Code generation',
      'Analysis',
      'Long context',
    ],
    costTier: 'premium',
    isAvailable: false, // Not implemented yet
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    contextWindow: 200_000,
    maxTokens: 4096,
    strengths: ['Fast responses', 'Cost-effective', 'Simple tasks'],
    costTier: 'budget',
    isAvailable: false, // Not implemented yet
  },
  // DeepSeek Models (for future integration)
  {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat',
    provider: 'deepseek',
    contextWindow: 32_768,
    maxTokens: 4096,
    strengths: ['Code generation', 'Technical reasoning', 'Cost-effective'],
    costTier: 'budget',
    isAvailable: false, // Not implemented yet
  },
];

// =============================================================================
// Route Handlers
// =============================================================================

export async function GET(request: NextRequest) {
  return generalRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { user } = authReq;
        const { searchParams } = new URL(req.url);

        // Parse query parameters
        const provider = searchParams.get('provider');
        const availableOnly = searchParams.get('available') === 'true';
        const tier = searchParams.get('tier') as
          | 'free'
          | 'budget'
          | 'premium'
          | null;

        // Filter models based on query parameters (single pass)
        const filteredModels = availableModels.filter((model) => {
          if (provider && model.provider !== provider) return false;
          if (availableOnly && !model.isAvailable) return false;
          if (tier && model.costTier !== tier) return false;
          return true;
        });

        // Apply user tier restrictions (future feature)
        // if (user.subscription.tier === 'free') {
        //   filteredModels = filteredModels.filter(model =>
        //     model.costTier === 'free' || model.costTier === 'budget'
        //   );
        // }

        log.info('Models requested by user', { 
          walletAddress: user.walletAddress, 
          modelCount: filteredModels.length 
        });

        const response = successResponse({
          models: filteredModels,
          total: filteredModels.length,
          filters: {
            provider,
            availableOnly,
            tier,
          },
        });

        return addSecurityHeaders(response);
      } catch (error) {
        log.error('Get models error', { 
          error: error instanceof Error ? error.message : String(error) 
        });
        const response = NextResponse.json(
          { error: 'Failed to retrieve models' },
          { status: 500 }
        );
        return addSecurityHeaders(response);
      }
    });
  });
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  return addSecurityHeaders(response);
}
