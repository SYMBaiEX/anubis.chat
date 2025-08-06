/**
 * Agentic AI Management Endpoint
 * Handles CRUD operations for AI agents and agent execution with enhanced v2 features
 */

import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { ConvexError } from 'convex/values';
import { nanoid } from 'nanoid';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  agenticEngine,
  createAgentFromTemplate,
  validateAgentConfig,
} from '@/lib/agentic/engine';
import { AgentFactory, type Agent as V2Agent, type OrchestratorAgent } from '@/lib/agents/core';
import { convex, api } from '@/lib/database/convex';
import type { Id } from '@/../../packages/backend/convex/_generated/dataModel';
import { getAllTools, getToolsByCategory } from '@/lib/agentic/tools';
import { initializeDefaultMCPServers, mcpManager } from '@/lib/mcp/client';
import { type AuthenticatedRequest, withAuth } from '@/lib/middleware/auth';
import { aiRateLimit } from '@/lib/middleware/rate-limit';
import type {
  Agent,
  AgentTool,
  CreateAgentRequest,
  ExecuteAgentRequest,
  PaginatedAgentsResponse,
} from '@/lib/types/agentic';
import type { AIToolCollection } from '@/lib/types/tools';
import {
  addSecurityHeaders,
  createdResponse,
  notFoundResponse,
  paginatedResponse,
  successResponse,
  validationErrorResponse,
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
  role: z.enum(['researcher', 'coder', 'analyst', 'orchestrator']).optional(),
  model: z
    .enum(['gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet', 'gemini-2.0-flash'])
    .default('gpt-4o-mini'),
  provider: z.enum(['openai', 'anthropic', 'google']).default('openai'),
  systemPrompt: z
    .string()
    .max(2000, 'System prompt must be 2000 characters or less')
    .optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(128_000).optional(),
  maxSteps: z.number().min(1).max(50).default(10),
  tools: z.array(z.string()).optional(),
  enableMCPTools: z.boolean().default(false),
});

const executeAgentSchema = z.object({
  input: z
    .string()
    .min(1, 'Input is required')
    .max(10_000, 'Input must be 10000 characters or less'),
  type: z.enum(['generate', 'stream', 'analyze', 'execute']).default('generate'),
  maxSteps: z.number().min(1).max(50).optional(),
  autoApprove: z.boolean().default(false),
  context: z
    .array(
      z.object({
        role: z.enum(['system', 'user', 'assistant']),
        content: z.string(),
      })
    )
    .optional(),
  outputFormat: z.enum(['text', 'json', 'structured']).optional(),
  schema: z.any().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const listAgentsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  template: z
    .enum(['general', 'research', 'analysis', 'blockchain', 'custom'])
    .optional(),
  search: z.string().max(100).optional(),
});

// =============================================================================
// Production Convex Database Integration - Enhanced with v2 features
// =============================================================================

// v2 Enhanced agents storage for WorkflowEngine integration
const v2Agents = new Map<string, V2Agent>();
const orchestrators = new Map<string, OrchestratorAgent>();

// Initialize MCP servers on first request
let mcpInitialized = false;

async function ensureMCPInitialized() {
  if (!mcpInitialized) {
    try {
      await initializeDefaultMCPServers();
      mcpInitialized = true;
    } catch (error) {
      console.error('Failed to initialize MCP servers:', error);
    }
  }
}

// Helper to get language model
function getLanguageModel(provider: string, model: string) {
  switch (provider) {
    case 'anthropic':
      return anthropic(model);
    case 'google':
      return google(model);
    case 'openai':
    default:
      return openai(model);
  }
}

