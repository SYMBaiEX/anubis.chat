/**
 * AI Completions Endpoint
 * Handles single text completions using various AI models
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { streamText, generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { withAuth, type AuthenticatedRequest } from '@/lib/middleware/auth';
import { aiRateLimit } from '@/lib/middleware/rate-limit';
import { 
  successResponse,
  validationErrorResponse,
  modelUnavailableResponse,
  addSecurityHeaders 
} from '@/lib/utils/api-response';
import { nanoid } from 'nanoid';

// =============================================================================
// Request Validation
// =============================================================================

const completionSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(10000, 'Prompt must be 10000 characters or less'),
  model: z.string().default('gpt-4o-mini'),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(8000).default(2000),
  stream: z.boolean().default(false),
  systemPrompt: z.string().optional(),
});

// =============================================================================
// Helper Functions
// =============================================================================

function getOpenAIModel(modelId: string) {
  const supportedModels = [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4',
    'gpt-3.5-turbo',
  ];
  
  if (!supportedModels.includes(modelId)) {
    return null;
  }
  
  return openai(modelId);
}

// =============================================================================
// Route Handlers
// =============================================================================

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  return aiRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress } = authReq.user;
        
        // Parse and validate request body
        const body = await req.json();
        const validation = completionSchema.safeParse(body);
        
        if (!validation.success) {
          return validationErrorResponse(
            'Invalid completion request',
            validation.error.issues.reduce((acc, issue) => {
              const path = issue.path.join('.');
              if (!acc[path]) acc[path] = [];
              acc[path].push(issue.message);
              return acc;
            }, {} as Record<string, string[]>)
          );
        }
        
        const { prompt, model, temperature, maxTokens, stream, systemPrompt } = validation.data;
        
        // Get AI model
        const aiModel = getOpenAIModel(model);
        if (!aiModel) {
          return modelUnavailableResponse(model);
        }
        
        const completionId = nanoid(12);
        
        console.log(`AI completion requested: ${completionId} by ${walletAddress} using ${model}`);
        
        // Handle streaming response
        if (stream) {
          const result = streamText({
            model: aiModel,
            system: systemPrompt || 'You are a helpful AI assistant.',
            prompt,
            temperature: temperature ?? 0.7,
            maxOutputTokens: maxTokens,
          });
          
          console.log(`Streaming completion: ${completionId}`);
          return result.toUIMessageStreamResponse();
        }
        
        // Handle non-streaming response
        const result = await generateText({
          model: aiModel,
          system: systemPrompt || 'You are a helpful AI assistant.',
          prompt,
          temperature: temperature ?? 0.7,
          maxOutputTokens: maxTokens,
        });
        
        const completionResult = {
          id: completionId,
          model,
          text: result.text,
          finishReason: result.finishReason,
          usage: {
            inputTokens: result.usage.inputTokens,
            outputTokens: result.usage.outputTokens,
            totalTokens: result.usage.totalTokens,
          },
          metadata: {
            completionId,
            walletAddress,
            timestamp: Date.now(),
          },
        };
        
        console.log(`Completion generated: ${completionId}, tokens: ${result.usage.totalTokens}`);
        
        const response = successResponse(completionResult);
        return addSecurityHeaders(response);
        
      } catch (error) {
        console.error('AI completion error:', error);
        const response = NextResponse.json(
          { error: 'Failed to generate completion' },
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