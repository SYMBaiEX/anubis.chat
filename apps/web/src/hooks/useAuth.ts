'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AuthSession, User, WalletAuthChallenge } from '@/lib/types/api';
import { authCache, type AuthCacheData } from '@/lib/cache/auth-cache';
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

const INITIAL_AUTH_STATE: AuthState = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
  token: null,
  error: null,
};

const AUTH_TOKEN_KEY = 'isis-auth-token';
const AUTH_USER_KEY = 'isis-auth-user';
const AUTH_REFRESH_KEY = 'isis-auth-refresh';
const AUTH_EXPIRES_KEY = 'isis-auth-expires';

export const useAuth = (): UseAuthReturn => {
  const { publicKey, signMessage, isConnected } = useWallet();
  const [authState, setAuthState] = useState<AuthState>(() => {
    // Try to restore from cache first
    if (typeof window !== 'undefined') {
      const cached = authCache.get();
      if (cached && cached.isAuthenticated && !authCache.needsRefresh(cached)) {
        log.info('Restored auth state from cache');
        return {
          isAuthenticated: true,
          isLoading: false,
          user: cached.user as User,
          token: cached.token,
          error: null,
        };
      }

      // Fallback to localStorage (legacy)
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      const storedUser = localStorage.getItem(AUTH_USER_KEY);
      const storedExpires = localStorage.getItem(AUTH_EXPIRES_KEY);

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          // Validate the structure matches User type
          if (!(parsedUser?.id && parsedUser?.walletAddress)) {
            throw new Error('Invalid user data structure');
          }

          // Check if token is expired
          const expiresAt = storedExpires
            ? Number.parseInt(storedExpires, 10)
            : 0;
          if (expiresAt && expiresAt < Date.now()) {
            // Token expired, clear storage
            localStorage.removeItem(AUTH_TOKEN_KEY);
            localStorage.removeItem(AUTH_USER_KEY);
            localStorage.removeItem(AUTH_REFRESH_KEY);
            localStorage.removeItem(AUTH_EXPIRES_KEY);
            authCache.clear();
            return INITIAL_AUTH_STATE;
          }

          const user = parsedUser as User;
          
          // Migrate to new cache system
          const cacheData: AuthCacheData = {
            user: {
              walletAddress: user.walletAddress || '',
              publicKey: user.publicKey,
              username: user.username,
              email: user.email,
              avatar: user.avatar,
            },
            token: storedToken,
            refreshToken: null,
            expiresAt: expiresAt || Date.now() + 3600000,
            isAuthenticated: true,
            lastVerified: Date.now(),
          };
          authCache.set(cacheData, { storage: 'all' });
          log.info('Migrated auth to new cache system');
          
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
          localStorage.removeItem(AUTH_REFRESH_KEY);
          localStorage.removeItem(AUTH_EXPIRES_KEY);
          authCache.clear();
        }
      }
    }

    return INITIAL_AUTH_STATE;
  });

  const clearError = useCallback(() => {
    setAuthState((prev) => ({ ...prev, error: null }));
  }, []);

  const clearAuthState = useCallback(() => {
    // Clear cache first
    authCache.clear();
    
    // Clear legacy storage
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_REFRESH_KEY);
    localStorage.removeItem(AUTH_EXPIRES_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    
    setAuthState(INITIAL_AUTH_STATE);
    log.info('Auth state cleared');
  }, []);

  const storeAuthSession = useCallback((session: AuthSession) => {
    // Store in new cache system
    const cacheData: AuthCacheData = {
      user: {
        walletAddress: session.user.walletAddress || '',
        publicKey: session.user.publicKey,
        username: session.user.username,
        email: session.user.email,
        avatar: session.user.avatar,
      },
      token: session.token,
      refreshToken: session.refreshToken || null,
      expiresAt: session.expiresAt || Date.now() + 3600000, // Default 1 hour
      isAuthenticated: true,
      lastVerified: Date.now(),
    };
    
    authCache.set(cacheData, { 
      ttl: 3600000, // 1 hour TTL
      storage: 'all' 
    });

    // Also store in legacy format for backwards compatibility
    localStorage.setItem(AUTH_TOKEN_KEY, session.token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(session.user));

    if (session.refreshToken) {
      localStorage.setItem(AUTH_REFRESH_KEY, session.refreshToken);
    }
    if (session.expiresAt) {
      localStorage.setItem(AUTH_EXPIRES_KEY, session.expiresAt.toString());
    }

    sessionStorage.setItem(AUTH_TOKEN_KEY, session.token);

    setAuthState({
      isAuthenticated: true,
      isLoading: false,
      user: session.user,
      token: session.token,
      error: null,
    });
    
    log.info('Auth session stored and cached');
  }, []);

  const getAuthChallenge = useCallback(
    async (publicKey: string): Promise<WalletAuthChallenge | null> => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10_000);
        const response = await fetch('/api/auth/challenge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ publicKey }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json();
          console.error(
            'Challenge endpoint error:',
            response.status,
            errorData
          );

          // Handle rate limit specifically
          if (response.status === 429) {
            const retryAfter = errorData.error?.details?.retryAfter || 60;
            throw new Error(
              `Rate limited. Please wait ${retryAfter} seconds before trying again.`
            );
          }

          throw new Error(
            errorData.error?.message ||
              errorData.message ||
              'Failed to get challenge'
          );
        }

        const apiResponse = await response.json();

        // Handle API response wrapper structure
        if (apiResponse.success && apiResponse.data) {
          return apiResponse.data;
        }
        if (apiResponse.challenge) {
          // Direct response (legacy format)
          return apiResponse;
        }
        throw new Error('Invalid challenge response format');
      } catch (error) {
        console.error('Failed to get auth challenge:', error);
        // Check if it's a rate limit error
        if (error instanceof Error && error.message.includes('Rate limited')) {
          throw error; // Re-throw rate limit errors
        }
        // Log to error tracking service instead of console in production
        throw new Error('Failed to get authentication challenge');
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

        const apiResponse = await response.json();

        // Handle API response wrapper structure (same as challenge)
        if (apiResponse.success && apiResponse.data) {
          return apiResponse.data;
        }
        if (apiResponse.token) {
          // Direct response (legacy format)
          return apiResponse;
        }
        throw new Error('Invalid authentication response format');
      } catch (error) {
        console.error('Authentication verification failed:', error);
        // Log to error tracking service instead of console in production
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

    // Check cache first
    const cached = authCache.get();
    if (cached && cached.isAuthenticated && !authCache.needsRefresh(cached)) {
      log.info('Using cached authentication');
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        user: cached.user as User,
        token: cached.token,
        error: null,
      });
      return {
        user: cached.user as User,
        token: cached.token || '',
        expiresAt: cached.expiresAt,
      } as AuthSession;
    }

    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Step 1: Get challenge from server
      const challenge = await getAuthChallenge(publicKey.toString());
      if (!challenge) {
        throw new Error('Failed to get authentication challenge');
      }
      // Step 2: Sign the challenge message
      // Ensure we have a valid challenge message
      if (!challenge.challenge || challenge.challenge.length === 0) {
        throw new Error('Invalid challenge message received from server');
      }

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
      log.error('Login error:', errorMessage);
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
      // Log to error tracking service instead of console in production
    } finally {
      clearAuthState();
    }
  }, [authState.token, clearAuthState]);

  const refreshToken = useCallback(async (): Promise<string | null> => {
    // First try to use refresh token, then fall back to current token
    const refreshTokenStored = localStorage.getItem(AUTH_REFRESH_KEY);
    const currentToken =
      authState.token || localStorage.getItem(AUTH_TOKEN_KEY);

    if (!(refreshTokenStored || currentToken)) {
      return null;
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${refreshTokenStored || currentToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Token refresh failed, clear auth state
        clearAuthState();
        return null;
      }

      const apiResponse = await response.json();
      // Handle API response wrapper
      const data =
        apiResponse.success && apiResponse.data
          ? apiResponse.data
          : apiResponse;

      const newToken = data.token;
      const newExpiry = data.expiresAt;

      // Update cache with new token
      authCache.update({
        token: newToken,
        expiresAt: newExpiry || Date.now() + 3600000,
        lastVerified: Date.now(),
      });

      // Update legacy storage
      localStorage.setItem(AUTH_TOKEN_KEY, newToken);
      if (newExpiry) {
        localStorage.setItem(AUTH_EXPIRES_KEY, newExpiry.toString());
      }
      if (data.refreshToken) {
        localStorage.setItem(AUTH_REFRESH_KEY, data.refreshToken);
      }
      sessionStorage.setItem(AUTH_TOKEN_KEY, newToken);

      setAuthState((prev) => ({ ...prev, token: newToken }));
      log.info('Token refreshed and cached');

      return newToken;
    } catch (error) {
      log.error('Token refresh failed:', error);
      clearAuthState();
      return null;
    }
  }, [authState.token, clearAuthState]);

  // Listen for storage events to sync auth across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === AUTH_TOKEN_KEY) {
        if (!e.newValue) {
          // Token was removed, logout
          setAuthState(INITIAL_AUTH_STATE);
        } else if (e.newValue !== authState.token) {
          // Token changed, reload auth state
          const storedUser = localStorage.getItem(AUTH_USER_KEY);
          const storedExpires = localStorage.getItem(AUTH_EXPIRES_KEY);

          if (storedUser) {
            try {
              const user = JSON.parse(storedUser) as User;
              const expiresAt = storedExpires
                ? Number.parseInt(storedExpires, 10)
                : 0;

              // Check if token is still valid
              if (!expiresAt || expiresAt > Date.now()) {
                setAuthState({
                  isAuthenticated: true,
                  isLoading: false,
                  user,
                  token: e.newValue,
                  error: null,
                });
              }
            } catch (error) {
              console.error('Failed to sync auth state:', error);
            }
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [authState.token]);

  return {
    ...authState,
    login,
    logout,
    refreshToken,
    clearError,
  };
};
