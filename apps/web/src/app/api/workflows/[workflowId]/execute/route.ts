/**
 * Workflow Execution Endpoint
 * Handles execution of multi-step workflows with agent orchestration
 */

import { nanoid } from 'nanoid';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { agenticEngine } from '@/lib/agentic/engine';
import { type AuthenticatedRequest, withAuth } from '@/lib/middleware/auth';
import { aiRateLimit } from '@/lib/middleware/rate-limit';
import type {
  Agent,
  ExecuteWorkflowRequest,
  StepResult,
  Workflow,
  WorkflowExecution,
  WorkflowStep,
} from '@/lib/types/agentic';
import type { JsonObject, JsonValue } from '@/lib/types/mcp';
import {
  addSecurityHeaders,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/utils/api-response';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('workflow-execute-api');

// =============================================================================
// Request Validation Schema
// =============================================================================

const executeWorkflowSchema = z.object({
  input: z.record(z.string(), z.unknown()).optional(),
  autoApprove: z.boolean().default(false),
  stream: z.boolean().default(false),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// =============================================================================
// Mock Data Stores
// =============================================================================

const mockWorkflows = new Map<string, Workflow>();
const mockExecutions = new Map<string, WorkflowExecution>();
// TODO: Load agents from Convex when needed for workflow execution
// const mockAgents = new Map<string, Agent>(); // Shared with agent endpoints

// =============================================================================
// Workflow Orchestration Engine
// =============================================================================

class WorkflowOrchestrator {
  private execution: WorkflowExecution;
  private workflow: Workflow;
  private autoApprove: boolean;

  constructor(
    workflow: Workflow,
    execution: WorkflowExecution,
    autoApprove = false
  ) {
    this.workflow = workflow;
    this.execution = execution;
    this.autoApprove = autoApprove;
  }

  async executeWorkflow(): Promise<WorkflowExecution> {
    try {
      this.execution.status = 'running';

      // Start with the first step
      const firstStep = this.workflow.steps[0];
      await this.executeStep(firstStep);

      this.execution.status = 'completed';
      this.execution.completedAt = Date.now();

      return this.execution;
    } catch (error) {
      this.execution.status = 'failed';
      this.execution.error = {
        stepId: 'workflow-execution',
        code: 'EXECUTION_ERROR',
        message: error instanceof Error ? error.message : String(error),
        details: { workflowId: this.execution.workflowId },
      };
      this.execution.completedAt = Date.now();
      throw error;
    }
  }

  private async executeStep(step: WorkflowStep): Promise<JsonValue> {
    log.info('Executing workflow step', { stepName: step.name, stepType: step.type, stepId: step.id });

    this.execution.currentStep = step.id;

    let stepResult: JsonValue;

    switch (step.type) {
      case 'agent_task':
        stepResult = await this.executeAgentTask(step);
        break;
      case 'condition':
        stepResult = await this.evaluateCondition(step);
        break;
      case 'parallel':
        stepResult = await this.executeParallelSteps(step);
        break;
      case 'sequential':
        stepResult = await this.executeSequentialSteps(step);
        break;
      case 'human_approval':
        stepResult = await this.requestHumanApproval(step);
        break;
      case 'delay':
        stepResult = await this.executeDelay(step);
        break;
      case 'webhook':
        stepResult = await this.executeWebhook(step);
        break;
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }

    // Store step result
    this.execution.stepResults[step.id] = {
      status: 'completed',
      output: stepResult,
      startedAt: Date.now(),
      completedAt: Date.now(),
    } as StepResult;

    // Execute next steps if any
    if (step.nextSteps && step.nextSteps.length > 0) {
      for (const nextStepId of step.nextSteps) {
        const nextStep = this.workflow.steps.find((s) => s.id === nextStepId);
        if (nextStep) {
          await this.executeStep(nextStep);
        }
      }
    }

    return stepResult;
  }

  private async executeAgentTask(step: WorkflowStep): Promise<{
    type: 'agent_execution';
    agentId: string;
    executionId: string;
    result: JsonValue;
    status: string;
  }> {
    if (!step.agentId) {
      throw new Error(`Agent task step "${step.name}" requires an agentId`);
    }

    // TODO: Get agent from Convex for workflow execution
    // For now, skip agent-dependent steps in workflows
    log.warn('Skipping agent step - not implemented yet', { stepId: step.id, agentId: step.agentId });
    return {
      type: 'agent_execution' as const,
      agentId: step.agentId || 'unknown',
      executionId: 'skipped',
      result: { message: 'Agent step skipped - not implemented yet' },
      status: 'skipped',
    };

    /* Original agent execution code - TODO: reimplement with Convex
    // Prepare input for agent based on step parameters and previous results
    const agentInput = this.prepareAgentInput(step);

    // Execute agent
    const agentExecution = await agenticEngine.executeAgent(agent, {
      agentId: agent.id,
      input: agentInput,
      autoApprove: this.autoApprove,
      metadata: {
        workflowExecutionId: this.execution.id,
        workflowStepId: step.id,
        ...step.parameters,
      },
    });

    return {
      type: 'agent_execution',
      agentId: step.agentId,
      executionId: agentExecution.id,
      result: agentExecution.result || null,
      status: agentExecution.status,
    };
    */
  }

  private async evaluateCondition(step: WorkflowStep): Promise<{
    type: 'condition_evaluation';
    condition: string;
    result: boolean;
    timestamp: number;
  }> {
    if (!step.condition) {
      throw new Error(`Condition step "${step.name}" requires a condition`);
    }

    // Simple condition evaluation (in production, use a proper expression engine)
    const result = this.evaluateConditionExpression(step.condition);

    return {
      type: 'condition_evaluation',
      condition: step.condition,
      result,
      timestamp: Date.now(),
    };
  }

  private async executeParallelSteps(step: WorkflowStep): Promise<{
    type: 'parallel_execution';
    results: Array<{
      stepId: string;
      status: string;
      value?: JsonValue;
      error?: JsonValue;
    }>;
  }> {
    if (!step.nextSteps || step.nextSteps.length === 0) {
      throw new Error(`Parallel step "${step.name}" requires nextSteps`);
    }

    const parallelResults = await Promise.allSettled(
      step.nextSteps.map(async (stepId) => {
        const nextStep = this.workflow.steps.find((s) => s.id === stepId);
        if (!nextStep) {
          throw new Error(`Step not found: ${stepId}`);
        }
        return await this.executeStep(nextStep);
      })
    );

    return {
      type: 'parallel_execution',
      results: parallelResults.map((result, index) => ({
        stepId: step.nextSteps![index],
        status: result.status,
        value: result.status === 'fulfilled' ? result.value : undefined,
        error: result.status === 'rejected' ? result.reason : undefined,
      })),
    };
  }

  private async executeSequentialSteps(step: WorkflowStep): Promise<{
    type: 'sequential_execution';
    results: Array<{
      stepId: string;
      result: JsonValue;
    }>;
  }> {
    if (!step.nextSteps || step.nextSteps.length === 0) {
      throw new Error(`Sequential step "${step.name}" requires nextSteps`);
    }

    const results = [];
    for (const stepId of step.nextSteps) {
      const nextStep = this.workflow.steps.find((s) => s.id === stepId);
      if (!nextStep) {
        throw new Error(`Step not found: ${stepId}`);
      }
      const result = await this.executeStep(nextStep);
      results.push({ stepId, result });
    }

    return {
      type: 'sequential_execution',
      results,
    };
  }

  private async requestHumanApproval(step: WorkflowStep): Promise<{
    type: 'human_approval';
    approved: boolean;
    autoApproved?: boolean;
    message?: string;
    timestamp: number;
  }> {
    if (this.autoApprove) {
      return {
        type: 'human_approval',
        approved: true,
        autoApproved: true,
        timestamp: Date.now(),
      };
    }

    // In production, this would create an approval request and wait for response
    // For now, simulate approval after a short delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      type: 'human_approval',
      approved: true,
      message: 'Auto-approved for demo',
      timestamp: Date.now(),
    };
  }

  private async executeDelay(step: WorkflowStep): Promise<{
    type: 'delay';
    delayMs: number;
    timestamp: number;
  }> {
    const delayMs =
      typeof step.parameters?.delayMs === 'number'
        ? step.parameters.delayMs
        : 1000;
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    return {
      type: 'delay',
      delayMs,
      timestamp: Date.now(),
    };
  }

  private async executeWebhook(step: WorkflowStep): Promise<{
    type: 'webhook';
    webhookType: string;
    status: string;
    timestamp: number;
    response: {
      success: boolean;
      message: string;
    };
  }> {
    // Mock webhook execution
    const webhookType =
      typeof step.parameters?.webhook_type === 'string'
        ? step.parameters.webhook_type
        : 'generic';

    return {
      type: 'webhook',
      webhookType,
      status: 'sent',
      timestamp: Date.now(),
      response: { success: true, message: 'Webhook sent successfully' },
    };
  }

  private prepareAgentInput(step: WorkflowStep): string {
    const parameters = step.parameters || {};
    const previousResults = Object.values(this.execution.stepResults);

    // Create contextual input for the agent
    let input = `Execute task: ${step.name}\n\n`;

    if (Object.keys(parameters).length > 0) {
      input += `Parameters:\n${JSON.stringify(parameters, null, 2)}\n\n`;
    }

    if (previousResults.length > 0) {
      input += `Previous step results:\n${JSON.stringify(previousResults.slice(-3), null, 2)}\n\n`;
    }

    input +=
      'Please complete this task according to the parameters and context provided.';

    return input;
  }

  private evaluateConditionExpression(condition: string): boolean {
    // Simple condition evaluation - in production, use a proper expression engine
    try {
      // Basic safety check
      if (!/^[a-zA-Z0-9_\s+\-*/%()><=!&|.]+$/.test(condition)) {
        return false;
      }

      // For demo purposes, return true for most conditions
      // In production, this would evaluate against actual step results
      return true;
    } catch {
      return false;
    }
  }
}

// =============================================================================
// Route Context Type
// =============================================================================

interface RouteContext {
  params: Promise<{ workflowId: string }>;
}

// =============================================================================
// Route Handler
// =============================================================================

export const maxDuration = 300; // 5 minutes for workflow execution

export async function POST(request: NextRequest, context: RouteContext) {
  return aiRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress } = authReq.user;
        const { workflowId } = await context.params;

        // Get workflow from store
        const workflow = mockWorkflows.get(workflowId);
        if (!workflow) {
          return notFoundResponse('Workflow not found');
        }

        // Check ownership
        if (workflow.walletAddress !== walletAddress) {
          return unauthorizedResponse(
            'Access denied: You do not own this workflow'
          );
        }

        // Check if workflow is active
        if (!workflow.isActive) {
          return validationErrorResponse('Cannot execute inactive workflow');
        }

        // Parse and validate request body
        const body = await req.json();
        const validation = executeWorkflowSchema.safeParse(body);

        if (!validation.success) {
          return validationErrorResponse(
            'Invalid execution request',
            validation.error.flatten().fieldErrors
          );
        }

        const executeData = validation.data;

        // Create workflow execution record
        const execution: WorkflowExecution = {
          id: nanoid(),
          workflowId: workflow.id,
          walletAddress,
          status: 'pending',
          currentStep: '',
          stepResults: {},
          startedAt: Date.now(),
        };

        mockExecutions.set(execution.id, execution);

        log.info('Workflow execution started', { 
          executionId: execution.id, 
          workflowId, 
          walletAddress 
        });

        // Handle streaming vs non-streaming execution
        if (executeData.stream) {
          // Return streaming response
          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            async start(controller) {
              try {
                const orchestrator = new WorkflowOrchestrator(
                  workflow,
                  execution,
                  executeData.autoApprove
                );

                // Send initial event
                const startEvent = {
                  type: 'execution_started',
                  data: { executionId: execution.id, workflowId: workflow.id },
                };
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(startEvent)}\n\n`)
                );

                // Execute workflow
                const result = await orchestrator.executeWorkflow();

                // Send completion event
                const endEvent = {
                  type: 'execution_completed',
                  data: result,
                };
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(endEvent)}\n\n`)
                );

                controller.close();
              } catch (error) {
                const errorEvent = {
                  type: 'execution_failed',
                  data: {
                    executionId: execution.id,
                    error:
                      error instanceof Error ? error.message : String(error),
                  },
                };
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`)
                );
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
        // Execute workflow synchronously
        const orchestrator = new WorkflowOrchestrator(
          workflow,
          execution,
          executeData.autoApprove
        );
        const result = await orchestrator.executeWorkflow();

        log.info('Workflow execution completed', { 
          executionId: result.id, 
          status: result.status, 
          stepsCompleted: Object.keys(result.stepResults).length 
        });

        const response = successResponse({
          execution: result,
          summary: {
            executionId: result.id,
            status: result.status,
            stepsCompleted: Object.keys(result.stepResults).length,
            totalSteps: workflow.steps.length,
            executionTime: result.completedAt
              ? result.completedAt - result.startedAt
              : undefined,
          },
        });

        const origin = req.headers.get('origin');
        return addSecurityHeaders(response, origin);
      } catch (error) {
        log.error('Workflow execution error', { 
          error: error instanceof Error ? error.message : String(error) 
        });
        const response = NextResponse.json(
          {
            error: 'Workflow execution failed',
            details: error instanceof Error ? error.message : String(error),
          },
          { status: 500 }
        );
        const origin = req.headers.get('origin');
        return addSecurityHeaders(response, origin);
      }
    });
  });
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const { createCorsPreflightResponse } = await import('@/lib/utils/cors');

  return createCorsPreflightResponse(origin, {
    methods: ['POST', 'OPTIONS'],
    headers: ['Content-Type', 'Authorization'],
  });
}
