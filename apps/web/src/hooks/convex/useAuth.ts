/**
 * Authentication-related Convex hooks with Result pattern
 */

import { api } from '@convex/_generated/api';
import { useCallback } from 'react';
import type { Result } from '@/lib/utils/result';
import { failure, success } from '@/lib/utils/result';
import { useConvexMutation, useConvexQuery } from './useConvexResult';

// =============================================================================
// Auth Queries
// =============================================================================

/**
 * Check if token is blacklisted
 */
export function useTokenBlacklistCheck(tokenId: string) {
  return useConvexQuery(api.auth.isTokenBlacklisted, { tokenId });
}

/**
 * Get user's blacklisted tokens (admin)
 */
export function useUserBlacklistedTokens(userId: string) {
  return useConvexQuery(api.auth.getUserBlacklistedTokens, { userId });
}

/**
 * Get authentication system statistics
 */
export function useAuthStats() {
  return useConvexQuery(api.auth.getAuthStats);
}

// =============================================================================
// Auth Mutations
// =============================================================================

/**
 * Blacklist a JWT token
 */
export function useBlacklistToken() {
  return useConvexMutation(api.auth.blacklistToken);
}

/**
 * Store nonce for wallet authentication
 */
export function useStoreNonce() {
  return useConvexMutation(api.auth.storeNonce);
}

/**
 * Validate and remove nonce
 */
export function useValidateNonce() {
  return useConvexMutation(api.auth.validateAndRemoveNonce);
}

/**
 * Cleanup expired tokens
 */
export function useCleanupExpiredTokens() {
  return useConvexMutation(api.auth.cleanupExpiredTokens);
}

/**
 * Cleanup expired nonces
 */
export function useCleanupExpiredNonces() {
  return useConvexMutation(api.auth.cleanupExpiredNonces);
}

// =============================================================================
// Composite Auth Operations
// =============================================================================

/**
 * Complete nonce validation flow
 */
export function useNonceValidation() {
  const { mutate: storeNonce } = useStoreNonce();
  const { mutate: validateNonce } = useValidateNonce();

  return {
    storeNonce: useCallback(
      async (data: {
        publicKey: string;
        nonce: string;
        expiresAt: number;
      }): Promise<Result<any, Error>> => {
        return await storeNonce(data);
      },
      [storeNonce]
    ),

    validateNonce: useCallback(
      async (data: {
        publicKey: string;
        nonce: string;
      }): Promise<Result<boolean, Error>> => {
        return await validateNonce(data);
      },
      [validateNonce]
    ),
  };
}

/**
 * Token management operations
 */
export function useTokenManagement() {
  const { mutate: blacklistToken } = useBlacklistToken();
  const { mutate: cleanupExpiredTokens } = useCleanupExpiredTokens();

  return {
    blacklistToken: useCallback(
      async (data: {
        tokenId: string;
        userId: string;
        expiresAt: number;
      }): Promise<Result<any, Error>> => {
        return await blacklistToken(data);
      },
      [blacklistToken]
    ),

    cleanupExpiredTokens: useCallback(async (): Promise<
      Result<{ cleaned: number }, Error>
    > => {
      return await cleanupExpiredTokens();
    }, [cleanupExpiredTokens]),

    isTokenBlacklisted: useCallback(
      async (tokenId: string): Promise<boolean> => {
        // This would typically use useQuery, but for one-off checks:
        try {
          const result = await useTokenBlacklistCheck(tokenId);
          return result.data;
        } catch {
          return false;
        }
      },
      []
    ),
  };
}

/**
 * Complete authentication cleanup flow
 */
export function useAuthCleanup() {
  const { mutate: cleanupTokens } = useCleanupExpiredTokens();
  const { mutate: cleanupNonces } = useCleanupExpiredNonces();

  return useCallback(async (): Promise<
    Result<
      {
        tokensRemoved: number;
        noncesRemoved: number;
      },
      Error
    >
  > => {
    const tokensResult = await cleanupTokens();
    if (!tokensResult.success) {
      return failure(tokensResult.error);
    }

    const noncesResult = await cleanupNonces();
    if (!noncesResult.success) {
      return failure(noncesResult.error);
    }

    return success({
      tokensRemoved: tokensResult.data.cleaned,
      noncesRemoved: noncesResult.data.cleaned,
    });
  }, [cleanupTokens, cleanupNonces]);
}

// =============================================================================
// Wallet Authentication Flow
// =============================================================================

/**
 * Complete wallet authentication flow with Convex backend
 */
export function useWalletAuthFlow() {
  const { storeNonce, validateNonce } = useNonceValidation();
  const { blacklistToken } = useTokenManagement();

  return {
    /**
     * Step 1: Generate and store nonce for wallet challenge
     */
    generateChallenge: useCallback(
      async (
        publicKey: string
      ): Promise<
        Result<{ nonce: string; challenge: string; expiresAt: number }, Error>
      > => {
        const nonce = crypto.randomUUID();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
        const challenge = `Sign this message to authenticate with Anubis Chat.\n\nNonce: ${nonce}\nExpires: ${new Date(expiresAt).toISOString()}`;

        const storeResult = await storeNonce({
          publicKey,
          nonce,
          expiresAt,
        });

        if (!storeResult.success) {
          return storeResult;
        }

        return success({ nonce, challenge, expiresAt });
      },
      [storeNonce]
    ),

    /**
     * Step 2: Validate signature and nonce
     */
    validateSignature: useCallback(
      async (data: {
        publicKey: string;
        nonce: string;
      }): Promise<Result<boolean, Error>> => {
        return await validateNonce(data);
      },
      [validateNonce]
    ),

    /**
     * Step 3: Logout and blacklist token
     */
    logout: useCallback(
      async (data: {
        tokenId: string;
        userId: string;
        expiresAt: number;
      }): Promise<Result<any, Error>> => {
        return await blacklistToken(data);
      },
      [blacklistToken]
    ),
  };
}

// =============================================================================
// Auth System Health Monitoring
// =============================================================================

/**
 * Monitor auth system health with real-time updates
 */
export function useAuthSystemHealth() {
  const statsQuery = useAuthStats();
  const cleanup = useAuthCleanup();

  return {
    stats: statsQuery,
    performCleanup: cleanup,
    isHealthy: !(statsQuery.error || statsQuery.data?.needsCleanup),
    needsCleanup: statsQuery.data?.needsCleanup,
  };
}
