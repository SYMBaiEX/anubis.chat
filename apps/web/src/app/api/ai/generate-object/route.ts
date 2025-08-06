/**
 * AI Generate Object Endpoint
 * Generates structured objects using AI with Zod schema validation
 */

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { nanoid } from 'nanoid';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { type AuthenticatedRequest, withAuth } from '@/lib/middleware/auth';
import { aiRateLimit } from '@/lib/middleware/rate-limit';
import type {
  CustomJSONSchema as ImportedCustomJSONSchema,
  JSONSchemaProperty as ImportedJSONSchemaProperty,
} from '@/lib/types/ai';
import {
  addSecurityHeaders,
  modelUnavailableResponse,
  successResponse,
  validationErrorResponse,
} from '@/lib/utils/api-response';

// Local type aliases to avoid conflicts
type CustomJSONSchema = ImportedCustomJSONSchema;
type JSONSchemaProperty = ImportedJSONSchemaProperty;

// =============================================================================
// Predefined Schemas for Common Use Cases
// =============================================================================

const commonSchemas = {
  // Task list generation
  tasks: z.object({
    tasks: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        priority: z.enum(['low', 'medium', 'high']),
        category: z.string(),
        estimatedTime: z.number().describe('Estimated time in minutes'),
      })
    ),
  }),

  // Meeting summary
  meetingSummary: z.object({
    title: z.string(),
    date: z.string(),
    participants: z.array(z.string()),
    keyPoints: z.array(z.string()),
    actionItems: z.array(
      z.object({
        task: z.string(),
        assignee: z.string(),
        dueDate: z.string(),
      })
    ),
    nextSteps: z.array(z.string()),
  }),

  // Article summary
  articleSummary: z.object({
    title: z.string(),
    mainPoints: z.array(z.string()),
    keyQuotes: z.array(z.string()),
    tags: z.array(z.string()),
    sentiment: z.enum(['positive', 'negative', 'neutral']),
    summary: z.string(),
  }),

  // Contact information extraction
  contactInfo: z.object({
    name: z.string(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    company: z.string().optional(),
    title: z.string().optional(),
    address: z.string().optional(),
  }),

  // JSON data structure
  jsonStructure: z.object({
    data: z.record(z.string(), z.unknown()),
  }),
};

// =============================================================================
// Local Type Aliases (avoiding import conflicts)
// =============================================================================

// =============================================================================
// Request Validation
// =============================================================================

const generateObjectSchema = z
  .object({
    prompt: z
      .string()
      .min(1, 'Prompt is required')
      .max(10_000, 'Prompt must be 10000 characters or less'),
    model: z.string().default('gpt-4o-mini'),
    schema: z
      .enum([
        'tasks',
        'meetingSummary',
        'articleSummary',
        'contactInfo',
        'jsonStructure',
      ])
      .optional(),
    // Custom schema as JSON - validated at runtime with type checking
    customSchema: z.record(z.string(), z.unknown()).optional(),
    systemPrompt: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(1).max(8000).default(2000),
  })
  .refine((data) => data.schema || data.customSchema, {
    message: 'Either schema or customSchema must be provided',
    path: ['schema'],
  });

// =============================================================================
// Helper Functions
// =============================================================================

function getOpenAIModel(modelId: string) {
  const supportedModels = ['gpt-4o', 'gpt-4o-mini', 'gpt-4', 'gpt-3.5-turbo'];

  if (!supportedModels.includes(modelId)) {
    return null;
  }

  return openai(modelId);
}

// Convert JSON Schema-like definition to Zod schema
function jsonSchemaPropertyToZod(prop: JSONSchemaProperty): z.ZodTypeAny {
  switch (prop.type) {
    case 'string': {
      let stringSchema = z.string();
      if (prop.minLength !== undefined)
        stringSchema = stringSchema.min(prop.minLength);
      if (prop.maxLength !== undefined)
        stringSchema = stringSchema.max(prop.maxLength);
      if (prop.enum) {
        const stringEnums = prop.enum.filter(
          (v): v is string => typeof v === 'string'
        );
        if (stringEnums.length > 0) {
          return z.enum(stringEnums as [string, ...string[]]);
        }
      }
      return stringSchema;
    }

    case 'number': {
      let numberSchema = z.number();
      if (prop.minimum !== undefined)
        numberSchema = numberSchema.min(prop.minimum);
      if (prop.maximum !== undefined)
        numberSchema = numberSchema.max(prop.maximum);
      if (prop.enum) {
        const numberEnums = prop.enum.filter(
          (v): v is number => typeof v === 'number'
        );
        if (numberEnums.length > 0) {
          // For number enums, use literal union instead of enum
          return z.union(
            numberEnums.map((n) => z.literal(n)) as [
              z.ZodLiteral<number>,
              ...z.ZodLiteral<number>[],
            ]
          );
        }
      }
      return numberSchema;
    }

    case 'boolean':
      return z.boolean();

    case 'array':
      if (prop.items) {
        return z.array(jsonSchemaPropertyToZod(prop.items));
      }
      return z.array(z.unknown());

    case 'object':
      if (prop.properties) {
        const shape: Record<string, z.ZodTypeAny> = {};
        for (const [key, value] of Object.entries(prop.properties)) {
          shape[key] = jsonSchemaPropertyToZod(value);
        }
        return z.object(shape);
      }
      return z.record(z.string(), z.unknown());

    default:
      return z.unknown();
  }
}

