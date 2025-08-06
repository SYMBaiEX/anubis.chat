/**
 * Convex Functions for Agentic AI System
 * Complete CRUD operations for agents, executions, and steps
 */

import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import { mutation, query } from './_generated/server';

// =============================================================================
// Agent Management
// =============================================================================

// Get agent by ID
export const getById = query({
  args: { id: v.id('agents') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get agents by owner
export const getByOwner = query({
  args: {
    walletAddress: v.string(),
    limit: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);

    let query = ctx.db
      .query('agents')
      .withIndex('by_owner', (q) => q.eq('walletAddress', args.walletAddress));

    if (args.isActive !== undefined) {
      query = query.filter((q) => q.eq(q.field('isActive'), args.isActive));
    }

    return await query.order('desc').take(limit);
  },
});

// Create new agent
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    model: v.string(),
    systemPrompt: v.string(),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
    tools: v.optional(v.array(v.string())),
    maxSteps: v.optional(v.number()),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const agentId = await ctx.db.insert('agents', {
      name: args.name,
      description: args.description,
      model: args.model,
      systemPrompt: args.systemPrompt,
      temperature: args.temperature,
      maxTokens: args.maxTokens,
      tools: args.tools,
      maxSteps: args.maxSteps,
      walletAddress: args.walletAddress,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(agentId);
  },
});

// Update agent
export const update = mutation({
  args: {
    id: v.id('agents'),
    walletAddress: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    model: v.optional(v.string()),
    systemPrompt: v.optional(v.string()),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
    tools: v.optional(v.array(v.string())),
    maxSteps: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.id);

    if (!agent || agent.walletAddress !== args.walletAddress) {
      throw new Error('Agent not found or access denied');
    }

    const updates: any = { updatedAt: Date.now() };

    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.model !== undefined) updates.model = args.model;
    if (args.systemPrompt !== undefined)
      updates.systemPrompt = args.systemPrompt;
    if (args.temperature !== undefined) updates.temperature = args.temperature;
    if (args.maxTokens !== undefined) updates.maxTokens = args.maxTokens;
    if (args.tools !== undefined) updates.tools = args.tools;
    if (args.maxSteps !== undefined) updates.maxSteps = args.maxSteps;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    await ctx.db.patch(args.id, updates);
    return await ctx.db.get(args.id);
  },
});

// Delete agent
export const remove = mutation({
  args: {
    id: v.id('agents'),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.id);

    if (!agent || agent.walletAddress !== args.walletAddress) {
      throw new Error('Agent not found or access denied');
    }

    // Check if agent has active executions
    const activeExecutions = await ctx.db
      .query('agentExecutions')
      .withIndex('by_agent', (q) => q.eq('agentId', args.id))
      .filter((q) =>
        q.or(
          q.eq(q.field('status'), 'pending'),
          q.eq(q.field('status'), 'running'),
          q.eq(q.field('status'), 'waiting_approval')
        )
      )
      .collect();

    if (activeExecutions.length > 0) {
      throw new Error('Cannot delete agent with active executions');
    }

    await ctx.db.delete(args.id);
    return { success: true, agentId: args.id };
  },
});

// =============================================================================
// Agent Executions
// =============================================================================

// Create agent execution
export const createExecution = mutation({
  args: {
    agentId: v.id('agents'),
    walletAddress: v.string(),
    input: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Verify agent exists and user has access
    const agent = await ctx.db.get(args.agentId);
    if (!agent || agent.walletAddress !== args.walletAddress) {
      throw new Error('Agent not found or access denied');
    }

    const executionId = await ctx.db.insert('agentExecutions', {
      agentId: args.agentId,
      walletAddress: args.walletAddress,
      status: 'pending',
      input: args.input,
      startedAt: Date.now(),
      metadata: args.metadata,
    });

    return await ctx.db.get(executionId);
  },
});

// Update execution status and result
export const updateExecution = mutation({
  args: {
    id: v.id('agentExecutions'),
    walletAddress: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('running'),
      v.literal('waiting_approval'),
      v.literal('completed'),
      v.literal('failed'),
      v.literal('cancelled')
    ),
    result: v.optional(
      v.object({
        success: v.boolean(),
        output: v.string(),
        finalStep: v.number(),
        totalSteps: v.number(),
        toolsUsed: v.array(v.string()),
        tokensUsed: v.object({
          input: v.number(),
          output: v.number(),
          total: v.number(),
        }),
        executionTime: v.number(),
      })
    ),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const execution = await ctx.db.get(args.id);
    if (!execution || execution.walletAddress !== args.walletAddress) {
      throw new Error('Execution not found or access denied');
    }

    const updates: any = { status: args.status };

    if (args.result !== undefined) updates.result = args.result;
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
  args: { id: v.id('agentExecutions') },
  handler: async (ctx, args) => {
    const execution = await ctx.db.get(args.id);
    if (!execution) return null;

    // Get associated agent
    const agent = await ctx.db.get(execution.agentId);

    // Get execution steps
    const steps = await ctx.db
      .query('agentSteps')
      .withIndex('by_execution', (q) => q.eq('executionId', args.id))
      .order('asc')
      .collect();

    return {
      ...execution,
      agent,
      steps,
    };
  },
});

