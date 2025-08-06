/**
 * Agent Execution Endpoint
 * Handles execution of specific agents with multi-step reasoning and tool calling
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { type AuthenticatedRequest, withAuth } from '@/lib/middleware/auth';
import { aiRateLimit } from '@/lib/middleware/rate-limit';
import type { Agent, ExecuteAgentRequest } from '@/lib/types/agentic';
import { agenticEngine } from '@/lib/agentic/engine';
import {
  addSecurityHeaders,
  successResponse,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse
} from '@/lib/utils/api-response';

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
  metadata: z.record(z.unknown()).optional()
});

// =============================================================================
// Mock Data Store (should be same as in other agent routes)
// =============================================================================

const mockAgents = new Map<string, Agent>();

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

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  return aiRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress } = authReq.user;
        const { agentId } = await context.params;

        // Get agent from store
        const agent = mockAgents.get(agentId);
        if (!agent) {
          return notFoundResponse('Agent not found');
        }

        // Check ownership
        if (agent.walletAddress !== walletAddress) {
          return unauthorizedResponse('Access denied: You do not own this agent');
        }

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
          metadata: executeData.metadata
        };

        console.log(
          `Agent execution started: ${agentId} by ${walletAddress}, auto-approve: ${executeData.autoApprove}`
        );

        // Handle streaming vs non-streaming execution
        if (executeData.stream) {
          // Return streaming response
          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            async start(controller) {
              try {
                for await (const event of agenticEngine.streamExecution(agent, executionRequest)) {
                  const data = `data: ${JSON.stringify(event)}\n\n`;
                  controller.enqueue(encoder.encode(data));
                }
                controller.close();
              } catch (error) {
                const errorEvent = {
                  type: 'error',
                  data: { error: error instanceof Error ? error.message : String(error) }
                };
                const data = `data: ${JSON.stringify(errorEvent)}\n\n`;
                controller.enqueue(encoder.encode(data));
                controller.close();
              }
            }
          });

          return new NextResponse(stream, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
          });
        } else {
          // Execute agent synchronously
          const execution = await agenticEngine.executeAgent(agent, executionRequest);

          console.log(
            `Agent execution completed: ${execution.id}, status: ${execution.status}, steps: ${execution.steps.length}`
          );

          const response = successResponse({
            execution,
            summary: {
              executionId: execution.id,
              status: execution.status,
              totalSteps: execution.steps.length,
              executionTime: execution.completedAt ? execution.completedAt - execution.startedAt : undefined,
              tokensUsed: execution.result?.tokensUsed,
              toolsUsed: execution.result?.toolsUsed
            }
          });

          return addSecurityHeaders(response);
        }
      } catch (error) {
        console.error('Agent execution error:', error);
        const response = NextResponse.json(
          { 
            error: 'Agent execution failed',
            details: error instanceof Error ? error.message : String(error)
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