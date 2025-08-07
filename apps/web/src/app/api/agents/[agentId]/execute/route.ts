/**
 * Agent Execution Endpoint
 * Handles execution of specific agents with multi-step reasoning and tool calling
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { Id } from '@/../../packages/backend/convex/_generated/dataModel';
import { agenticEngine } from '@/lib/agentic/engine';
import { api, convex } from '@/lib/database/convex';
import { type AuthenticatedRequest, withAuth } from '@/lib/middleware/auth';
import { aiRateLimit } from '@/lib/middleware/rate-limit';
import type { Agent, ExecuteAgentRequest } from '@/lib/types/agentic';
import {
  addSecurityHeaders,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/utils/api-response';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('agent-execute-api');

// =============================================================================
// Request Validation Schema
// =============================================================================

const executeAgentSchema = z.object({
  input: z
    .string()
    .min(1, 'Input is required')
    .max(10_000, 'Input must be 10000 characters or less'),
  maxSteps: z.number().min(1).max(50).optional(),
  autoApprove: z.boolean().default(false),
  stream: z.boolean().default(false),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// =============================================================================
// Production Convex Integration
// =============================================================================

// =============================================================================
// Route Context Type
// =============================================================================

interface RouteContext {
  params: Promise<{ agentId: string }>;
}

// =============================================================================
// Route Handlers
// =============================================================================

export const maxDuration = 300; // 5 minutes for long-running executions

export async function POST(request: NextRequest, context: RouteContext) {
  return aiRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress } = authReq.user;
        const { agentId } = await context.params;

        // Get agent from Convex
        const agentDoc = await convex.query(api.agents.getById, {
          id: agentId as Id<'agents'>,
        });
        if (!agentDoc) {
          return notFoundResponse('Agent not found');
        }

        // Check ownership
        if (agentDoc.walletAddress !== walletAddress) {
          return unauthorizedResponse(
            'Access denied: You do not own this agent'
          );
        }

        // Convert to Agent format for execution engine
        const agent: Agent = {
          id: agentDoc._id,
          name: agentDoc.name,
          description: agentDoc.description,
          model: agentDoc.model,
          systemPrompt: agentDoc.systemPrompt,
          temperature: agentDoc.temperature,
          maxTokens: agentDoc.maxTokens,
          tools: agentDoc.tools || [],
          maxSteps: agentDoc.maxSteps || 10,
          walletAddress: agentDoc.walletAddress,
          createdAt: agentDoc.createdAt,
          updatedAt: agentDoc.updatedAt,
        };

        // Parse and validate request body
        const body = await req.json();
        const validation = executeAgentSchema.safeParse(body);

        if (!validation.success) {
          return validationErrorResponse(
            'Invalid execution request',
            validation.error.flatten().fieldErrors
          );
        }

        const executeData = validation.data;

        // Create execution request
        const executionRequest: ExecuteAgentRequest = {
          agentId: agent.id,
          input: executeData.input,
          maxSteps: executeData.maxSteps,
          autoApprove: executeData.autoApprove,
          metadata: executeData.metadata,
        };

        log.info('Agent execution started', {
          agentId,
          walletAddress,
          autoApprove: executeData.autoApprove,
        });

        // Handle streaming vs non-streaming execution
        if (executeData.stream) {
          // Return streaming response
          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            async start(controller) {
              try {
                for await (const event of agenticEngine.streamExecution(
                  agent,
                  executionRequest
                )) {
                  const data = `data: ${JSON.stringify(event)}\n\n`;
                  controller.enqueue(encoder.encode(data));
                }
                controller.close();
              } catch (error) {
                const errorEvent = {
                  type: 'error',
                  data: {
                    error:
                      error instanceof Error ? error.message : String(error),
                  },
                };
                const data = `data: ${JSON.stringify(errorEvent)}\n\n`;
                controller.enqueue(encoder.encode(data));
                controller.close();
              }
            },
          });

          const { getStreamingHeaders } = await import('@/lib/utils/cors');
          const origin = req.headers.get('origin');

          return new NextResponse(stream, {
            headers: getStreamingHeaders(origin, {
              methods: ['POST', 'OPTIONS'],
              headers: ['Content-Type', 'Authorization'],
            }),
          });
        }
        // Execute agent synchronously
        const execution = await agenticEngine.executeAgent(
          agent,
          executionRequest
        );

        log.info('Agent execution completed', {
          executionId: execution.id,
          status: execution.status,
          stepsCount: execution.steps.length,
        });

        const response = successResponse({
          execution,
          summary: {
            executionId: execution.id,
            status: execution.status,
            totalSteps: execution.steps.length,
            executionTime: execution.completedAt
              ? execution.completedAt - execution.startedAt
              : undefined,
            tokensUsed: execution.result?.tokensUsed,
            toolsUsed: execution.result?.toolsUsed,
          },
        });

        return addSecurityHeaders(response);
      } catch (error) {
        log.error('Agent execution error', {
          agentId,
          walletAddress,
          error: error instanceof Error ? error.message : String(error),
        });
        const response = NextResponse.json(
          {
            error: 'Agent execution failed',
            details: error instanceof Error ? error.message : String(error),
          },
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
