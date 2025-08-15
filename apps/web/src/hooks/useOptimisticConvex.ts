'use client';

import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import type { FunctionReference } from 'convex/server';
import { useCallback, useRef, useState } from 'react';

interface OptimisticUpdate<T> {
  id: string;
  timestamp: number;
  data: T;
  status: 'pending' | 'success' | 'error';
}

interface UseOptimisticConvexOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  timeout?: number;
}

export function useOptimisticConvex<T, Args extends Record<string, any>>(
  mutationRef: FunctionReference<'mutation', 'public', Args, T>,
  queryRef?: FunctionReference<'query', 'public', any, T[]>,
  options?: UseOptimisticConvexOptions<T>
) {
  const mutation = useMutation(mutationRef);
  const queryData = queryRef ? useQuery(queryRef) : undefined;

  const [optimisticUpdates, setOptimisticUpdates] = useState<
    OptimisticUpdate<T>[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Merge optimistic updates with real data
  const mergedData = useCallback(() => {
    if (!queryData) return optimisticUpdates.map((u) => u.data);

    const pendingUpdates = optimisticUpdates.filter(
      (u) => u.status === 'pending'
    );
    return [...queryData, ...pendingUpdates.map((u) => u.data)];
  }, [queryData, optimisticUpdates]);

  // Add optimistic update
  const addOptimisticUpdate = useCallback(
    (data: T) => {
      const updateId = crypto.randomUUID();
      const update: OptimisticUpdate<T> = {
        id: updateId,
        timestamp: Date.now(),
        data,
        status: 'pending',
      };

      setOptimisticUpdates((prev) => [...prev, update]);

      // Set timeout to remove if not resolved
      const timeout = setTimeout(() => {
        setOptimisticUpdates((prev) => prev.filter((u) => u.id !== updateId));
      }, options?.timeout || 10_000);

      timeoutRefs.current.set(updateId, timeout);

      return updateId;
    },
    [options?.timeout]
  );

  // Remove optimistic update
  const removeOptimisticUpdate = useCallback((updateId: string) => {
    const timeout = timeoutRefs.current.get(updateId);
    if (timeout) {
      clearTimeout(timeout);
      timeoutRefs.current.delete(updateId);
    }

    setOptimisticUpdates((prev) => prev.filter((u) => u.id !== updateId));
  }, []);

  // Mark update as successful
  const markUpdateSuccess = useCallback(
    (updateId: string) => {
      setOptimisticUpdates((prev) =>
        prev.map((u) => (u.id === updateId ? { ...u, status: 'success' } : u))
      );

      // Remove after a delay to allow for smooth transition
      setTimeout(() => {
        removeOptimisticUpdate(updateId);
      }, 500);
    },
    [removeOptimisticUpdate]
  );

  // Mark update as failed
  const markUpdateError = useCallback(
    (updateId: string) => {
      setOptimisticUpdates((prev) =>
        prev.map((u) => (u.id === updateId ? { ...u, status: 'error' } : u))
      );

      // Remove after showing error state
      setTimeout(() => {
        removeOptimisticUpdate(updateId);
      }, 2000);
    },
    [removeOptimisticUpdate]
  );

  // Execute mutation with optimistic update
  const executeMutation = useCallback(
    async (args: Args, optimisticData: T) => {
      setIsLoading(true);
      const updateId = addOptimisticUpdate(optimisticData);

      try {
        const result = await mutation(args);
        markUpdateSuccess(updateId);
        options?.onSuccess?.(result);
        return result;
      } catch (error) {
        markUpdateError(updateId);
        options?.onError?.(error as Error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [mutation, addOptimisticUpdate, markUpdateSuccess, markUpdateError, options]
  );

  return {
    data: mergedData(),
    mutate: executeMutation,
    isLoading,
    optimisticUpdates,
  };
}

// Specialized hook for messages
export function useOptimisticMessages(chatId: Id<'chats'>) {
  const sendMessage = useMutation(api.messages.create);
  const messages = useQuery(
    api.messages.getByChatId,
    chatId ? { chatId, limit: 100 } : 'skip'
  );

  const [optimisticMessages, setOptimisticMessages] = useState<any[]>([]);

  const sendOptimisticMessage = useCallback(
    async (content: string) => {
      // Create optimistic message
      const optimisticMessage = {
        _id: `optimistic-${Date.now()}`,
        content,
        chatId,
        userId: 'current-user', // Get from session
        timestamp: Date.now(),
        status: 'sending',
      };

      // Add to optimistic state
      setOptimisticMessages((prev) => [...prev, optimisticMessage]);

      try {
        // Send actual message
        const result = await sendMessage({
          chatId,
          content,
          role: 'user' as const,
          walletAddress: 'temp-wallet', // TODO: Get from auth context
        });

        // Remove optimistic message on success
        setOptimisticMessages((prev) =>
          prev.filter((m) => m._id !== optimisticMessage._id)
        );

        return result;
      } catch (error) {
        // Mark as failed
        setOptimisticMessages((prev) =>
          prev.map((m) =>
            m._id === optimisticMessage._id ? { ...m, status: 'error' } : m
          )
        );

        throw error;
      }
    },
    [chatId, sendMessage]
  );

  // Merge real and optimistic messages
  const allMessages = [...(messages || []), ...optimisticMessages].sort(
    (a, b) => a.timestamp - b.timestamp
  );

  return {
    messages: allMessages,
    sendMessage: sendOptimisticMessage,
    optimisticMessages,
  };
}

// Specialized hook for chats
export function useOptimisticChats() {
  const createChat = useMutation(api.chats.create);
  const updateChat = useMutation(api.chats.update);
  const deleteChat = useMutation(api.chats.remove);
  const chats = useQuery(api.chats.getByOwner, { ownerId: 'current-user' }); // TODO: Get actual user ID

  const [optimisticChats, setOptimisticChats] = useState<Array<{
    _id: string;
    title: string;
    description?: string;
    createdAt: number;
    status: string;
  }>>([]);

  const createOptimisticChat = useCallback(
    async (name: string, description?: string) => {
      const optimisticChat = {
        _id: `optimistic-${Date.now()}`,
        title: name,
        description,
        createdAt: Date.now(),
        status: 'creating',
      };

      setOptimisticChats((prev) => [...prev, optimisticChat]);

      try {
        const result = await createChat({ title: name, ownerId: 'current-user', model: 'gpt-4o', description });

        setOptimisticChats((prev) =>
          prev.filter((c) => c._id !== optimisticChat._id)
        );

        return result;
      } catch (error) {
        setOptimisticChats((prev) =>
          prev.map((c) =>
            c._id === optimisticChat._id ? { ...c, status: 'error' } : c
          )
        );

        throw error;
      }
    },
    [createChat]
  );

  const updateOptimisticChat = useCallback(
    async (
      chatId: Id<'chats'>,
      updates: { name?: string; description?: string }
    ) => {
      // Store original state for rollback
      const originalChat = chats?.find((c) => c._id === chatId);

      // Apply optimistic update
      setOptimisticChats((prev) => [
        ...prev,
        { 
          _id: `optimistic-update-${chatId}`,
          title: updates.name || originalChat?.title || '',
          description: updates.description || originalChat?.description,
          createdAt: originalChat?.createdAt || Date.now(),
          status: 'updating' 
        },
      ]);

      try {
        const result = await updateChat({ id: chatId, ownerId: 'current-user', title: updates.name, ...updates });

        setOptimisticChats((prev) => prev.filter((c) => c._id !== chatId));

        return result;
      } catch (error) {
        // Rollback on error
        setOptimisticChats((prev) => prev.filter((c) => c._id !== chatId));

        throw error;
      }
    },
    [chats, updateChat]
  );

  const deleteOptimisticChat = useCallback(
    async (chatId: Id<'chats'>) => {
      // Mark as deleting
      setOptimisticChats((prev) => [
        ...prev,
        { _id: chatId, status: 'deleting' },
      ]);

      try {
        await deleteChat({ chatId });

        setOptimisticChats((prev) => prev.filter((c) => c._id !== chatId));
      } catch (error) {
        // Remove deletion marker on error
        setOptimisticChats((prev) => prev.filter((c) => c._id !== chatId));

        throw error;
      }
    },
    [deleteChat]
  );

  // Merge and filter chats
  const allChats = [
    ...(chats || []).filter(
      (c) =>
        !optimisticChats.find(
          (oc) => oc._id === c._id && oc.status === 'deleting'
        )
    ),
    ...optimisticChats.filter((c) => !c.status || c.status === 'creating'),
  ];

  return {
    chats: allChats,
    createChat: createOptimisticChat,
    updateChat: updateOptimisticChat,
    deleteChat: deleteOptimisticChat,
    optimisticChats,
  };
}
