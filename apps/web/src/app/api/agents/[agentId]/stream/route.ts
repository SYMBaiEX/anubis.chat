/**
 * Agent Streaming Execution API  
 * Handles real-time streaming of agent execution
 */

import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { agenticEngine } from '@/lib/agentic/engine';
import { convex, api } from '@/lib/database/convex';
import type { Id } from '@/../../packages/backend/convex/_generated/dataModel';
import { type AuthenticatedRequest, withAuth } from '@/lib/middleware/auth';
import { aiRateLimit } from '@/lib/middleware/rate-limit';
import type { Agent, ExecuteAgentRequest } from '@/lib/types/agentic';

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

      // Create a streaming response
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Stream execution events
            for await (const event of agenticEngine.streamExecution(
              agent,
              executeRequest
            )) {
              const data = JSON.stringify(event) + '\n';
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }

            // Send done event
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            const errorEvent = {
              type: 'error',
              data: {
                error: error instanceof Error ? error.message : String(error),
              },
            };
            const data = JSON.stringify(errorEvent) + '\n';
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'X-Content-Type-Options': 'nosniff',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    });
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}