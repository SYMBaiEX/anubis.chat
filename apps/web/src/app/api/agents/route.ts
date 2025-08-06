/**
 * Agentic AI Management Endpoint
 * Handles CRUD operations for AI agents and agent execution
 */

import { nanoid } from 'nanoid';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { type AuthenticatedRequest, withAuth } from '@/lib/middleware/auth';
import { aiRateLimit } from '@/lib/middleware/rate-limit';
import type { 
  Agent, 
  CreateAgentRequest,
  ExecuteAgentRequest,
  PaginatedAgentsResponse 
} from '@/lib/types/agentic';
import { 
  agenticEngine,
  createAgentFromTemplate,
  validateAgentConfig 
} from '@/lib/agentic/engine';
import { getAllTools, getToolsByCategory } from '@/lib/agentic/tools';
import {
  addSecurityHeaders,
  createdResponse,
  paginatedResponse,
  successResponse,
  validationErrorResponse,
  notFoundResponse
} from '@/lib/utils/api-response';

// =============================================================================
// Request Validation Schemas
// =============================================================================

const createAgentSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional(),
  template: z
    .enum(['general', 'research', 'analysis', 'blockchain', 'custom'])
    .default('general'),
  model: z.string().default('gpt-4o-mini'),
  systemPrompt: z
    .string()
    .max(2000, 'System prompt must be 2000 characters or less')
    .optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(8000).optional(),
  maxSteps: z.number().min(1).max(50).default(10),
  tools: z.array(z.string()).optional()
});

const executeAgentSchema = z.object({
  input: z
    .string()
    .min(1, 'Input is required')
    .max(10_000, 'Input must be 10000 characters or less'),
  maxSteps: z.number().min(1).max(50).optional(),
  autoApprove: z.boolean().default(false),
  metadata: z.record(z.unknown()).optional()
});

const listAgentsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  template: z
    .enum(['general', 'research', 'analysis', 'blockchain', 'custom'])
    .optional(),
  search: z.string().max(100).optional()
});

// =============================================================================
// Mock Data Store (In production, use Convex)
// =============================================================================

const mockAgents = new Map<string, Agent>();

// Create some default agents for demonstration
function initializeMockAgents(walletAddress: string) {
  if (mockAgents.size === 0) {
    // General Assistant
    const generalAgent = createAgentFromTemplate('General Assistant', 'general', walletAddress);
    mockAgents.set(generalAgent.id, generalAgent);

    // Research Specialist  
    const researchAgent = createAgentFromTemplate('Research Specialist', 'research', walletAddress);
    mockAgents.set(researchAgent.id, researchAgent);

    // Data Analyst
    const analysisAgent = createAgentFromTemplate('Data Analyst', 'analysis', walletAddress);
    mockAgents.set(analysisAgent.id, analysisAgent);

    // Blockchain Assistant
    const blockchainAgent = createAgentFromTemplate('Blockchain Assistant', 'blockchain', walletAddress);
    mockAgents.set(blockchainAgent.id, blockchainAgent);
  }
}

// =============================================================================
// Route Handlers
// =============================================================================

export const maxDuration = 300; // 5 minutes for long-running agent executions

export async function GET(request: NextRequest) {
  return aiRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress } = authReq.user;
        const { searchParams } = new URL(req.url);

        // Initialize mock data
        initializeMockAgents(walletAddress);

        // Parse and validate query parameters
        const queryValidation = listAgentsSchema.safeParse({
          cursor: searchParams.get('cursor'),
          limit: searchParams.get('limit'),
          template: searchParams.get('template'),
          search: searchParams.get('search')
        });

        if (!queryValidation.success) {
          return validationErrorResponse(
            'Invalid query parameters',
            queryValidation.error.flatten().fieldErrors
          );
        }

        const { cursor, limit, template, search } = queryValidation.data;

        // Get user agents with filtering
        let userAgents = Array.from(mockAgents.values())
          .filter(agent => agent.walletAddress === walletAddress);

        // Apply filters
        if (template) {
          userAgents = userAgents.filter(agent => 
            agent.name.toLowerCase().includes(template.toLowerCase())
          );
        }

        if (search) {
          userAgents = userAgents.filter(agent =>
            agent.name.toLowerCase().includes(search.toLowerCase()) ||
            (agent.description && agent.description.toLowerCase().includes(search.toLowerCase()))
          );
        }

        // Apply pagination
        let startIndex = 0;
        if (cursor) {
          const cursorIndex = userAgents.findIndex(agent => agent.id === cursor);
          if (cursorIndex !== -1) {
            startIndex = cursorIndex + 1;
          }
        }

        const paginatedAgents = userAgents.slice(startIndex, startIndex + limit);
        const hasMore = startIndex + limit < userAgents.length;
        const nextCursor = hasMore ? paginatedAgents[paginatedAgents.length - 1]?.id : undefined;

        console.log(`Listed ${paginatedAgents.length} agents for user ${walletAddress}`);

        const response = paginatedResponse(paginatedAgents, {
          cursor,
          nextCursor,
          hasMore,
          limit
        });

        return addSecurityHeaders(response);
      } catch (error) {
        console.error('List agents error:', error);
        const response = NextResponse.json(
          { error: 'Failed to retrieve agents' },
          { status: 500 }
        );
        return addSecurityHeaders(response);
      }
    });
  });
}

export async function POST(request: NextRequest) {
  return aiRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress } = authReq.user;

        // Parse and validate request body
        const body = await req.json();
        const validation = createAgentSchema.safeParse(body);

        if (!validation.success) {
          return validationErrorResponse(
            'Invalid agent data',
            validation.error.flatten().fieldErrors
          );
        }

        const agentData = validation.data;

        // Create agent from template or custom config
        let newAgent: Agent;
        
        if (agentData.template !== 'custom') {
          newAgent = createAgentFromTemplate(
            agentData.name,
            agentData.template,
            walletAddress,
            agentData.systemPrompt
          );
        } else {
          // Create custom agent
          newAgent = {
            id: nanoid(),
            name: agentData.name,
            description: agentData.description,
            model: agentData.model,
            systemPrompt: agentData.systemPrompt || 'You are a helpful AI assistant.',
            temperature: agentData.temperature,
            maxTokens: agentData.maxTokens,
            tools: agentData.tools,
            maxSteps: agentData.maxSteps,
            walletAddress,
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
        }

        // Override template defaults with provided values
        if (agentData.model !== 'gpt-4o-mini') newAgent.model = agentData.model;
        if (agentData.systemPrompt) newAgent.systemPrompt = agentData.systemPrompt;
        if (agentData.temperature !== undefined) newAgent.temperature = agentData.temperature;
        if (agentData.maxTokens !== undefined) newAgent.maxTokens = agentData.maxTokens;
        if (agentData.maxSteps !== 10) newAgent.maxSteps = agentData.maxSteps;
        if (agentData.tools) newAgent.tools = agentData.tools;
        if (agentData.description) newAgent.description = agentData.description;

        // Validate agent configuration
        const validationErrors = validateAgentConfig(newAgent);
        if (validationErrors.length > 0) {
          return validationErrorResponse('Invalid agent configuration', {
            config: validationErrors
          });
        }

        // Store agent (in production, save to Convex)
        mockAgents.set(newAgent.id, newAgent);

        console.log(`Agent created: ${newAgent.id} for user ${walletAddress}`);

        const response = createdResponse(newAgent);
        return addSecurityHeaders(response);
      } catch (error) {
        console.error('Create agent error:', error);
        const response = NextResponse.json(
          { error: 'Failed to create agent' },
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