/**
 * Individual Agent Management Endpoint
 * Handles operations for specific agents (get, update, delete) using Convex
 */

import type { Id } from '@convex/_generated/dataModel';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateAgentConfig } from '@/lib/agentic/engine';
import { api, convex } from '@/lib/database/convex';
import { type AuthenticatedRequest, withAuth } from '@/lib/middleware/auth';
import { aiRateLimit } from '@/lib/middleware/rate-limit';
import type { Agent } from '@/lib/types/agentic';
import { convexAgentToApiFormat } from '@/lib/utils/agent-conversion';
import {
  addSecurityHeaders,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/utils/api-response';

// =============================================================================
// Request Validation Schemas
// =============================================================================

const updateAgentSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional(),
  model: z
    .enum(['gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet', 'gemini-2.0-flash'])
    .optional(),
  systemPrompt: z
    .string()
    .max(2000, 'System prompt must be 2000 characters or less')
    .optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(8000).optional(),
  maxSteps: z.number().min(1).max(50).optional(),
  tools: z.array(z.string()).optional(),
});

// =============================================================================
// Route Context Type
// =============================================================================

interface RouteContext {
  params: Promise<{ agentId: string }>;
}

// =============================================================================
// Route Handlers
// =============================================================================

export async function GET(request: NextRequest, context: RouteContext) {
  return aiRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress } = authReq.user;
        const { agentId } = await context.params;

        // Get agent from Convex
        const agent = await convex.query(api.agents.getById, {
          id: agentId as Id<'agents'>,
        });
        if (!agent) {
          return notFoundResponse('Agent not found');
        }

        // Check ownership
        if (agent.walletAddress !== walletAddress) {
          return unauthorizedResponse(
            'Access denied: You do not own this agent'
          );
        }

        console.log(`Agent retrieved: ${agentId} by user ${walletAddress}`);

        // Convert Convex document to API format
        const formattedAgent = convexAgentToApiFormat(agent);

        const response = successResponse(formattedAgent);
        return addSecurityHeaders(response);
      } catch (error) {
        console.error('Get agent error:', error);
        const response = NextResponse.json(
          { error: 'Failed to retrieve agent' },
          { status: 500 }
        );
        return addSecurityHeaders(response);
      }
    });
  });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return aiRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress } = authReq.user;
        const { agentId } = await context.params;

        // Parse and validate request body
        const body = await req.json();
        const validation = updateAgentSchema.safeParse(body);

        if (!validation.success) {
          return validationErrorResponse(
            'Invalid agent update data',
            validation.error.flatten().fieldErrors
          );
        }

        const updateData = validation.data;

        // Update agent in Convex (handles ownership internally)
        const updatedAgent = await convex.mutation(api.agents.update, {
          id: agentId as Id<'agents'>,
          walletAddress,
          ...updateData,
        });

        if (!updatedAgent) {
          return notFoundResponse('Agent not found or update failed');
        }

        console.log(`Agent updated: ${agentId} by user ${walletAddress}`);

        // Convert to API format
        const formattedAgent = convexAgentToApiFormat(updatedAgent);

        const response = successResponse(formattedAgent);
        return addSecurityHeaders(response);
      } catch (error) {
        console.error('Update agent error:', error);

        // Handle Convex mutation errors (including ownership/not found)
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update agent';

        if (
          errorMessage.includes('not found') ||
          errorMessage.includes('access denied')
        ) {
          return errorMessage.includes('not found')
            ? notFoundResponse('Agent not found')
            : unauthorizedResponse('Access denied: You do not own this agent');
        }

        const response = NextResponse.json(
          { error: 'Failed to update agent' },
          { status: 500 }
        );
        return addSecurityHeaders(response);
      }
    });
  });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return aiRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress } = authReq.user;
        const { agentId } = await context.params;

        // Delete agent from Convex (handles ownership internally)
        await convex.mutation(api.agents.remove, {
          id: agentId as Id<'agents'>,
          walletAddress,
        });

        console.log(`Agent deleted: ${agentId} by user ${walletAddress}`);

        const response = successResponse({
          message: 'Agent deleted successfully',
          agentId,
        });
        return addSecurityHeaders(response);
      } catch (error) {
        console.error('Delete agent error:', error);

        // Handle Convex mutation errors (including ownership/not found)
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to delete agent';

        if (
          errorMessage.includes('not found') ||
          errorMessage.includes('access denied')
        ) {
          return errorMessage.includes('not found')
            ? notFoundResponse('Agent not found')
            : unauthorizedResponse('Access denied: You do not own this agent');
        }

        if (errorMessage.includes('active executions')) {
          const response = NextResponse.json(
            { error: 'Cannot delete agent with active executions' },
            { status: 409 }
          );
          return addSecurityHeaders(response);
        }

        const response = NextResponse.json(
          { error: 'Failed to delete agent' },
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
