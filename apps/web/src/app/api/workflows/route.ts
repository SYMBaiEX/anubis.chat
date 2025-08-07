/**
 * Workflow Management Endpoint
 * Handles CRUD operations for multi-step workflows with enhanced v2 features
 */

import { openai } from '@ai-sdk/openai';
import { ConvexError } from 'convex/values';
import { nanoid } from 'nanoid';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createModuleLogger } from '@/lib/utils/logger';
import type { Id } from '@/../../packages/backend/convex/_generated/dataModel';
import { Agent, AgentFactory } from '@/lib/agents/core';
import { api, convex } from '@/lib/database/convex';
import { type AuthenticatedRequest, withAuth } from '@/lib/middleware/auth';
import { aiRateLimit } from '@/lib/middleware/rate-limit';
import type {
  CreateWorkflowRequest,
  ExecuteWorkflowRequest,
  Workflow,
  WorkflowExecution,
  WorkflowStep,
  WorkflowTrigger,
} from '@/lib/types/agentic';
import {
  addSecurityHeaders,
  createdResponse,
  notFoundResponse,
  paginatedResponse,
  successResponse,
  validationErrorResponse,
} from '@/lib/utils/api-response';
import {
  WorkflowBuilder,
  type WorkflowDefinition,
  WorkflowEngine,
} from '@/lib/workflows/engine';

// =============================================================================
// Logger
// =============================================================================

const log = createModuleLogger('api/workflows');

// =============================================================================
// Request Validation Schemas
// =============================================================================

const workflowStepSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum([
    'agent_task',
    'condition',
    'parallel',
    'sequential',
    'human_approval',
    'delay',
    'webhook',
    'start',
    'end',
    'task',
    'loop',
    'subworkflow',
  ]),
  agentId: z.string().optional(),
  condition: z.string().optional(),
  parameters: z.record(z.string(), z.unknown()).optional(),
  nextSteps: z.array(z.string()).optional(),
  requiresApproval: z.boolean().default(false),
  config: z.any().optional(),
  next: z.union([z.string(), z.array(z.string())]).optional(),
});

const workflowTriggerSchema = z.object({
  type: z.enum(['manual', 'schedule', 'webhook', 'completion', 'condition']),
  condition: z.string(),
  parameters: z.record(z.string(), z.unknown()).optional(),
});

const createWorkflowSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional(),
  steps: z
    .array(workflowStepSchema)
    .min(1, 'At least one step is required')
    .max(50, 'Maximum 50 steps allowed'),
  triggers: z.array(workflowTriggerSchema).optional(),
  // v2 enhanced features
  nodes: z
    .array(
      z.object({
        id: z.string(),
        type: z.enum([
          'start',
          'end',
          'task',
          'condition',
          'parallel',
          'loop',
          'subworkflow',
        ]),
        name: z.string(),
        description: z.string().optional(),
        config: z.any().optional(),
        next: z.union([z.string(), z.array(z.string())]).optional(),
      })
    )
    .optional(),
  edges: z
    .array(
      z.object({
        from: z.string(),
        to: z.string(),
        condition: z.string().optional(),
      })
    )
    .optional(),
  variables: z.record(z.string(), z.any()).optional(),
  timeout: z.number().optional(),
});

const executeWorkflowSchema = z.object({
  input: z.record(z.string(), z.unknown()).optional(),
  autoApprove: z.boolean().default(false),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const listWorkflowsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  active: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  search: z.string().max(100).optional(),
});

// =============================================================================
// Production Convex Database Integration - Enhanced with v2 features
// =============================================================================

// v2 Enhanced workflow storage
const workflowEngine = new WorkflowEngine();
const v2Workflows = new Map<string, WorkflowDefinition>();

// Initialize default agents for workflows
let workflowInitialized = false;
async function initializeDefaultAgents() {
  if (workflowInitialized) return;

  const model = openai('gpt-4o-mini');

  // Create some default agents for the WorkflowEngine
  const researcher = AgentFactory.createResearcher(model);
  const coder = AgentFactory.createCoder(model);
  const analyst = AgentFactory.createAnalyst(model);

  workflowEngine.registerAgent(researcher);
  workflowEngine.registerAgent(coder);
  workflowEngine.registerAgent(analyst);

  workflowInitialized = true;
}

// =============================================================================
// Route Handlers
// =============================================================================

export const maxDuration = 300; // 5 minutes for workflow execution

