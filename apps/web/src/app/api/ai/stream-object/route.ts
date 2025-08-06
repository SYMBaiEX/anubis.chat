/**
 * AI Stream Object Endpoint
 * Streams structured object generation using AI with real-time updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { streamObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { withAuth, type AuthenticatedRequest } from '@/lib/middleware/auth';
import { aiRateLimit } from '@/lib/middleware/rate-limit';
import { 
  validationErrorResponse,
  modelUnavailableResponse,
  addSecurityHeaders 
} from '@/lib/utils/api-response';
import { nanoid } from 'nanoid';

// =============================================================================
// Predefined Schemas for Streaming Use Cases
// =============================================================================

const streamingSchemas = {
  // Real-time notifications
  notifications: z.object({
    id: z.string(),
    title: z.string(),
    message: z.string(),
    type: z.enum(['info', 'success', 'warning', 'error']),
    timestamp: z.string(),
    read: z.boolean(),
  }),
  
  // Progressive task breakdown
  taskBreakdown: z.object({
    mainTask: z.string(),
    subtasks: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        dependencies: z.array(z.string()),
        estimatedHours: z.number(),
        priority: z.enum(['low', 'medium', 'high']),
      })
    ),
  }),
  
  // Live content analysis
  contentAnalysis: z.object({
    summary: z.string(),
    keyTopics: z.array(z.string()),
    sentiment: z.object({
      overall: z.enum(['positive', 'negative', 'neutral']),
      score: z.number().min(-1).max(1),
      confidence: z.number().min(0).max(1),
    }),
    entities: z.array(
      z.object({
        name: z.string(),
        type: z.enum(['person', 'organization', 'location', 'product']),
        confidence: z.number(),
      })
    ),
    categories: z.array(z.string()),
  }),
  
  // Progressive report generation
  report: z.object({
    title: z.string(),
    executive_summary: z.string(),
    sections: z.array(
      z.object({
        heading: z.string(),
        content: z.string(),
        subsections: z.array(
          z.object({
            heading: z.string(),
            content: z.string(),
          })
        ),
      })
    ),
    recommendations: z.array(z.string()),
    next_steps: z.array(z.string()),
  }),
  
  // Dynamic quiz generation
  quiz: z.object({
    title: z.string(),
    description: z.string(),
    questions: z.array(
      z.object({
        id: z.string(),
        question: z.string(),
        type: z.enum(['multiple_choice', 'true_false', 'short_answer']),
        options: z.array(z.string()).optional(),
        correct_answer: z.string(),
        explanation: z.string(),
        difficulty: z.enum(['easy', 'medium', 'hard']),
      })
    ),
  }),
};

// =============================================================================
// Request Validation
// =============================================================================

const streamObjectSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(10000, 'Prompt must be 10000 characters or less'),
  model: z.string().default('gpt-4o-mini'),
  schema: z.enum(['notifications', 'taskBreakdown', 'contentAnalysis', 'report', 'quiz']),
  output: z.enum(['object', 'array']).default('object'),
  systemPrompt: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(8000).default(4000),
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

function getStreamingSchema(schemaType: string): z.ZodTypeAny {
  if (schemaType in streamingSchemas) {
    return streamingSchemas[schemaType as keyof typeof streamingSchemas];
  }
  
  throw new Error(`Schema type '${schemaType}' not found`);
}

// =============================================================================
// Route Handlers
// =============================================================================

// Allow streaming responses up to 90 seconds for complex object generation
export const maxDuration = 90;

export async function POST(request: NextRequest) {
  return aiRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress } = authReq.user;
        
        // Parse and validate request body
        const body = await req.json();
        const validation = streamObjectSchema.safeParse(body);
        
        if (!validation.success) {
          return validationErrorResponse(
            'Invalid stream object request',
            validation.error.flatten().fieldErrors
          );
        }
        
        const { 
          prompt, 
          model, 
          schema: schemaType, 
          output,
          systemPrompt, 
          temperature, 
          maxTokens 
        } = validation.data;
        
        // Get AI model
        const aiModel = getOpenAIModel(model);
        if (!aiModel) {
          return modelUnavailableResponse(model);
        }
        
        // Get schema
        let schema;
        try {
          schema = getStreamingSchema(schemaType);
        } catch (error) {
          return validationErrorResponse(
            'Invalid schema',
            { schema: [(error as Error).message] }
          );
        }
        
        const streamId = nanoid(12);
        
        console.log(`Object streaming requested: ${streamId} by ${walletAddress} using ${model}, schema: ${schemaType}, output: ${output}`);
        
        // Create system prompt based on output type
        const finalSystemPrompt = systemPrompt || (
          output === 'array' 
            ? `Generate an array of structured objects based on the prompt. Each object should follow the provided schema.`
            : `Generate a structured object based on the prompt and schema provided. Build the object progressively.`
        );
        
        // Stream structured object generation
        const result = streamObject({
          model: aiModel,
          system: finalSystemPrompt,
          prompt,
          schema,
          output: output as 'object' | 'array',
          temperature: temperature ?? 0.3, // Lower temperature for structured generation
          maxOutputTokens: maxTokens,
          onFinish: ({ usage, error }) => {
            if (error) {
              console.error(`Object stream error: ${streamId}`, error);
            } else {
              console.log(`Object stream completed: ${streamId}, tokens: ${usage?.totalTokens || 'unknown'}`);
            }
          },
        });
        
        // Return streaming response as text stream (JSON representation)
        return result.toTextStreamResponse({
          headers: {
            'X-Stream-ID': streamId,
            'X-Schema-Type': schemaType,
            'X-Output-Type': output,
          },
        });
        
      } catch (error) {
        console.error('AI object streaming error:', error);
        const response = NextResponse.json(
          { error: 'Failed to stream object' },
          { status: 500 }
        );
        return addSecurityHeaders(response);
      }
    });
  });
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (authReq: AuthenticatedRequest) => {
    try {
      // Return available streaming schemas
      const schemas = Object.keys(streamingSchemas).map(key => ({
        name: key,
        description: `Streaming schema for ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
        outputTypes: ['object', 'array'],
      }));
      
      const response = NextResponse.json({
        success: true,
        data: {
          availableSchemas: schemas,
          supportedOutputs: ['object', 'array'],
          supportedModels: ['gpt-4o', 'gpt-4o-mini', 'gpt-4', 'gpt-3.5-turbo'],
          maxDuration: 90,
        },
      });
      
      return addSecurityHeaders(response);
      
    } catch (error) {
      console.error('Get streaming schemas error:', error);
      const response = NextResponse.json(
        { error: 'Failed to retrieve streaming schemas' },
        { status: 500 }
      );
      return addSecurityHeaders(response);
    }
  });
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  return addSecurityHeaders(response);
}