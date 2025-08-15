/**
 * Modern 2025 Chat hooks using direct Convex patterns
 * Clean, performant hooks following Convex best practices
 */

import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { useAction, useMutation, useQuery } from 'convex/react';
import { useCallback } from 'react';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('hooks/convex/useChats');

// =============================================================================
// Chat Queries - Direct useQuery pattern
// =============================================================================

/**
 * Get chats by owner with real-time updates
 * Modern pattern: direct useQuery for optimal performance
 */
export function useChats(
  ownerId: string,
  options?: {
    limit?: number;
    isActive?: boolean;
  }
) {
  return useQuery(
    api.chats.getByOwner,
    ownerId
      ? {
          ownerId,
          limit: options?.limit,
          isActive: options?.isActive,
        }
      : 'skip'
  );
}

/**
 * Get specific chat by ID with real-time updates
 */
export function useChat(id: Id<'chats'> | undefined) {
  return useQuery(api.chats.getById, id ? { id } : 'skip');
}

/**
 * Get chat statistics for owner
 */
export function useChatStats(ownerId: string | undefined) {
  return useQuery(api.chats.getStats, ownerId ? { ownerId } : 'skip');
}

// =============================================================================
// Chat Mutations - Direct useMutation pattern
// =============================================================================

/**
 * Create new chat
 * Returns mutation function directly - cleanest pattern
 */
export function useCreateChat() {
  return useMutation(api.chats.create);
}

/**
 * Update existing chat
 */
export function useUpdateChat() {
  return useMutation(api.chats.update);
}

/**
 * Delete chat permanently
 */
export function useDeleteChat() {
  return useMutation(api.chats.remove);
}

/**
 * Archive chat (soft delete)
 */
export function useArchiveChat() {
  return useMutation(api.chats.archive);
}

/**
 * Restore archived chat
 */
export function useRestoreChat() {
  return useMutation(api.chats.restore);
}

/**
 * Update last message timestamp
 */
export function useUpdateLastMessageTime() {
  return useMutation(api.chats.updateLastMessageTime);
}

/**
 * Toggle pin status
 */
export function useTogglePin() {
  return useMutation(api.chats.togglePin);
}

/**
 * Clear chat history
 */
export function useClearHistory() {
  return useMutation(api.chats.clearHistory);
}

/**
 * Update token usage
 */
export function useUpdateTokenUsage() {
  return useMutation(api.chats.updateTokenUsage);
}

/**
 * Get token usage for chat
 */
export function useTokenUsage(chatId: Id<'chats'> | undefined) {
  return useQuery(api.chats.getTokenUsage, chatId ? { chatId } : 'skip');
}

// =============================================================================
// Composite Chat Operations - Higher-order patterns
// =============================================================================

/**
 * Chat creation with automatic title generation
 * Combines chat creation with title generation workflow
 */
export function useChatCreation() {
  const createChat = useCreateChat();
  const generateTitle = useAction(api.chats.generateAndUpdateTitle);

  const createChatWithAutoTitle = useCallback(
    async (chatData: {
      title: string;
      ownerId: string;
      model: string;
      systemPrompt?: string;
      agentPrompt?: string;
      agentId?: Id<'agents'>;
      temperature?: number;
      maxTokens?: number;
      initialMessage?: string;
    }) => {
      log.info('Creating chat with auto-title', { title: chatData.title });

      // Create the chat
      const chat = await createChat({
        title: chatData.title,
        ownerId: chatData.ownerId,
        model: chatData.model,
        systemPrompt: chatData.systemPrompt,
        agentPrompt: chatData.agentPrompt,
        agentId: chatData.agentId,
        temperature: chatData.temperature,
        maxTokens: chatData.maxTokens,
      });

      if (!chat) {
        throw new Error('Failed to create chat');
      }

      return {
        chat,
        initialMessage: chatData.initialMessage,
      };
    },
    [createChat]
  );

  return {
    createChat,
    createChatWithAutoTitle,
    generateTitle,
  };
}

/**
 * Chat management hook
 * Combines common chat operations
 */
export function useChatManagement(ownerId: string) {
  const chats = useChats(ownerId, { isActive: true });
  const archivedChats = useChats(ownerId, { isActive: false });
  const stats = useChatStats(ownerId);

  const updateChat = useUpdateChat();
  const deleteChat = useDeleteChat();
  const archiveChat = useArchiveChat();
  const restoreChat = useRestoreChat();
  const togglePin = useTogglePin();

  const bulkArchive = useCallback(
    async (chatIds: Id<'chats'>[]) => {
      const results = [];
      for (const chatId of chatIds) {
        try {
          const result = await archiveChat({ id: chatId, ownerId });
          results.push(result);
        } catch (error) {
          log.error('Failed to archive chat', { chatId, error });
          throw error;
        }
      }
      return results;
    },
    [archiveChat, ownerId]
  );

  const bulkDelete = useCallback(
    async (chatIds: Id<'chats'>[]) => {
      const results = [];
      for (const chatId of chatIds) {
        try {
          const result = await deleteChat({ id: chatId, ownerId });
          results.push(result);
        } catch (error) {
          log.error('Failed to delete chat', { chatId, error });
          throw error;
        }
      }
      return results;
    },
    [deleteChat, ownerId]
  );

  return {
    // Data
    activeChats: chats || [],
    archivedChats: archivedChats || [],
    stats: stats || {},

    // Loading states
    isLoading: chats === undefined || archivedChats === undefined,

    // Single operations
    updateChat,
    deleteChat,
    archiveChat,
    restoreChat,
    togglePin,

    // Bulk operations
    bulkArchive,
    bulkDelete,

    // Computed
    hasActiveChats: (chats?.length || 0) > 0,
    hasArchivedChats: (archivedChats?.length || 0) > 0,
    totalChats: (chats?.length || 0) + (archivedChats?.length || 0),
  };
}

/**
 * Chat state management with active selection
 * Manages current chat selection and state
 */
export function useChatState(ownerId: string, selectedChatId?: string) {
  const chats = useChats(ownerId, { isActive: true });
  const currentChat = useChat(selectedChatId as Id<'chats'>);

  const selectedChat = currentChat;
  const hasChatSelected = !!selectedChatId && !!selectedChat;

  return {
    chats: chats || [],
    selectedChat,
    hasChatSelected,
    isLoading:
      chats === undefined || (selectedChatId && currentChat === undefined),
    isEmpty: (chats?.length || 0) === 0,
  };
}