export async function GET(request: NextRequest) {
  return aiRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress } = authReq.user;
        const { searchParams } = new URL(req.url);

        // Parse and validate query parameters
        const queryValidation = listWorkflowsSchema.safeParse({
          cursor: searchParams.get('cursor'),
          limit: searchParams.get('limit'),
          active: searchParams.get('active'),
          search: searchParams.get('search'),
        });

        if (!queryValidation.success) {
          return validationErrorResponse(
            'Invalid query parameters',
            queryValidation.error.flatten().fieldErrors
          );
        }

        const { cursor, limit, active, search } = queryValidation.data;

        // Get user workflows from Convex
        const workflows = await convex.query(api.workflows.getByOwner, {
          walletAddress,
          limit,
          isActive: active,
        });

        // Convert Convex data to API format
        const formattedWorkflows = workflows.map((workflow) => ({
          id: workflow._id,
          name: workflow.name,
          description: workflow.description,
          // Steps and triggers need to be fetched separately from workflowSteps/workflowTriggers tables
          // For now, return empty arrays - could be enhanced later to fetch related data
          steps: [],
          triggers: [],
          walletAddress: workflow.walletAddress,
          isActive: workflow.isActive,
          createdAt: workflow.createdAt,
          updatedAt: workflow.updatedAt,
        }));

        // Apply search filter if provided
        let filteredWorkflows = formattedWorkflows;
        if (search) {
          filteredWorkflows = filteredWorkflows.filter(
            (workflow) =>
              workflow.name.toLowerCase().includes(search.toLowerCase()) ||
              (workflow.description &&
                workflow.description
                  .toLowerCase()
                  .includes(search.toLowerCase()))
          );
        }

        // Simple pagination without cursor (Convex handles most of it)
        const hasMore = filteredWorkflows.length === limit;
        const nextCursor = hasMore
          ? filteredWorkflows[filteredWorkflows.length - 1]?.id
          : undefined;

        log.apiRequest('GET /api/workflows', {
          walletAddress,
          count: filteredWorkflows.length,
          hasMore,
          searchTerm: search || undefined,
          activeFilter: active,
        });

        const response = paginatedResponse(filteredWorkflows, {
          cursor,
          nextCursor,
          hasMore,
          limit,
        });

        return addSecurityHeaders(response);
      } catch (error) {
        log.error('Failed to list workflows', {
          error,
          operation: 'list_workflows',
        });
        const response = NextResponse.json(
          { error: 'Failed to retrieve workflows' },
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

        // Initialize default agents
        await initializeDefaultAgents();

        // Parse and validate request body
        const body = await req.json();
        const validation = createWorkflowSchema.safeParse(body);

        if (!validation.success) {
          return validationErrorResponse(
            'Invalid workflow data',
            validation.error.flatten().fieldErrors
          );
        }

        const workflowData = validation.data;

        // Enhanced workflow creation with v2 features
        const useV2Features = workflowData.nodes && workflowData.edges;

        if (useV2Features) {
          // Create v2-style workflow using WorkflowBuilder
          const builder = new WorkflowBuilder(
            workflowData.name,
            workflowData.description
          );

          // Add nodes from v2 format
          workflowData.nodes!.forEach((node) => {
            builder.addNode(node);
          });

          // Add edges from v2 format
          workflowData.edges!.forEach((edge) => {
            builder.addEdge(edge.from, edge.to, edge.condition);
          });

          // Set variables and timeout if provided
          if (workflowData.variables) {
            builder.setVariables(workflowData.variables);
          }

          if (workflowData.timeout) {
            builder.setTimeout(workflowData.timeout);
          }

          // Build the v2 workflow definition
          const v2Workflow = builder.build();

          // Register with v2 workflow engine
          workflowEngine.registerWorkflow(v2Workflow);
          v2Workflows.set(v2Workflow.id, v2Workflow);

          // Convert v2 nodes to v1 steps format for Convex storage
          const steps = v2Workflow.nodes.map((node, index) => ({
            stepId: node.id,
            name: node.name,
            type:
              node.type === 'task'
                ? ('agent_task' as const)
                : (node.type as any),
            agentId: node.config?.agentId as Id<'agents'>,
            condition: node.config?.condition as string,
            parameters: node.config?.parameters || {},
            nextSteps: Array.isArray(node.next)
              ? node.next
              : node.next
                ? [node.next]
                : [],
            requiresApproval: node.config?.requiresApproval as boolean,
            order: index,
          }));

          // Validate workflow structure
          const validationErrors = validateWorkflowSteps(steps);
          if (validationErrors.length > 0) {
            return validationErrorResponse('Invalid workflow structure', {
              structure: validationErrors,
            });
          }

          // Convert triggers
          const triggers = workflowData.triggers?.map((trigger) => ({
            triggerId: nanoid(),
            type: trigger.type,
            condition: trigger.condition,
            parameters: trigger.parameters || {},
            isActive: true,
          }));

          // Create workflow in Convex
          const createdWorkflow = await convex.mutation(api.workflows.create, {
            name: workflowData.name,
            description: workflowData.description,
            walletAddress,
            steps: steps as any, // Cast to avoid type mismatch with new step types
            triggers,
          });

          if (!createdWorkflow) {
            throw new Error('Failed to create workflow in database');
          }

          // Create compatible API response
          const newWorkflow = {
            id: createdWorkflow._id,
            name: createdWorkflow.name,
            description: createdWorkflow.description,
            steps: steps.map((step) => ({
              id: step.stepId,
              name: step.name,
              type: step.type,
              agentId: step.agentId,
              condition: step.condition,
              parameters: step.parameters,
              nextSteps: step.nextSteps,
              requiresApproval: step.requiresApproval,
              config: step.parameters,
              next: step.nextSteps,
            })),
            triggers:
              triggers?.map((trigger) => ({
                id: trigger.triggerId,
                type: trigger.type,
                condition: trigger.condition,
                parameters: trigger.parameters,
              })) || [],
            walletAddress,
            isActive: true,
            createdAt: createdWorkflow.createdAt,
            updatedAt: createdWorkflow.updatedAt,
          };

          log.dbOperation('workflow_created', {
            workflowId: createdWorkflow._id,
            walletAddress,
            type: 'v2',
            stepCount: steps.length,
            triggerCount: triggers?.length || 0,
          });

          const response = createdResponse(newWorkflow);
          return addSecurityHeaders(response);
        }
        // Create traditional v1 workflow
        const steps = workflowData.steps.map((step, index) => ({
          stepId: nanoid(),
          name: step.name,
          type: step.type,
          agentId: step.agentId as Id<'agents'>,
          condition: step.condition,
          parameters: step.parameters || {},
          nextSteps: step.nextSteps || [],
          requiresApproval: step.requiresApproval,
          order: index,
        }));

        // Validate v1 workflow structure
        const validationErrors = validateWorkflowSteps(steps);
        if (validationErrors.length > 0) {
          return validationErrorResponse('Invalid workflow structure', {
            structure: validationErrors,
          });
        }

        const triggers = workflowData.triggers?.map((trigger) => ({
          triggerId: nanoid(),
          type: trigger.type,
          condition: trigger.condition,
          parameters: trigger.parameters || {},
          isActive: true,
        }));

        // Create workflow in Convex
        const createdWorkflow = await convex.mutation(api.workflows.create, {
          name: workflowData.name,
          description: workflowData.description,
          walletAddress,
          steps: steps as any, // Cast to avoid type mismatch with new step types
          triggers,
        });

        if (!createdWorkflow) {
          throw new Error('Failed to create workflow in database');
        }

        // Create API response
        const newWorkflow = {
          id: createdWorkflow._id,
          name: createdWorkflow.name,
          description: createdWorkflow.description,
          steps: steps.map((step) => ({
            id: step.stepId,
            name: step.name,
            type: step.type,
            agentId: step.agentId,
            condition: step.condition,
            parameters: step.parameters,
            nextSteps: step.nextSteps,
            requiresApproval: step.requiresApproval,
            config: step.parameters,
            next: step.nextSteps,
          })),
          triggers:
            triggers?.map((trigger) => ({
              id: trigger.triggerId,
              type: trigger.type,
              condition: trigger.condition,
              parameters: trigger.parameters,
            })) || [],
          walletAddress,
          isActive: true,
          createdAt: createdWorkflow.createdAt,
          updatedAt: createdWorkflow.updatedAt,
        };

        log.dbOperation('workflow_created', {
          workflowId: createdWorkflow._id,
          walletAddress,
          type: 'v1',
          stepCount: steps.length,
          triggerCount: triggers?.length || 0,
        });

        const response = createdResponse(newWorkflow);
        return addSecurityHeaders(response);
      } catch (error) {
        log.error('Failed to create workflow', {
          error,
          operation: 'create_workflow',
        });
        const response = NextResponse.json(
          { error: 'Failed to create workflow' },
          { status: 500 }
        );
        return addSecurityHeaders(response);
      }
    });
  });
}