function getSchema(
  schemaType?: string,
  customSchema?: Record<string, unknown>
): z.ZodTypeAny {
  if (schemaType && schemaType in commonSchemas) {
    return commonSchemas[schemaType as keyof typeof commonSchemas];
  }

  if (customSchema) {
    // Type guard to validate custom schema structure
    if (
      typeof customSchema === 'object' &&
      customSchema !== null &&
      'type' in customSchema &&
      customSchema.type === 'object' &&
      'properties' in customSchema &&
      typeof customSchema.properties === 'object'
    ) {
      const typedSchema = customSchema as unknown as CustomJSONSchema;
      const shape: Record<string, z.ZodTypeAny> = {};

      // Convert each property to Zod schema
      for (const [key, prop] of Object.entries(typedSchema.properties)) {
        let zodProp = jsonSchemaPropertyToZod(prop);

        // Make property optional if not in required array
        if (!typedSchema.required?.includes(key)) {
          zodProp = zodProp.optional();
        }

        shape[key] = zodProp;
      }

      return z.object(shape);
    }
    // Fallback for invalid custom schema - throw an error
    throw new Error('Invalid custom schema structure provided.');
  }

  throw new Error('No valid schema provided');
}

// =============================================================================
// Route Handlers
// =============================================================================

export async function POST(request: NextRequest) {
  return aiRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress } = authReq.user;

        // Parse and validate request body
        const body = await req.json();
        const validation = generateObjectSchema.safeParse(body);

        if (!validation.success) {
          return validationErrorResponse(
            'Invalid generate object request',
            validation.error.flatten().fieldErrors
          );
        }

        const {
          prompt,
          model,
          schema: schemaType,
          customSchema,
          systemPrompt,
          temperature,
          maxTokens,
        } = validation.data;

        // Get AI model
        const aiModel = getOpenAIModel(model);
        if (!aiModel) {
          return modelUnavailableResponse(model);
        }

        // Get schema
        let schema;
        try {
          schema = getSchema(schemaType, customSchema);
        } catch (error) {
          return validationErrorResponse('Invalid schema', {
            schema: [(error as Error).message],
          });
        }

        const generationId = nanoid(12);

        console.log(
          `Object generation requested: ${generationId} by ${walletAddress} using ${model}, schema: ${schemaType || 'custom'}`
        );

        // Generate structured object
        const result = await generateObject({
          model: aiModel,
          system:
            systemPrompt ||
            'Generate a structured object based on the prompt and schema provided.',
          prompt,
          schema,
          temperature: temperature ?? 0.3, // Lower temperature for structured generation
          maxOutputTokens: maxTokens,
        });

        const generationResult = {
          id: generationId,
          model,
          object: result.object,
          finishReason: result.finishReason,
          usage: {
            inputTokens: result.usage.inputTokens,
            outputTokens: result.usage.outputTokens,
            totalTokens: result.usage.totalTokens,
          },
          metadata: {
            generationId,
            walletAddress,
            schemaType: schemaType || 'custom',
            timestamp: Date.now(),
          },
        };

        console.log(
          `Object generated: ${generationId}, tokens: ${result.usage.totalTokens}`
        );

        const response = successResponse(generationResult);
        return addSecurityHeaders(response);
      } catch (error) {
        console.error('AI object generation error:', error);
        const response = NextResponse.json(
          { error: 'Failed to generate object' },
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
      // Return available schemas
      const schemas = Object.keys(commonSchemas).map((key) => ({
        name: key,
        description: `Schema for ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
      }));

      const response = successResponse({
        availableSchemas: schemas,
        customSchemaSupported: true,
        supportedModels: ['gpt-4o', 'gpt-4o-mini', 'gpt-4', 'gpt-3.5-turbo'],
      });

      return addSecurityHeaders(response);
    } catch (error) {
      console.error('Get schemas error:', error);
      const response = NextResponse.json(
        { error: 'Failed to retrieve schemas' },
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
