/**
 * Individual Agent Management Endpoint
 * Handles operations for specific agents (get, update, delete)
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { type AuthenticatedRequest, withAuth } from '@/lib/middleware/auth';
import { aiRateLimit } from '@/lib/middleware/rate-limit';
import type { Agent } from '@/lib/types/agentic';
import { validateAgentConfig } from '@/lib/agentic/engine';
import {
  addSecurityHeaders,
  successResponse,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse
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
  systemPrompt: z
    .string()
    .max(2000, 'System prompt must be 2000 characters or less')
    .optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(8000).optional(),
  maxSteps: z.number().min(1).max(50).optional(),
  tools: z.array(z.string()).optional()
});

// =============================================================================
// Mock Data Store (should be same as in route.ts)
// =============================================================================

// In production, this would be managed by Convex
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

export async function GET(
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

        console.log(`Agent retrieved: ${agentId} by user ${walletAddress}`);

        const response = successResponse(agent);
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

export async function PUT(
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
        const validation = updateAgentSchema.safeParse(body);

        if (!validation.success) {
          return validationErrorResponse(
            'Invalid agent update data',
            validation.error.flatten().fieldErrors
          );
        }

        const updateData = validation.data;

        // Create updated agent
        const updatedAgent: Agent = {
          ...agent,
          ...updateData,
          updatedAt: Date.now()
        };

        // Validate updated agent configuration
        const validationErrors = validateAgentConfig(updatedAgent);
        if (validationErrors.length > 0) {
          return validationErrorResponse('Invalid agent configuration', {
            config: validationErrors
          });
        }

        // Update agent in store
        mockAgents.set(agentId, updatedAgent);

        console.log(`Agent updated: ${agentId} by user ${walletAddress}`);

        const response = successResponse(updatedAgent);
        return addSecurityHeaders(response);
      } catch (error) {
        console.error('Update agent error:', error);
        const response = NextResponse.json(
          { error: 'Failed to update agent' },
          { status: 500 }
        );
        return addSecurityHeaders(response);
      }
    });
  });
}

export async function DELETE(
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

        // Delete agent from store
        mockAgents.delete(agentId);

        console.log(`Agent deleted: ${agentId} by user ${walletAddress}`);

        const response = successResponse({ 
          message: 'Agent deleted successfully',
          agentId 
        });
        return addSecurityHeaders(response);
      } catch (error) {
        console.error('Delete agent error:', error);
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