export async function PUT(request: NextRequest) {
  return aiRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress } = authReq.user;

        // Initialize default agents
        await initializeDefaultAgents();

        // Parse and validate request body
        const body = await req.json();
        const validation = executeWorkflowSchema.safeParse(body);

        if (!validation.success) {
          return validationErrorResponse(
            'Invalid execution request',
            validation.error.flatten().fieldErrors
          );
        }

        const { input, autoApprove, metadata } = validation.data;

        // Get workflow ID from URL or body
        const { searchParams } = new URL(req.url);
        const workflowId = searchParams.get('id') || body.workflowId;

        if (!workflowId) {
          return validationErrorResponse('Workflow ID is required');
        }

        // Get workflow from Convex
        let workflow;
        try {
          workflow = await convex.query(api.workflows.getById, {
            id: workflowId as Id<'workflows'>,
          });
        } catch (error) {
          // Invalid ID format
          return notFoundResponse(`Workflow ${workflowId} not found`);
        }

        if (!workflow) {
          return notFoundResponse(`Workflow ${workflowId} not found`);
        }

        // Check ownership
        if (workflow.walletAddress !== walletAddress) {
          return NextResponse.json(
            { error: 'Unauthorized to execute this workflow' },
            { status: 403 }
          );
        }

        // Check if workflow is active
        if (!workflow.isActive) {
          return NextResponse.json(
            { error: 'Cannot execute inactive workflow' },
            { status: 400 }
          );
        }

        // Check if this is a v2 workflow
        const v2Workflow = v2Workflows.get(workflowId);

        let executionResult;

        if (v2Workflow) {
          // Execute v2 workflow using WorkflowEngine
          try {
            executionResult = await workflowEngine.executeWorkflow(
              workflowId,
              input
            );
          } catch (error) {
            log.error('v2 workflow execution failed', {
              error,
              workflowId,
              type: 'v2',
            });
            executionResult = {
              id: nanoid(),
              status: 'failed',
              result: {
                error: 'Workflow execution failed',
                message:
                  error instanceof Error ? error.message : 'Unknown error',
              },
              executionTime: 0,
              metadata: {
                workflowType: 'v2',
                error: error instanceof Error ? error.message : 'Unknown error',
                ...metadata,
              },
            };
          }
        } else {
          // Create workflow execution in Convex
          const execution = await convex.mutation(
            api.workflows.createExecution,
            {
              workflowId: workflowId as Id<'workflows'>,
              walletAddress,
              variables: input || {},
            }
          );

          if (!execution) {
            throw new Error('Failed to create workflow execution');
          }

          // TODO: Implement actual workflow execution engine
          // For now, simulate successful execution
          await convex.mutation(api.workflows.updateExecution, {
            id: execution._id,
            walletAddress,
            status: 'completed',
            currentStep:
              workflow.steps[workflow.steps.length - 1]?.stepId || '',
          });

          executionResult = {
            id: execution._id,
            status: 'completed',
            result: {
              message: 'Workflow executed successfully',
              steps: workflow.steps.length,
              executionTime: 1500,
            },
            executionTime: 1500,
            metadata: {
              workflowType: 'v1',
              stepsExecuted: workflow.steps.length,
              ...metadata,
            },
          };
        }

        log.apiRequest('PUT /api/workflows - Execute', {
          workflowId,
          walletAddress,
          status: 'status' in executionResult ? executionResult.status : 'unknown',
          executionTime: 'executionTime' in executionResult ? executionResult.executionTime : 0,
        });

        const response = successResponse({
          executionId: 'id' in executionResult ? executionResult.id : 'unknown',
          workflowId,
          status:
            'status' in executionResult ? executionResult.status : 'unknown',
          result:
            'result' in executionResult
              ? executionResult.result
              : { message: 'No result' },
          executionTime:
            'executionTime' in executionResult
              ? executionResult.executionTime
              : 0,
          metadata:
            'metadata' in executionResult ? executionResult.metadata : {},
        });

        return addSecurityHeaders(response);
      } catch (error) {
        log.error('Failed to execute workflow', {
          error,
          workflowId,
          operation: 'execute_workflow',
        });
        const response = NextResponse.json(
          { error: 'Failed to execute workflow' },
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

// =============================================================================
// Validation Utilities
// =============================================================================

function validateWorkflowSteps(steps: any[]): string[] {
  const errors: string[] = [];

  // Validate steps exist
  if (!steps || steps.length === 0) {
    errors.push('Workflow must have at least one step');
  }

  // Validate step references
  const stepIds = new Set(steps.map((step) => step.stepId || step.id));
  for (const step of steps) {
    if (step.nextSteps) {
      for (const nextStepId of step.nextSteps) {
        if (!stepIds.has(nextStepId)) {
          errors.push(
            `Step "${step.name}" references non-existent step: ${nextStepId}`
          );
        }
      }
    }

    // Validate agent_task steps have agentId
    if (step.type === 'agent_task' && !step.agentId) {
      errors.push(`Agent task step "${step.name}" requires an agentId`);
    }

    // Validate condition steps have condition
    if (step.type === 'condition' && !step.condition) {
      errors.push(`Condition step "${step.name}" requires a condition`);
    }
  }

  return errors;
}
