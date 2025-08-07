/**
 * Agent Streaming Execution API
 * Handles real-time streaming of agent execution
 */

import type { NextRequest } from 'next/server';
import { z } from 'zod';
import type { Id } from '@/../../packages/backend/convex/_generated/dataModel';
import { agenticEngine } from '@/lib/agentic/engine';
import { api, convex } from '@/lib/database/convex';
import { type AuthenticatedRequest, withAuth } from '@/lib/middleware/auth';
import { aiRateLimit } from '@/lib/middleware/rate-limit';
import type { Agent, ExecuteAgentRequest } from '@/lib/types/agentic';
import { convexAgentToApiFormat } from '@/lib/utils/agent-conversion';
import {
  createCorsPreflightResponse,
  getStreamingHeaders,
} from '@/lib/utils/cors';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('agent-stream-api');

// =============================================================================
// Request Validation
// =============================================================================

const streamExecutionSchema = z.object({
  input: z.string().min(1).max(10_000),
  maxSteps: z.number().min(1).max(50).optional(),
  autoApprove: z.boolean().default(false),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// =============================================================================
// Route Context Type
// =============================================================================

interface RouteContext {
  params: Promise<{ agentId: string }>;
}

// =============================================================================
// Production Convex Integration
// =============================================================================

// =============================================================================
// Route Handler
// =============================================================================

export const maxDuration = 300; // 5 minutes for streaming

export async function POST(request: NextRequest, context: RouteContext) {
  return aiRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      const { walletAddress } = authReq.user;
      const { agentId } = await context.params;
      const origin = req.headers.get('origin');

      // Get agent from Convex
      const agentDoc = await convex.query(api.agents.getById, {
        id: agentId as Id<'agents'>,
      });
      if (!agentDoc) {
        return new Response('Agent not found', { status: 404 });
      }

      // Check ownership
      if (agentDoc.walletAddress !== walletAddress) {
        return new Response('Unauthorized', { status: 403 });
      }

      // Convert to Agent format for execution engine with validation
      let agent: Agent;
      try {
        agent = convexAgentToApiFormat(agentDoc);
      } catch (conversionError) {
        log.error('Agent conversion error', { 
          agentId, 
          walletAddress, 
          error: conversionError instanceof Error ? conversionError.message : String(conversionError) 
        });
        return new Response(
          JSON.stringify({
            error: 'Invalid agent configuration',
            details:
              conversionError instanceof Error
                ? conversionError.message
                : 'Unknown conversion error',
          }),
          {
            status: 422,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Parse and validate request body
      const body = await req.json();
      const validation = streamExecutionSchema.safeParse(body);

      if (!validation.success) {
        return new Response(
          JSON.stringify({
            error: 'Invalid request data',
            details: validation.error.flatten().fieldErrors,
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const executeRequest: ExecuteAgentRequest = {
        agentId,
        ...validation.data,
      };

      // Create a streaming response with enhanced error handling
      const encoder = new TextEncoder();
      let isClientDisconnected = false;
      let executionAborted = false;
      const abortController = new AbortController();

      // Detect client disconnect
      req.signal?.addEventListener('abort', () => {
        log.info('Client disconnected from stream', { agentId, walletAddress });
        isClientDisconnected = true;
        executionAborted = true;
        abortController.abort();
      });

      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Add heartbeat to detect client disconnect early
            const heartbeatInterval = setInterval(() => {
              if (isClientDisconnected || executionAborted) {
                clearInterval(heartbeatInterval);
                return;
              }

              try {
                const heartbeat =
                  JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }) +
                  '\n';
                controller.enqueue(encoder.encode(`data: ${heartbeat}\n\n`));
              } catch (heartbeatError) {
                log.debug('Client disconnected during heartbeat', { agentId });
                isClientDisconnected = true;
                clearInterval(heartbeatInterval);
              }
            }, 30_000); // Send heartbeat every 30 seconds

            // Stream execution events
            for await (const event of agenticEngine.streamExecution(
              agent,
              executeRequest
            )) {
              // Check if client disconnected
              if (isClientDisconnected || executionAborted) {
                log.info('Stopping stream due to client disconnect or abort', { agentId });
                clearInterval(heartbeatInterval);
                controller.close();
                return;
              }

              try {
                const data = JSON.stringify(event) + '\n';
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              } catch (enqueueError) {
                log.debug('Client disconnected during event streaming', { agentId });
                isClientDisconnected = true;
                clearInterval(heartbeatInterval);
                controller.close();
                return;
              }
            }

            clearInterval(heartbeatInterval);

            // Send done event only if client is still connected
            if (!(isClientDisconnected || executionAborted)) {
              try {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              } catch (doneError) {
                log.debug('Client disconnected when sending done event', { agentId });
              }
            }

            controller.close();
          } catch (error) {
            log.error('Stream execution error', { 
              agentId, 
              walletAddress, 
              error: error instanceof Error ? error.message : String(error) 
            });

            // Don't send error if client is disconnected
            if (!(isClientDisconnected || executionAborted)) {
              try {
                const errorEvent = {
                  type: 'error',
                  data: {
                    error:
                      error instanceof Error ? error.message : String(error),
                    code: 'EXECUTION_ERROR',
                    timestamp: Date.now(),
                  },
                };
                const data = JSON.stringify(errorEvent) + '\n';
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              } catch (errorEnqueueError) {
                log.debug('Client disconnected during error sending', { agentId });
              }
            }

            controller.close();
          }
        },

        cancel(reason) {
          log.info('Stream cancelled by client', { agentId, reason });
          isClientDisconnected = true;
          executionAborted = true;
          abortController.abort();
        },
      });

      return new Response(stream, {
        headers: getStreamingHeaders(origin, {
          methods: ['POST', 'OPTIONS'],
          headers: ['Content-Type', 'Authorization'],
        }),
      });
    });
  });
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return createCorsPreflightResponse(origin, {
    methods: ['POST', 'OPTIONS'],
    headers: ['Content-Type', 'Authorization'],
  });
}
