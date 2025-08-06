/**
 * Workflow Management Endpoint
 * Handles CRUD operations for multi-step workflows and workflow execution orchestration
 */

import { nanoid } from 'nanoid';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { type AuthenticatedRequest, withAuth } from '@/lib/middleware/auth';
import { aiRateLimit } from '@/lib/middleware/rate-limit';
import type { 
  Workflow, 
  WorkflowStep, 
  WorkflowTrigger,
  CreateWorkflowRequest,
  ExecuteWorkflowRequest,
  WorkflowExecution
} from '@/lib/types/agentic';
import {
  addSecurityHeaders,
  createdResponse,
  paginatedResponse,
  successResponse,
  validationErrorResponse
} from '@/lib/utils/api-response';

// =============================================================================
// Request Validation Schemas
// =============================================================================

const workflowStepSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['agent_task', 'condition', 'parallel', 'sequential', 'human_approval', 'delay', 'webhook']),
  agentId: z.string().optional(),
  condition: z.string().optional(),
  parameters: z.record(z.unknown()).optional(),
  nextSteps: z.array(z.string()).optional(),
  requiresApproval: z.boolean().default(false)
});

const workflowTriggerSchema = z.object({
  type: z.enum(['manual', 'schedule', 'webhook', 'completion', 'condition']),
  condition: z.string(),
  parameters: z.record(z.unknown()).optional()
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
  triggers: z
    .array(workflowTriggerSchema)
    .optional()
});

const executeWorkflowSchema = z.object({
  input: z.record(z.unknown()).optional(),
  autoApprove: z.boolean().default(false),
  metadata: z.record(z.unknown()).optional()
});

const listWorkflowsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  active: z
    .enum(['true', 'false'])
    .transform(val => val === 'true')
    .optional(),
  search: z.string().max(100).optional()
});

// =============================================================================
// Mock Data Store (In production, use Convex)
// =============================================================================

const mockWorkflows = new Map<string, Workflow>();
const mockExecutions = new Map<string, WorkflowExecution>();

