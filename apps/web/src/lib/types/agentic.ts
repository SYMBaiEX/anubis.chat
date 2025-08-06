/**
 * Agentic AI Types and Interfaces
 * Comprehensive type definitions for multi-step AI agents, workflows, and tool calling
 */

import type { CoreTool } from 'ai';
import type { z } from 'zod';

// =============================================================================
// Core Agent Types
// =============================================================================

export interface Agent {
  id: string;
  name: string;
  description?: string;
  model: string;
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
  tools?: AgentTool[];
  maxSteps?: number;
  walletAddress: string;
  createdAt: number;
  updatedAt: number;
}

export interface AgentExecution {
  id: string;
  agentId: string;
  walletAddress: string;
  status: AgentExecutionStatus;
  input: string;
  steps: AgentStep[];
  result?: AgentResult;
  error?: string;
  startedAt: number;
  completedAt?: number;
  metadata?: Record<string, unknown>;
}

export type AgentExecutionStatus = 
  | 'pending'
  | 'running' 
  | 'waiting_approval'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface AgentStep {
  id: string;
  type: AgentStepType;
  status: AgentStepStatus;
  input?: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  output?: string;
  reasoning?: string;
  startedAt: number;
  completedAt?: number;
  error?: string;
}

export type AgentStepType = 
  | 'reasoning'
  | 'tool_call'
  | 'parallel_tools'
  | 'human_approval'
  | 'workflow_step';

export type AgentStepStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'waiting_approval';

export interface AgentResult {
  success: boolean;
  output: string;
  finalStep: number;
  totalSteps: number;
  toolsUsed: string[];
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  executionTime: number;
}

// =============================================================================
// Tool System Types
// =============================================================================

export interface AgentTool {
  name: string;
  description: string;
  parameters: z.ZodSchema;
  execute: (params: any, context: AgentContext) => Promise<ToolResult>;
  requiresApproval?: boolean;
  category?: ToolCategory;
  metadata?: Record<string, unknown>;
}

export type ToolCategory = 
  | 'data_retrieval'
  | 'computation'
  | 'communication'
  | 'file_system'
  | 'web_api'
  | 'blockchain'
  | 'custom';

export interface ToolCall {
  id: string;
  name: string;
  parameters: Record<string, unknown>;
  requiresApproval: boolean;
}

export interface ToolResult {
  id: string;
  success: boolean;
  result: any;
  error?: string;
  executionTime: number;
  metadata?: Record<string, unknown>;
}

export interface AgentContext {
  executionId: string;
  agentId: string;
  walletAddress: string;
  stepNumber: number;
  previousSteps: AgentStep[];
  metadata: Record<string, unknown>;
}

// =============================================================================
// Workflow Types
// =============================================================================

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  triggers?: WorkflowTrigger[];
  walletAddress: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: WorkflowStepType;
  agentId?: string;
  condition?: string;
  parameters?: Record<string, unknown>;
  nextSteps?: string[];
  requiresApproval?: boolean;
}

export type WorkflowStepType = 
  | 'agent_task'
  | 'condition'
  | 'parallel'
  | 'sequential'
  | 'human_approval'
  | 'delay'
  | 'webhook';

export interface WorkflowTrigger {
  id: string;
  type: WorkflowTriggerType;
  condition: string;
  parameters?: Record<string, unknown>;
}

export type WorkflowTriggerType = 
  | 'manual'
  | 'schedule'
  | 'webhook'
  | 'completion'
  | 'condition';

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  walletAddress: string;
  status: AgentExecutionStatus;
  currentStep: string;
  stepResults: Record<string, any>;
  startedAt: number;
  completedAt?: number;
  error?: string;
}

// =============================================================================
// Human-in-the-Loop Types
// =============================================================================

export interface ApprovalRequest {
  id: string;
  executionId: string;
  stepId: string;
  walletAddress: string;
  type: ApprovalType;
  message: string;
  data: Record<string, unknown>;
  status: ApprovalStatus;
  createdAt: number;
  respondedAt?: number;
  response?: ApprovalResponse;
}

export type ApprovalType = 
  | 'tool_execution'
  | 'workflow_step'
  | 'sensitive_action'
  | 'resource_usage'
  | 'custom';

export type ApprovalStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'expired';

export interface ApprovalResponse {
  approved: boolean;
  message?: string;
  modifications?: Record<string, unknown>;
}

// =============================================================================
// Request/Response Types
// =============================================================================

export interface CreateAgentRequest {
  name: string;
  description?: string;
  model: string;
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
  maxSteps?: number;
  tools?: string[]; // Tool names to enable
}

export interface ExecuteAgentRequest {
  agentId: string;
  input: string;
  maxSteps?: number;
  autoApprove?: boolean;
  metadata?: Record<string, unknown>;
}

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  steps: Omit<WorkflowStep, 'id'>[];
  triggers?: Omit<WorkflowTrigger, 'id'>[];
}

export interface ExecuteWorkflowRequest {
  workflowId: string;
  input?: Record<string, unknown>;
  autoApprove?: boolean;
}

// =============================================================================
// Configuration Types
// =============================================================================

export interface AgenticConfig {
  maxStepsPerExecution: number;
  defaultModel: string;
  defaultTemperature: number;
  defaultMaxTokens: number;
  toolTimeout: number;
  approvalTimeout: number;
  enableParallelExecution: boolean;
  maxParallelTools: number;
  enableHumanApproval: boolean;
  requiredApprovalTools: string[];
}

// =============================================================================
// Event Types
// =============================================================================

export interface AgentEvent {
  id: string;
  type: AgentEventType;
  executionId: string;
  agentId: string;
  walletAddress: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export type AgentEventType = 
  | 'execution_started'
  | 'step_completed'
  | 'tool_called'
  | 'approval_requested'
  | 'execution_completed'
  | 'execution_failed'
  | 'execution_cancelled';

// =============================================================================
// Utility Types
// =============================================================================

export interface PaginatedAgentsResponse {
  agents: Agent[];
  pagination: {
    cursor?: string;
    nextCursor?: string;
    hasMore: boolean;
    limit: number;
  };
}

export interface PaginatedExecutionsResponse {
  executions: AgentExecution[];
  pagination: {
    cursor?: string;
    nextCursor?: string;
    hasMore: boolean;
    limit: number;
  };
}

// =============================================================================
// MCP Integration Types
// =============================================================================

export interface MCPTool extends AgentTool {
  mcpServerId: string;
  mcpToolName: string;
}

export interface MCPServerConfig {
  id: string;
  name: string;
  url: string;
  apiKey?: string;
  enabled: boolean;
  tools: string[];
}

export interface MCPClientConfig {
  servers: MCPServerConfig[];
  enableAutoDiscovery: boolean;
  timeout: number;
}