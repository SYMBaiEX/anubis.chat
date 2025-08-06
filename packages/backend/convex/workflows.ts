/**
 * Convex Functions for Workflow Management System
 * Complete CRUD operations for workflows, steps, triggers, and executions
 */

import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import { mutation, query } from './_generated/server';

// =============================================================================
// Workflow Management
// =============================================================================

// Get workflow by ID
export const getById = query({
  args: { id: v.id('workflows') },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.id);
    if (!workflow) return null;

    // Get workflow steps
    const steps = await ctx.db
      .query('workflowSteps')
      .withIndex('by_workflow', (q) => q.eq('workflowId', args.id))
      .order('asc')
      .collect();

    // Get workflow triggers
    const triggers = await ctx.db
      .query('workflowTriggers')
      .withIndex('by_workflow', (q) => q.eq('workflowId', args.id))
      .collect();

    return {
      ...workflow,
      steps,
      triggers,
    };
  },
});

// Get workflows by owner
export const getByOwner = query({
  args: {
    walletAddress: v.string(),
    limit: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);

    let query = ctx.db
      .query('workflows')
      .withIndex('by_owner', (q) => q.eq('walletAddress', args.walletAddress));

    if (args.isActive !== undefined) {
      query = query.filter((q) => q.eq(q.field('isActive'), args.isActive));
    }

    return await query.order('desc').take(limit);
  },
});