// Get executions by agent
export const getExecutionsByAgent = query({
  args: {
    agentId: v.id('agents'),
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);

    let query = ctx.db
      .query('agentExecutions')
      .withIndex('by_agent', (q) => q.eq('agentId', args.agentId));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field('status'), args.status));
    }

    return await query.order('desc').take(limit);
  },
});

// Get user's executions
export const getUserExecutions = query({
  args: {
    walletAddress: v.string(),
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);

    let query = ctx.db
      .query('agentExecutions')
      .withIndex('by_user', (q) => q.eq('walletAddress', args.walletAddress));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field('status'), args.status));
    }

    const executions = await query.order('desc').take(limit);

    // Add agent info to each execution
    const executionsWithAgents = await Promise.all(
      executions.map(async (execution) => {
        const agent = await ctx.db.get(execution.agentId);
        return {
          ...execution,
          agentName: agent?.name || 'Unknown Agent',
          agentModel: agent?.model || 'unknown',
        };
      })
    );

    return executionsWithAgents;
  },
});

// =============================================================================
// Agent Steps
// =============================================================================

// Add step to execution
export const addStep = mutation({
  args: {
    executionId: v.id('agentExecutions'),
    stepNumber: v.number(),
    type: v.union(
      v.literal('reasoning'),
      v.literal('tool_call'),
      v.literal('parallel_tools'),
      v.literal('human_approval'),
      v.literal('workflow_step')
    ),
    input: v.optional(v.string()),
    toolCalls: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          parameters: v.any(),
          requiresApproval: v.boolean(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const stepId = await ctx.db.insert('agentSteps', {
      executionId: args.executionId,
      stepNumber: args.stepNumber,
      type: args.type,
      status: 'pending',
      input: args.input,
      toolCalls: args.toolCalls,
      startedAt: Date.now(),
    });

    return await ctx.db.get(stepId);
  },
});

// Update step status and results
export const updateStep = mutation({
  args: {
    id: v.id('agentSteps'),
    status: v.union(
      v.literal('pending'),
      v.literal('running'),
      v.literal('completed'),
      v.literal('failed'),
      v.literal('waiting_approval')
    ),
    output: v.optional(v.string()),
    reasoning: v.optional(v.string()),
    toolResults: v.optional(
      v.array(
        v.object({
          id: v.string(),
          success: v.boolean(),
          result: v.any(),
          error: v.optional(
            v.object({
              code: v.string(),
              message: v.string(),
              details: v.optional(v.any()),
              retryable: v.optional(v.boolean()),
            })
          ),
          executionTime: v.number(),
          metadata: v.optional(v.any()),
        })
      )
    ),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: any = { status: args.status };

    if (args.output !== undefined) updates.output = args.output;
    if (args.reasoning !== undefined) updates.reasoning = args.reasoning;
    if (args.toolResults !== undefined) updates.toolResults = args.toolResults;
    if (args.error !== undefined) updates.error = args.error;

    if (['completed', 'failed'].includes(args.status)) {
      updates.completedAt = Date.now();
    }

    await ctx.db.patch(args.id, updates);
    return await ctx.db.get(args.id);
  },
});

// Get agent statistics
export const getAgentStats = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const agents = await ctx.db
      .query('agents')
      .withIndex('by_owner', (q) => q.eq('walletAddress', args.walletAddress))
      .collect();

    const activeAgents = agents.filter((agent) => agent.isActive);

    // Get execution counts
    const allExecutions = await Promise.all(
      agents.map((agent) =>
        ctx.db
          .query('agentExecutions')
          .withIndex('by_agent', (q) => q.eq('agentId', agent._id))
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

    const modelUsage = new Map<string, number>();
    agents.forEach((agent) => {
      modelUsage.set(agent.model, (modelUsage.get(agent.model) || 0) + 1);
    });

    return {
      totalAgents: agents.length,
      activeAgents: activeAgents.length,
      totalExecutions: executions.length,
      completedExecutions: completedExecutions.length,
      failedExecutions: failedExecutions.length,
      successRate:
        executions.length > 0
          ? completedExecutions.length / executions.length
          : 0,
      modelUsage: Object.fromEntries(modelUsage),
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