// Initialize default agents in Convex if they don't exist
async function initializeDefaultAgents(walletAddress: string) {
  try {
    const existingAgents = await convex.query(api.agents.getByOwner, {
      walletAddress,
      limit: 10,
    });

    // Only create default agents if none exist
    if (existingAgents.length === 0) {
      const defaultAgents = [
        {
          name: 'General Assistant',
          template: 'general',
          systemPrompt: 'You are a helpful AI assistant.',
        },
        {
          name: 'Research Specialist',
          template: 'research',
          systemPrompt: 'You are an expert research assistant.',
        },
        {
          name: 'Data Analyst',
          template: 'analysis',
          systemPrompt: 'You are a data analysis expert.',
        },
        {
          name: 'Blockchain Assistant',
          template: 'blockchain',
          systemPrompt: 'You are a blockchain and cryptocurrency expert.',
        },
      ];

      for (const agent of defaultAgents) {
        await convex.mutation(api.agents.create, {
          name: agent.name,
          description: `Default ${agent.template} agent`,
          model: 'gpt-4o-mini',
          systemPrompt: agent.systemPrompt,
          maxSteps: 10,
          walletAddress,
        });
      }
    }
  } catch (error) {
    console.error('Failed to initialize default agents:', error);
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

        // Initialize default agents if needed
        await initializeDefaultAgents(walletAddress);

        // Parse and validate query parameters
        const queryValidation = listAgentsSchema.safeParse({
          cursor: searchParams.get('cursor'),
          limit: searchParams.get('limit'),
          template: searchParams.get('template'),
          search: searchParams.get('search'),
        });

        if (!queryValidation.success) {
          return validationErrorResponse(
            'Invalid query parameters',
            queryValidation.error.flatten().fieldErrors
          );
        }

        const { cursor, limit, template, search } = queryValidation.data;

        // Get user agents from Convex
        const agents = await convex.query(api.agents.getByOwner, {
          walletAddress,
          limit,
        });

        // Convert Convex data to API format
        let formattedAgents = agents.map((agent) => ({
          id: agent._id,
          name: agent.name,
          description: agent.description,
          model: agent.model,
          systemPrompt: agent.systemPrompt,
          temperature: agent.temperature,
          maxTokens: agent.maxTokens,
          tools: agent.tools || [],
          maxSteps: agent.maxSteps || 10,
          walletAddress: agent.walletAddress,
          createdAt: agent.createdAt,
          updatedAt: agent.updatedAt,
        }));

        // Add v2 agents to the list (convert to v1 format for compatibility)
        const v2AgentsList = Array.from(v2Agents.entries()).map(([id, agent]) => {
          const config = agent.getConfig();
          return {
            id: config.id as Id<'agents'>,
            name: config.name,
            description: config.metadata?.description || `${config.role} agent`,
            model: typeof config.model === 'string' ? config.model : 'gpt-4o-mini',
            systemPrompt: config.systemPrompt,
            temperature: config.temperature,
            maxTokens: config.metadata?.maxTokens || 2000,
            tools: config.tools ? Object.keys(config.tools) : [],
            maxSteps: 10,
            walletAddress,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
        });

        // Add orchestrators to the list
        const orchestratorsList = Array.from(orchestrators.entries()).map(([id, orchestrator]) => {
          const config = orchestrator.getConfig();
          return {
            id: config.id as Id<'agents'>,
            name: config.name,
            description: config.metadata?.description || 'Orchestrator Agent',
            model: typeof config.model === 'string' ? config.model : 'gpt-4o-mini',
            systemPrompt: config.systemPrompt,
            temperature: config.temperature,
            maxTokens: config.metadata?.maxTokens || 2000,
            tools: config.tools ? Object.keys(config.tools) : [],
            maxSteps: 10,
            walletAddress,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
        });

        // Combine all agents
        formattedAgents = [...formattedAgents, ...v2AgentsList, ...orchestratorsList];

        // Apply filters
        if (template) {
          formattedAgents = formattedAgents.filter((agent) =>
            agent.name.toLowerCase().includes(template.toLowerCase())
          );
        }

        if (search) {
          formattedAgents = formattedAgents.filter(
            (agent) =>
              agent.name.toLowerCase().includes(search.toLowerCase()) ||
              (agent.description &&
                agent.description.toLowerCase().includes(search.toLowerCase()))
          );
        }

        // Simple pagination without cursor (Convex handles most of it)
        const hasMore = formattedAgents.length === limit;
        const nextCursor = hasMore
          ? formattedAgents[formattedAgents.length - 1]?.id
          : undefined;

        console.log(
          `Listed ${formattedAgents.length} agents for user ${walletAddress}`
        );

        const response = paginatedResponse(formattedAgents, {
          cursor,
          nextCursor,
          hasMore,
          limit,
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

        // Enhanced agent creation with v2 features
        let newAgent: Agent | undefined;
        let v2Agent: V2Agent | OrchestratorAgent | undefined;

        // Initialize MCP if requested
        if (agentData.enableMCPTools) {
          await ensureMCPInitialized();
        }

        // Check if using enhanced v2 features (role, provider, MCP tools)
        const useV2Features = agentData.role || agentData.provider !== 'openai' || agentData.enableMCPTools;

        if (useV2Features && agentData.role) {
          // Create v2 enhanced agent
          const languageModel = getLanguageModel(agentData.provider, agentData.model);
          const tools = agentData.enableMCPTools
            ? (mcpManager.getAllTools() as AIToolCollection)
            : undefined;

          switch (agentData.role) {
            case 'researcher':
              v2Agent = AgentFactory.createResearcher(languageModel, tools);
              break;
            case 'coder':
              v2Agent = AgentFactory.createCoder(languageModel, tools);
              break;
            case 'analyst':
              v2Agent = AgentFactory.createAnalyst(languageModel, tools);
              break;
            case 'orchestrator':
              v2Agent = AgentFactory.createOrchestrator(languageModel, tools);
              orchestrators.set(v2Agent.getConfig().id, v2Agent as OrchestratorAgent);
              break;
          }

          if (v2Agent) {
            // Update config with custom settings
            v2Agent.updateConfig({
              name: agentData.name,
              temperature: agentData.temperature,
            });

            const agentId = v2Agent.getConfig().id;
            v2Agents.set(agentId, v2Agent);

            // Create compatible v1 agent record
            const config = v2Agent.getConfig();
            newAgent = {
              id: config.id,
              name: config.name,
              description: agentData.description,
              model: agentData.model,
              systemPrompt: config.systemPrompt || agentData.systemPrompt || 'You are a helpful AI assistant.',
              temperature: agentData.temperature,
              maxTokens: agentData.maxTokens,
              tools: agentData.tools,
              maxSteps: agentData.maxSteps,
              walletAddress,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
          }
        }

        // Fallback to v1 agent creation
        if (!newAgent) {
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
              systemPrompt:
                agentData.systemPrompt || 'You are a helpful AI assistant.',
              temperature: agentData.temperature,
              maxTokens: agentData.maxTokens,
              tools: agentData.tools,
              maxSteps: agentData.maxSteps,
              walletAddress,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
          }
        }

        // Override template defaults with provided values
        if (agentData.model !== 'gpt-4o-mini') newAgent.model = agentData.model;
        if (agentData.systemPrompt)
          newAgent.systemPrompt = agentData.systemPrompt;
        if (agentData.temperature !== undefined)
          newAgent.temperature = agentData.temperature;
        if (agentData.maxTokens !== undefined)
          newAgent.maxTokens = agentData.maxTokens;
        if (agentData.maxSteps !== 10) newAgent.maxSteps = agentData.maxSteps;
        if (agentData.tools) newAgent.tools = agentData.tools;
        if (agentData.description) newAgent.description = agentData.description;

        // Validate agent configuration
        const validationErrors = validateAgentConfig(newAgent);
        if (validationErrors.length > 0) {
          return validationErrorResponse('Invalid agent configuration', {
            config: validationErrors,
          });
        }

        // Convert tools to string array for Convex storage
        const toolNames = newAgent.tools
          ? Array.isArray(newAgent.tools) && newAgent.tools.length > 0 && typeof newAgent.tools[0] === 'object'
            ? (newAgent.tools as AgentTool[]).map(tool => tool.name)
            : newAgent.tools as string[]
          : [];

        // Store agent in Convex
        await convex.mutation(api.agents.create, {
          name: newAgent.name,
          description: newAgent.description,
          model: newAgent.model,
          systemPrompt: newAgent.systemPrompt,
          temperature: newAgent.temperature,
          maxTokens: newAgent.maxTokens,
          tools: toolNames,
          maxSteps: newAgent.maxSteps,
          walletAddress: newAgent.walletAddress,
        });

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