// Create new workflow
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    walletAddress: v.string(),
    steps: v.array(
      v.object({
        stepId: v.string(),
        name: v.string(),
        type: v.union(
          v.literal('agent_task'),
          v.literal('condition'),
          v.literal('parallel'),
          v.literal('sequential'),
          v.literal('human_approval'),
          v.literal('delay'),
          v.literal('webhook')
        ),
        agentId: v.optional(v.id('agents')),
        condition: v.optional(v.string()),
        parameters: v.optional(v.any()),
        nextSteps: v.optional(v.array(v.string())),
        requiresApproval: v.optional(v.boolean()),
        order: v.number(),
      })
    ),
    triggers: v.optional(
      v.array(
        v.object({
          triggerId: v.string(),
          type: v.union(
            v.literal('manual'),
            v.literal('schedule'),
            v.literal('webhook'),
            v.literal('completion'),
            v.literal('condition')
          ),
          condition: v.string(),
          parameters: v.optional(v.any()),
          isActive: v.boolean(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Create workflow
    const workflowId = await ctx.db.insert('workflows', {
      name: args.name,
      description: args.description,
      walletAddress: args.walletAddress,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Create workflow steps
    for (const step of args.steps) {
      await ctx.db.insert('workflowSteps', {
        workflowId,
        stepId: step.stepId,
        name: step.name,
        type: step.type,
        agentId: step.agentId,
        condition: step.condition,
        parameters: step.parameters,
        nextSteps: step.nextSteps,
        requiresApproval: step.requiresApproval,
        order: step.order,
      });
    }

    // Create workflow triggers
    if (args.triggers) {
      for (const trigger of args.triggers) {
        await ctx.db.insert('workflowTriggers', {
          workflowId,
          triggerId: trigger.triggerId,
          type: trigger.type,
          condition: trigger.condition,
          parameters: trigger.parameters,
          isActive: trigger.isActive,
        });
      }
    }

    return await ctx.db.get(workflowId);
  },
});

// Update workflow
export const update = mutation({
  args: {
    id: v.id('workflows'),
    walletAddress: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.id);

    if (!workflow || workflow.walletAddress !== args.walletAddress) {
      throw new Error('Workflow not found or access denied');
    }

    const updates: any = { updatedAt: Date.now() };

    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    await ctx.db.patch(args.id, updates);
    return await ctx.db.get(args.id);
  },
});

// Delete workflow and related data
export const remove = mutation({
  args: {
    id: v.id('workflows'),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.id);

    if (!workflow || workflow.walletAddress !== args.walletAddress) {
      throw new Error('Workflow not found or access denied');
    }

    // Check for active executions
    const activeExecutions = await ctx.db
      .query('workflowExecutions')
      .withIndex('by_workflow', (q) => q.eq('workflowId', args.id))
      .filter((q) =>
        q.or(
          q.eq(q.field('status'), 'pending'),
          q.eq(q.field('status'), 'running'),
          q.eq(q.field('status'), 'waiting_approval')
        )
      )
      .collect();

    if (activeExecutions.length > 0) {
      throw new Error('Cannot delete workflow with active executions');
    }

    // Delete workflow steps
    const steps = await ctx.db
      .query('workflowSteps')
      .withIndex('by_workflow', (q) => q.eq('workflowId', args.id))
      .collect();

    for (const step of steps) {
      await ctx.db.delete(step._id);
    }

    // Delete workflow triggers
    const triggers = await ctx.db
      .query('workflowTriggers')
      .withIndex('by_workflow', (q) => q.eq('workflowId', args.id))
      .collect();

    for (const trigger of triggers) {
      await ctx.db.delete(trigger._id);
    }

    // Delete the workflow
    await ctx.db.delete(args.id);

    return { success: true, workflowId: args.id };
  },
});

// =============================================================================
// Workflow Executions
// =============================================================================

// Create workflow execution
export const createExecution = mutation({
  args: {
    workflowId: v.id('workflows'),
    walletAddress: v.string(),
    variables: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Verify workflow exists and user has access
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow || workflow.walletAddress !== args.walletAddress) {
      throw new Error('Workflow not found or access denied');
    }

    if (!workflow.isActive) {
      throw new Error('Cannot execute inactive workflow');
    }

    const executionId = await ctx.db.insert('workflowExecutions', {
      workflowId: args.workflowId,
      walletAddress: args.walletAddress,
      status: 'pending',
      currentStep: '',
      variables: args.variables,
      startedAt: Date.now(),
    });

    return await ctx.db.get(executionId);
  },
});

// Update execution status
export const updateExecution = mutation({
  args: {
    id: v.id('workflowExecutions'),
    walletAddress: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('running'),
      v.literal('waiting_approval'),
      v.literal('completed'),
      v.literal('failed'),
      v.literal('cancelled')
    ),
    currentStep: v.optional(v.string()),
    variables: v.optional(v.any()),
    error: v.optional(
      v.object({
        stepId: v.string(),
        code: v.string(),
        message: v.string(),
        details: v.optional(v.any()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const execution = await ctx.db.get(args.id);
    if (!execution || execution.walletAddress !== args.walletAddress) {
      throw new Error('Execution not found or access denied');
    }

    const updates: any = { status: args.status };

    if (args.currentStep !== undefined) updates.currentStep = args.currentStep;
    if (args.variables !== undefined) updates.variables = args.variables;
    if (args.error !== undefined) updates.error = args.error;

    if (['completed', 'failed', 'cancelled'].includes(args.status)) {
      updates.completedAt = Date.now();
    }

    await ctx.db.patch(args.id, updates);
    return await ctx.db.get(args.id);
  },
});

// Get execution by ID
export const getExecutionById = query({
  args: { id: v.id('workflowExecutions') },
  handler: async (ctx, args) => {
    const execution = await ctx.db.get(args.id);
    if (!execution) return null;

    // Get associated workflow
    const workflow = await ctx.db.get(execution.workflowId);

    // Get step results
    const stepResults = await ctx.db
      .query('workflowStepResults')
      .withIndex('by_execution', (q) => q.eq('executionId', args.id))
      .collect();

    return {
      ...execution,
      workflow,
      stepResults,
    };
  },
});

// Get executions by workflow
export const getExecutionsByWorkflow = query({
  args: {
    workflowId: v.id('workflows'),
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);

    let query = ctx.db
      .query('workflowExecutions')
      .withIndex('by_workflow', (q) => q.eq('workflowId', args.workflowId));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field('status'), args.status));
    }

    return await query.order('desc').take(limit);
  },
});

