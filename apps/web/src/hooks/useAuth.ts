'use client';

import { api } from '@convex/_generated/api';
import { useAuthActions, useAuthToken } from '@convex-dev/auth/react';
import { useMutation, useQuery } from 'convex/react';
import { useCallback, useEffect, useState } from 'react';
import type { AuthSession, User } from '@/lib/types/api';
import { createModuleLogger } from '@/lib/utils/logger';
import { useWallet } from './useWallet';

const log = createModuleLogger('useAuth');

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  error: string | null;
}

interface UseAuthReturn extends AuthState {
  login: () => Promise<AuthSession | null>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
  clearError: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const { publicKey, signMessage, isConnected } = useWallet();
  const { signIn, signOut } = useAuthActions();
  const token = useAuthToken();

  // Convex mutations for wallet auth
  const createWalletChallenge = useMutation(api.auth.createWalletChallenge);

  // Get current user from Convex
  const currentUser = useQuery(
    api.users.getUserByWallet,
    token && publicKey ? { walletAddress: publicKey.toString() } : 'skip'
  );

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Derived state from Convex Auth
  const isAuthenticated = !!token;

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Login with Solana wallet using Convex Auth
   */
  const login = useCallback(async (): Promise<AuthSession | null> => {
    if (!(isConnected && publicKey && signMessage)) {
      const errorMsg = 'Wallet not connected or missing required methods';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    setIsLoading(true);
    setError(null);

    try {
      log.info('Starting Convex Auth login with Solana wallet');

      // Step 1: Get challenge from Convex
      const challengeData = await createWalletChallenge({
        publicKey: publicKey.toString(),
      });

      if (!(challengeData?.challenge && challengeData?.nonce)) {
        throw new Error('Failed to receive valid challenge from server');
      }

      // Step 2: Sign the challenge
      const signature = await signMessage(challengeData.challenge);

      if (!signature) {
        throw new Error('Failed to sign challenge message');
      }

      // Step 3: Authenticate with ConvexAuth using credentials shape expected by ConvexCredentials
      const result = await signIn('solana-wallet', {
        account: {
          id: publicKey.toString(),
          secret: signature,
        },
        profile: {
          publicKey: publicKey.toString(),
          signature,
          message: challengeData.challenge,
          nonce: challengeData.nonce,
        },
      });

      log.info('Convex Auth login completed', { result });

      // Return session data (token will be available via useAuthToken)
      return {
        user: currentUser as User,
        token: token || '',
        expiresAt: Date.now() + 3_600_000, // 1 hour
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Wallet authentication failed';

      log.error('Convex Auth login failed', { error: errorMessage });
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [
    isConnected,
    publicKey,
    signMessage,
    createWalletChallenge,
    signIn,
    currentUser,
    token,
  ]);

  /**
   * Logout using Convex Auth
   */
  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await signOut();
      log.info('User signed out successfully via Convex Auth');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Sign out failed';

      log.error('Convex Auth sign out failed', { error: errorMessage });
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [signOut]);

  /**
   * Refresh token - Convex Auth handles this automatically
   */
  const refreshToken = useCallback(async (): Promise<string | null> => {
    // Convex Auth handles token refresh automatically
    // Just return the current token
    return token;
  }, [token]);

  // Auto-authenticate when wallet connects
  useEffect(() => {
    if (isConnected && publicKey && !isAuthenticated && !isLoading && !error) {
      log.info('Wallet connected, attempting auto-authentication');

      // Small delay to ensure wallet is fully initialized
      const timeoutId = setTimeout(() => {
        login().catch((error) => {
          log.warn('Auto-authentication failed', { error: error.message });
          // Don't throw here - user can manually retry
        });
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [isConnected, publicKey, isAuthenticated, isLoading, error, login]);

  // Auto-logout when wallet disconnects
  useEffect(() => {
    if (!isConnected && isAuthenticated) {
      log.info('Wallet disconnected, signing out');
      logout().catch((error) => {
        log.warn('Auto-logout failed', { error: error.message });
      });
    }
  }, [isConnected, isAuthenticated, logout]);

  return {
    isAuthenticated,
    isLoading,
    user: currentUser || null,
    token,
    error,
    login,
    logout,
    refreshToken,
    clearError,
  };
};
