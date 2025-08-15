/**
 * Modern 2025 Convex hooks following absolute best practices
 * Direct useQuery and useMutation patterns for clean, performant code
 */

import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { useAction, useMutation, useQuery } from 'convex/react';

// =============================================================================
// Agents Hooks - 2025 Best Practice Pattern
// =============================================================================

/**
 * Get all available agents
 * Uses direct useQuery for optimal performance and simplicity
 */
export function useAgents() {
  return useQuery(api.agents.list, { includePublic: true });
}

/**
 * Get agent by ID
 */
export function useAgent(id: Id<'agents'> | undefined) {
  return useQuery(api.agents.getById, id ? { id } : 'skip');
}

/**
 * Create new agent
 * Returns mutation function directly - cleanest pattern
 */
export function useCreateAgent() {
  return useMutation(api.agents.create);
}

/**
 * Update existing agent
 */
export function useUpdateAgent() {
  return useMutation(api.agents.update);
}

/**
 * Delete agent
 */
export function useDeleteAgent() {
  return useMutation(api.agents.remove);
}

// =============================================================================
// User Preferences Hooks - Modern Pattern
// =============================================================================

/**
 * Get user preferences for authenticated user
 * Uses authenticated query pattern
 */
export function useUserPreferences() {
  return useQuery(api.userPreferences.getUserPreferences);
}

/**
 * Update user preferences
 * Direct mutation for clean code
 */
export function useUpdateUserPreferences() {
  return useMutation(api.userPreferences.updateUserPreferences);
}

/**
 * Reset user preferences to defaults
 */
export function useResetUserPreferences() {
  return useMutation(api.userPreferences.resetUserPreferences);
}

// =============================================================================
// Title Generation Hook - Action Pattern
// =============================================================================

/**
 * Generate and update chat title based on conversation
 * Uses action pattern for LLM integration
 */
export function useGenerateTitle() {
  return useAction(api.chats.generateAndUpdateTitle);
}

// =============================================================================
// Composite Hooks - Higher-order patterns for common workflows
// =============================================================================

/**
 * Theme management hook
 * Combines preferences query with update mutation
 */
export function useTheme() {
  const preferences = useUserPreferences();
  const updatePreferences = useUpdateUserPreferences();

  const updateTheme = async (theme: 'light' | 'dark' | 'system') => {
    await updatePreferences({ theme });
  };

  return {
    theme: preferences?.theme || 'system',
    updateTheme,
    isLoading: preferences === undefined,
  };
}

/**
 * Model preferences hook
 * Manages default model selection
 */
export function useModelPreferences() {
  const preferences = useUserPreferences();
  const updatePreferences = useUpdateUserPreferences();

  const updateDefaultModel = async (model: string) => {
    await updatePreferences({ defaultModel: model });
  };

  return {
    defaultModel: preferences?.defaultModel || 'gpt-4o',
    updateDefaultModel,
    isLoading: preferences === undefined,
  };
}

/**
 * Agent management hook
 * Combines agents query with creation/selection
 */
export function useAgentManagement() {
  const agents = useAgents();
  const createAgent = useCreateAgent();
  const updateAgent = useUpdateAgent();
  const deleteAgent = useDeleteAgent();
  const updatePreferences = useUpdateUserPreferences();

  const createAndSetDefault = async (agentData: {
    name: string;
    type:
      | 'general'
      | 'trading'
      | 'defi'
      | 'nft'
      | 'dao'
      | 'portfolio'
      | 'custom';
    description: string;
    systemPrompt: string;
    capabilities: string[];
    temperature?: number;
    maxTokens?: number;
    createdBy: string;
  }) => {
    const newAgent = await createAgent(agentData);
    return newAgent;
  };

  return {
    agents: agents || [],
    createAgent,
    updateAgent,
    deleteAgent,
    createAndSetDefault,
    isLoading: agents === undefined,
  };
}

/**
 * Auto title generation hook
 * Handles conditional title generation logic
 */
export function useAutoTitle() {
  const generateTitle = useGenerateTitle();

  const autoGenerateTitle = async (
    chatId: Id<'chats'>,
    ownerId: string,
    messageCount: number
  ) => {
    // Only auto-generate after the first user message
    if (messageCount === 1) {
      return await generateTitle({ chatId, ownerId });
    }
    return null;
  };

  return { autoGenerateTitle };
}

// =============================================================================
// Settings Management - Complete preferences workflow
// =============================================================================

/**
 * Complete settings management hook
 * Handles all user preferences in one place
 */
export function useSettings() {
  const preferences = useUserPreferences();
  const updatePreferences = useUpdateUserPreferences();
  const resetPreferences = useResetUserPreferences();

  const updateSetting = async <T extends keyof NonNullable<typeof preferences>>(
    key: T,
    value: NonNullable<typeof preferences>[T]
  ) => {
    await updatePreferences({ [key]: value });
  };

  const bulkUpdate = async (
    updates: Partial<NonNullable<typeof preferences>>
  ) => {
    await updatePreferences(updates);
  };

  return {
    preferences: preferences || {},
    updateSetting,
    bulkUpdate,
    resetPreferences,
    isLoading: preferences === undefined,
  };
}

// =============================================================================
// Export all for easy importing
// =============================================================================

export {
  // Direct re-exports of Convex hooks for consistency
  useQuery,
  useMutation,
};