// Create some template workflows
function initializeTemplateWorkflows(walletAddress: string) {
  if (mockWorkflows.size === 0) {
    // Research Workflow
    const researchWorkflow: Workflow = {
      id: nanoid(),
      name: 'Research & Analysis Workflow',
      description: 'Comprehensive research workflow with web search, analysis, and summary generation',
      steps: [
        {
          id: nanoid(),
          name: 'Initial Research',
          type: 'agent_task',
          agentId: 'research-agent', // Would reference actual agent
          parameters: { tool: 'web_search', depth: 'broad' }
        },
        {
          id: nanoid(),
          name: 'Analyze Findings',
          type: 'agent_task',
          agentId: 'analysis-agent',
          parameters: { analysis_type: 'comprehensive' }
        },
        {
          id: nanoid(),
          name: 'Human Review',
          type: 'human_approval',
          requiresApproval: true
        },
        {
          id: nanoid(),
          name: 'Generate Summary',
          type: 'agent_task',
          agentId: 'general-agent',
          parameters: { format: 'executive_summary' }
        }
      ],
      triggers: [
        {
          id: nanoid(),
          type: 'manual',
          condition: 'user_initiated'
        }
      ],
      walletAddress,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    mockWorkflows.set(researchWorkflow.id, researchWorkflow);

    // Data Processing Workflow
    const dataWorkflow: Workflow = {
      id: nanoid(),
      name: 'Data Processing Pipeline',
      description: 'Automated data analysis and reporting pipeline',
      steps: [
        {
          id: nanoid(),
          name: 'Data Validation',
          type: 'agent_task',
          agentId: 'analysis-agent',
          parameters: { validation_type: 'comprehensive' }
        },
        {
          id: nanoid(),
          name: 'Parallel Analysis',
          type: 'parallel',
          nextSteps: ['stats-analysis', 'text-analysis']
        },
        {
          id: nanoid(),
          name: 'Statistical Analysis',
          type: 'agent_task',
          agentId: 'analysis-agent',
          parameters: { analysis_type: 'statistical' }
        },
        {
          id: nanoid(),
          name: 'Text Analysis',
          type: 'agent_task',
          agentId: 'analysis-agent',
          parameters: { analysis_type: 'text' }
        },
        {
          id: nanoid(),
          name: 'Generate Report',
          type: 'agent_task',
          agentId: 'general-agent',
          parameters: { format: 'detailed_report' }
        }
      ],
      triggers: [
        {
          id: nanoid(),
          type: 'webhook',
          condition: 'data_uploaded'
        }
      ],
      walletAddress,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    mockWorkflows.set(dataWorkflow.id, dataWorkflow);

    // Blockchain Monitoring Workflow
    const blockchainWorkflow: Workflow = {
      id: nanoid(),
      name: 'Blockchain Portfolio Monitor',
      description: 'Automated portfolio monitoring and alert system',
      steps: [
        {
          id: nanoid(),
          name: 'Check Wallet Balance',
          type: 'agent_task',
          agentId: 'blockchain-agent',
          parameters: { operation: 'balance_check' }
        },
        {
          id: nanoid(),
          name: 'Analyze Transactions',
          type: 'agent_task',
          agentId: 'blockchain-agent',
          parameters: { operation: 'transaction_analysis' }
        },
        {
          id: nanoid(),
          name: 'Risk Assessment',
          type: 'condition',
          condition: 'balance_change > 10% OR suspicious_activity',
          nextSteps: ['human-approval']
        },
        {
          id: nanoid(),
          name: 'Alert Review',
          type: 'human_approval',
          requiresApproval: true
        },
        {
          id: nanoid(),
          name: 'Generate Alert',
          type: 'webhook',
          parameters: { webhook_type: 'notification' }
        }
      ],
      triggers: [
        {
          id: nanoid(),
          type: 'schedule',
          condition: 'hourly'
        }
      ],
      walletAddress,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    mockWorkflows.set(blockchainWorkflow.id, blockchainWorkflow);
  }
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

        // Initialize template workflows
        initializeTemplateWorkflows(walletAddress);

        // Parse and validate query parameters
        const queryValidation = listWorkflowsSchema.safeParse({
          cursor: searchParams.get('cursor'),
          limit: searchParams.get('limit'),
          active: searchParams.get('active'),
          search: searchParams.get('search')
        });

        if (!queryValidation.success) {
          return validationErrorResponse(
            'Invalid query parameters',
            queryValidation.error.flatten().fieldErrors
          );
        }

        const { cursor, limit, active, search } = queryValidation.data;

        // Get user workflows with filtering
        let userWorkflows = Array.from(mockWorkflows.values())
          .filter(workflow => workflow.walletAddress === walletAddress);

        // Apply filters
        if (active !== undefined) {
          userWorkflows = userWorkflows.filter(workflow => workflow.isActive === active);
        }

        if (search) {
          userWorkflows = userWorkflows.filter(workflow =>
            workflow.name.toLowerCase().includes(search.toLowerCase()) ||
            (workflow.description && workflow.description.toLowerCase().includes(search.toLowerCase()))
          );
        }

        // Sort by creation date (newest first)
        userWorkflows.sort((a, b) => b.createdAt - a.createdAt);

        // Apply pagination
        let startIndex = 0;
        if (cursor) {
          const cursorIndex = userWorkflows.findIndex(workflow => workflow.id === cursor);
          if (cursorIndex !== -1) {
            startIndex = cursorIndex + 1;
          }
        }

        const paginatedWorkflows = userWorkflows.slice(startIndex, startIndex + limit);
        const hasMore = startIndex + limit < userWorkflows.length;
        const nextCursor = hasMore ? paginatedWorkflows[paginatedWorkflows.length - 1]?.id : undefined;

        console.log(`Listed ${paginatedWorkflows.length} workflows for user ${walletAddress}`);

        const response = paginatedResponse(paginatedWorkflows, {
          cursor,
          nextCursor,
          hasMore,
          limit
        });

        return addSecurityHeaders(response);
      } catch (error) {
        console.error('List workflows error:', error);
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

        // Create workflow
        const newWorkflow: Workflow = {
          id: nanoid(),
          name: workflowData.name,
          description: workflowData.description,
          steps: workflowData.steps.map(step => ({
            ...step,
            id: nanoid()
          })),
          triggers: workflowData.triggers?.map(trigger => ({
            ...trigger,
            id: nanoid()
          })),
          walletAddress,
          isActive: true,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        // Validate workflow structure
        const validationErrors = validateWorkflowStructure(newWorkflow);
        if (validationErrors.length > 0) {
          return validationErrorResponse('Invalid workflow structure', {
            structure: validationErrors
          });
        }

        // Store workflow
        mockWorkflows.set(newWorkflow.id, newWorkflow);

        console.log(`Workflow created: ${newWorkflow.id} for user ${walletAddress}`);

        const response = createdResponse(newWorkflow);
        return addSecurityHeaders(response);
      } catch (error) {
        console.error('Create workflow error:', error);
        const response = NextResponse.json(
          { error: 'Failed to create workflow' },
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

function validateWorkflowStructure(workflow: Workflow): string[] {
  const errors: string[] = [];

  // Validate steps
  if (!workflow.steps || workflow.steps.length === 0) {
    errors.push('Workflow must have at least one step');
  }

  // Validate step references
  const stepIds = new Set(workflow.steps.map(step => step.id));
  for (const step of workflow.steps) {
    if (step.nextSteps) {
      for (const nextStepId of step.nextSteps) {
        if (!stepIds.has(nextStepId)) {
          errors.push(`Step "${step.name}" references non-existent step: ${nextStepId}`);
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

  // Validate triggers
  if (workflow.triggers) {
    for (const trigger of workflow.triggers) {
      if (!trigger.condition) {
        errors.push(`Trigger of type "${trigger.type}" requires a condition`);
      }
    }
  }

  return errors;
}