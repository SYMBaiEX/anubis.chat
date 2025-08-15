import {
  type UseMutationOptions,
  type UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { ApiResponse } from '@/lib/api/apiClient';
import { apiClient } from '@/lib/api/apiClient';

/**
 * Custom hook for GET requests with React Query
 */
export function useApiQuery<T = any>(
  key: string | string[],
  path: string,
  options?: Omit<UseQueryOptions<ApiResponse<T>>, 'queryKey' | 'queryFn'>
) {
  const queryKey = Array.isArray(key) ? key : [key];

  return useQuery<ApiResponse<T>>({
    queryKey,
    queryFn: () => apiClient.get<T>(path),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
    ...options,
  });
}

/**
 * Custom hook for POST mutations with React Query
 */
export function useApiMutation<TData = any, TVariables = any>(
  path: string,
  options?: UseMutationOptions<ApiResponse<TData>, Error, TVariables>
) {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<TData>, Error, TVariables>({
    mutationFn: (variables) => apiClient.post<TData>(path, variables),
    onSuccess: (data, variables, context) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [path] });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * Custom hook for PUT mutations
 */
export function useApiPutMutation<TData = any, TVariables = any>(
  path: string,
  options?: UseMutationOptions<ApiResponse<TData>, Error, TVariables>
) {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<TData>, Error, TVariables>({
    mutationFn: (variables) => apiClient.put<TData>(path, variables),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [path] });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * Custom hook for PATCH mutations
 */
export function useApiPatchMutation<TData = any, TVariables = any>(
  path: string,
  options?: UseMutationOptions<ApiResponse<TData>, Error, TVariables>
) {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<TData>, Error, TVariables>({
    mutationFn: (variables) => apiClient.patch<TData>(path, variables),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [path] });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * Custom hook for DELETE mutations
 */
export function useApiDeleteMutation<TData = any>(
  path: string,
  options?: UseMutationOptions<ApiResponse<TData>, Error, void>
) {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<TData>, Error, void>({
    mutationFn: () => apiClient.delete<TData>(path),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [path] });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * Hook for optimistic updates
 */
type MutationContext<TData> = {
  previousData?: ApiResponse<TData>;
};

export function useOptimisticMutation<TData = any, TVariables = any>(
  key: string | string[],
  path: string,
  options?: {
    optimisticUpdate?: (old: TData | undefined, variables: TVariables) => TData;
    onSuccess?: (data: ApiResponse<TData>) => void;
    onError?: (error: Error) => void;
  }
) {
  const queryClient = useQueryClient();
  const queryKey = Array.isArray(key) ? key : [key];

  return useMutation<
    ApiResponse<TData>,
    Error,
    TVariables,
    MutationContext<TData>
  >({
    mutationFn: (variables) => apiClient.post<TData>(path, variables),
    onMutate: async (variables) => {
      if (!options?.optimisticUpdate) return;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousData =
        queryClient.getQueryData<ApiResponse<TData>>(queryKey);

      // Optimistically update
      queryClient.setQueryData<ApiResponse<TData>>(queryKey, (old) => ({
        ...old,
        data: options.optimisticUpdate?.(old?.data, variables),
        ok: true,
        status: 200,
      }));

      // Return context with snapshot
      return { previousData };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      options?.onError?.(error);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey });
    },
    onSuccess: options?.onSuccess,
  });
}
