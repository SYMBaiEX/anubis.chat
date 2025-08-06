'use client';

import { useCallback, useState } from 'react';
import type { AuthSession, User, WalletAuthChallenge } from '@/lib/types/api';
import { useWallet } from './useWallet';

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

const INITIAL_AUTH_STATE: AuthState = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
  token: null,
  error: null,
};

const AUTH_TOKEN_KEY = 'isis-auth-token';
const AUTH_USER_KEY = 'isis-auth-user';

export const useAuth = (): UseAuthReturn => {
  const { publicKey, signMessage, isConnected } = useWallet();
  const [authState, setAuthState] = useState<AuthState>(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      const storedUser = localStorage.getItem(AUTH_USER_KEY);

      if (storedToken && storedUser) {
        try {
          const user = JSON.parse(storedUser) as User;
          return {
            isAuthenticated: true,
            isLoading: false,
            user,
            token: storedToken,
            error: null,
          };
        } catch (error) {
          // Clear corrupted data
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem(AUTH_USER_KEY);
        }
      }
    }

    return INITIAL_AUTH_STATE;
  });

  const clearError = useCallback(() => {
    setAuthState((prev) => ({ ...prev, error: null }));
  }, []);

  const clearAuthState = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    setAuthState(INITIAL_AUTH_STATE);
  }, []);

  const storeAuthSession = useCallback((session: AuthSession) => {
    localStorage.setItem(AUTH_TOKEN_KEY, session.token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(session.user));

    setAuthState({
      isAuthenticated: true,
      isLoading: false,
      user: session.user,
      token: session.token,
      error: null,
    });
  }, []);

  const getAuthChallenge = useCallback(
    async (publicKey: string): Promise<WalletAuthChallenge | null> => {
      try {
        const response = await fetch('/api/auth/challenge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ publicKey }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to get challenge');
        }

        return await response.json();
      } catch (error) {
        console.error('Challenge request failed:', error);
        return null;
      }
    },
    []
  );

  const verifyAuthentication = useCallback(
    async (
      message: string,
      signature: string,
      publicKey: string
    ): Promise<AuthSession | null> => {
      try {
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            signature,
            publicKey,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Authentication failed');
        }

        return await response.json();
      } catch (error) {
        console.error('Authentication verification failed:', error);
        return null;
      }
    },
    []
  );

  const login = useCallback(async (): Promise<AuthSession | null> => {
    if (!(publicKey && isConnected)) {
      const errorMessage = 'Wallet not connected';
      setAuthState((prev) => ({ ...prev, error: errorMessage }));
      throw new Error(errorMessage);
    }

    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Step 1: Get challenge from server
      const challenge = await getAuthChallenge(publicKey.toString());
      if (!challenge) {
        throw new Error('Failed to get authentication challenge');
      }

      // Step 2: Sign the challenge message
      const signature = await signMessage(challenge.challenge);

      // Step 3: Verify signature and get auth session
      const authSession = await verifyAuthentication(
        challenge.challenge,
        signature,
        publicKey.toString()
      );

      if (!authSession) {
        throw new Error('Authentication verification failed');
      }

      // Step 4: Store session and update state
      storeAuthSession(authSession);

      return authSession;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Login failed';
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [
    publicKey,
    isConnected,
    signMessage,
    getAuthChallenge,
    verifyAuthentication,
    storeAuthSession,
  ]);

  const logout = useCallback(async (): Promise<void> => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Call logout endpoint to blacklist token if we have one
      if (authState.token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authState.token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      // Don't throw on logout API failure, still clear local state
      console.error('Logout API call failed:', error);
    } finally {
      clearAuthState();
    }
  }, [authState.token, clearAuthState]);

  const refreshToken = useCallback(async (): Promise<string | null> => {
    if (!authState.token) {
      return null;
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authState.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Token refresh failed, clear auth state
        clearAuthState();
        return null;
      }

      const data = await response.json();
      const newToken = data.token;

      // Update stored token
      localStorage.setItem(AUTH_TOKEN_KEY, newToken);
      setAuthState((prev) => ({ ...prev, token: newToken }));

      return newToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearAuthState();
      return null;
    }
  }, [authState.token, clearAuthState]);

  return {
    ...authState,
    login,
    logout,
    refreshToken,
    clearError,
  };
};