// =============================================================================
// Workflow Step Results
// =============================================================================

// Add or update step result
export const updateStepResult = mutation({
  args: {
    executionId: v.id('workflowExecutions'),
    stepId: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('running'),
      v.literal('completed'),
      v.literal('failed'),
      v.literal('waiting_approval')
    ),
    output: v.optional(v.any()),
    error: v.optional(v.string()),
    retryCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if step result already exists
    const existing = await ctx.db
      .query('workflowStepResults')
      .withIndex('by_execution', (q) => q.eq('executionId', args.executionId))
      .filter((q) => q.eq(q.field('stepId'), args.stepId))
      .unique();

    const now = Date.now();

    if (existing) {
      // Update existing step result
      const updates: any = { status: args.status };

      if (args.output !== undefined) updates.output = args.output;
      if (args.error !== undefined) updates.error = args.error;
      if (args.retryCount !== undefined) updates.retryCount = args.retryCount;

      if (['completed', 'failed'].includes(args.status)) {
        updates.completedAt = now;
      }

      await ctx.db.patch(existing._id, updates);
      return await ctx.db.get(existing._id);
    }
    // Create new step result
    const stepResultId = await ctx.db.insert('workflowStepResults', {
      executionId: args.executionId,
      stepId: args.stepId,
      status: args.status,
      output: args.output,
      error: args.error,
      retryCount: args.retryCount || 0,
      startedAt: now,
      completedAt: ['completed', 'failed'].includes(args.status)
        ? now
        : undefined,
    });

    return await ctx.db.get(stepResultId);
  },
});

// =============================================================================
// Analytics and Statistics
// =============================================================================

// Get workflow statistics
export const getWorkflowStats = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const workflows = await ctx.db
      .query('workflows')
      .withIndex('by_owner', (q) => q.eq('walletAddress', args.walletAddress))
      .collect();

    const activeWorkflows = workflows.filter((workflow) => workflow.isActive);

    // Get execution counts
    const allExecutions = await Promise.all(
      workflows.map((workflow) =>
        ctx.db
          .query('workflowExecutions')
          .withIndex('by_workflow', (q) => q.eq('workflowId', workflow._id))
          .collect()
      )
    );

    const executions = allExecutions.flat();
    const completedExecutions = executions.filter(
      (exec) => exec.status === 'completed'
    );
    const failedExecutions = executions.filter(
      (exec) => exec.status === 'failed'
    );
    const runningExecutions = executions.filter((exec) =>
      ['pending', 'running', 'waiting_approval'].includes(exec.status)
    );

    return {
      totalWorkflows: workflows.length,
      activeWorkflows: activeWorkflows.length,
      totalExecutions: executions.length,
      runningExecutions: runningExecutions.length,
      completedExecutions: completedExecutions.length,
      failedExecutions: failedExecutions.length,
      successRate:
        executions.length > 0
          ? completedExecutions.length / executions.length
          : 0,
      averageExecutionTime:
        completedExecutions.length > 0
          ? completedExecutions
              .filter((exec) => exec.completedAt && exec.startedAt)
              .reduce(
                (sum, exec) => sum + (exec.completedAt! - exec.startedAt),
                0
              ) / completedExecutions.length
          : 0,
    };
  },
});

// Get recent workflow activity
export const getRecentActivity = query({
  args: {
    walletAddress: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 50);

    // Get user's workflow executions
    const executions = await ctx.db
      .query('workflowExecutions')
      .withIndex('by_user', (q) => q.eq('walletAddress', args.walletAddress))
      .order('desc')
      .take(limit);

    // Add workflow info to each execution
    const executionsWithWorkflows = await Promise.all(
      executions.map(async (execution) => {
        const workflow = await ctx.db.get(execution.workflowId);
        return {
          ...execution,
          workflowName: workflow?.name || 'Unknown Workflow',
        };
      })
    );

    return executionsWithWorkflows;
  },
});
