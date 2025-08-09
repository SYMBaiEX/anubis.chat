'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import type { AuthSession, User } from '@/lib/types/api';
import { authCache, cacheUtils, type AuthCacheData } from '@/lib/cache/auth-cache';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('auth-provider');

// Token refresh configuration
const TOKEN_REFRESH_INTERVAL = 20 * 60 * 1000; // Refresh every 20 minutes
const TOKEN_VALIDITY_CHECK_INTERVAL = 60 * 1000; // Check validity every minute
const CACHE_TTL = 60 * 60 * 1000; // Cache for 1 hour

interface AuthContextValue {
  // Auth state
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  error: string | null;

  // Auth methods
  login: () => Promise<AuthSession | null>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
  clearError: () => void;
  validateSession: () => Promise<boolean>;

  // Wallet integration
  isWalletConnected: boolean;
  walletAddress: string | null;
  publicKey: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth();
  const wallet = useWallet();
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const validityCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cacheCleanupRef = useRef<(() => void) | null>(null);

  // Check cache on mount and restore session
  useEffect(() => {
    // Only run on client side after mount
    if (typeof window === 'undefined') return;
    
    const cached = authCache.get();
    if (cached && cached.isAuthenticated && !auth.isAuthenticated) {
      log.info('Restoring session from cache');
      // The auth hook should handle restoring from cache
    }
  }, []);

  // Cache authentication state when it changes
  useEffect(() => {
    if (auth.isAuthenticated && auth.user && auth.token) {
      const cacheData: AuthCacheData = {
        user: {
          walletAddress: auth.user.walletAddress || '',
          publicKey: auth.user.publicKey,
          username: auth.user.username,
          email: auth.user.email,
          avatar: auth.user.avatar,
        },
        token: auth.token,
        refreshToken: null, // We don't store refresh tokens in cache for security
        expiresAt: Date.now() + CACHE_TTL,
        isAuthenticated: true,
        lastVerified: Date.now(),
      };
      
      authCache.set(cacheData, { 
        ttl: CACHE_TTL, 
        storage: 'all' // Use all storage layers for redundancy
      });
      
      log.info('Authentication state cached');
    } else if (!auth.isAuthenticated) {
      // Clear cache when logged out
      authCache.clear();
      log.info('Authentication cache cleared');
    }
  }, [auth.isAuthenticated, auth.user, auth.token]);

  // Set up auto-refresh from cache
  useEffect(() => {
    if (auth.isAuthenticated && auth.token) {
      // Clean up previous auto-refresh
      if (cacheCleanupRef.current) {
        cacheCleanupRef.current();
      }

      // Set up new auto-refresh
      cacheCleanupRef.current = cacheUtils.setupAutoRefresh(
        async () => {
          // Refresh authentication
          const newToken = await auth.refreshToken();
          if (newToken && auth.user) {
            return {
              user: {
                walletAddress: auth.user.walletAddress || '',
                publicKey: auth.user.publicKey,
                username: auth.user.username,
                email: auth.user.email,
                avatar: auth.user.avatar,
              },
              token: newToken,
              refreshToken: null,
              expiresAt: Date.now() + CACHE_TTL,
              isAuthenticated: true,
              lastVerified: Date.now(),
            };
          }
          throw new Error('Failed to refresh authentication');
        },
        TOKEN_VALIDITY_CHECK_INTERVAL
      );

      return () => {
        if (cacheCleanupRef.current) {
          cacheCleanupRef.current();
          cacheCleanupRef.current = null;
        }
      };
    }
  }, [auth.isAuthenticated, auth.token, auth.refreshToken, auth.user]);

  // Validate session with backend (with caching)
  const validateSession = useCallback(async (): Promise<boolean> => {
    // Check cache first
    const cached = authCache.get();
    if (cached && !authCache.needsRefresh(cached)) {
      log.debug('Session valid from cache');
      return true;
    }

    if (!auth.token) {
      return false;
    }

    try {
      const response = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Token is invalid, try to refresh
        const newToken = await auth.refreshToken();
        if (newToken) {
          // Update cache with new token
          authCache.update({ 
            token: newToken,
            lastVerified: Date.now(),
            expiresAt: Date.now() + CACHE_TTL,
          });
        }
        return !!newToken;
      }

      // Update cache verification time
      authCache.update({ lastVerified: Date.now() });
      return true;
    } catch (error) {
      log.error('Session validation failed:', error);
      return false;
    }
  }, [auth.token, auth.refreshToken]);

  // Set up automatic token refresh
  useEffect(() => {
    if (auth.isAuthenticated && auth.token) {
      // Clear existing intervals
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }

      // Set up new refresh interval
      refreshIntervalRef.current = setInterval(async () => {
        console.log('Auto-refreshing token...');
        try {
          await auth.refreshToken();
        } catch (error) {
          console.error('Auto-refresh failed:', error);
        }
      }, TOKEN_REFRESH_INTERVAL);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
      };
    }
  }, [auth.isAuthenticated, auth.token, auth.refreshToken]);

  // Set up periodic session validation
  useEffect(() => {
    if (auth.isAuthenticated && auth.token) {
      // Clear existing intervals
      if (validityCheckIntervalRef.current) {
        clearInterval(validityCheckIntervalRef.current);
      }

      // Set up validity check interval
      validityCheckIntervalRef.current = setInterval(async () => {
        const isValid = await validateSession();
        if (!isValid) {
          console.warn('Session validation failed, logging out');
          await auth.logout();
        }
      }, TOKEN_VALIDITY_CHECK_INTERVAL);

      return () => {
        if (validityCheckIntervalRef.current) {
          clearInterval(validityCheckIntervalRef.current);
          validityCheckIntervalRef.current = null;
        }
      };
    }
  }, [auth.isAuthenticated, auth.token, validateSession, auth.logout]);

  // Auto-login if wallet connects and we don't have auth
  useEffect(() => {
    // Skip if wallet is not connected or already authenticated
    if (
      !(wallet.isConnected && wallet.publicKey) ||
      auth.isAuthenticated ||
      auth.isLoading
    ) {
      return;
    }

    // Skip if there's a recent rate limit error
    if (auth.error?.includes('Rate limited')) {
      return;
    }

    const autoLogin = async () => {
      // Clear any previous errors before attempting login
      if (auth.error) {
        auth.clearError();
      }

      try {
        await auth.login();
      } catch (error) {
        // Silent fail - error is already set in auth state
        // User can manually retry with the button
      }
    };

    // Give wallet adapter time to fully initialize
    const timeoutId = setTimeout(autoLogin, 1000);
    return () => clearTimeout(timeoutId);
  }, [
    wallet.isConnected,
    wallet.publicKey,
    auth.isAuthenticated,
    auth.isLoading,
    auth.error,
    auth.login,
    auth.clearError,
  ]);

  // Auto-logout if wallet disconnects
  useEffect(() => {
    const autoLogout = async () => {
      // If we're authenticated but wallet is no longer connected, logout
      if (auth.isAuthenticated && !wallet.isConnected) {
        try {
          await auth.logout();
        } catch (error) {
          // Log to error tracking service instead of console in production
        }
      }
    };

    // Small delay to avoid race conditions during wallet switching
    const timeoutId = setTimeout(autoLogout, 100);
    return () => clearTimeout(timeoutId);
  }, [auth.isAuthenticated, wallet.isConnected, auth.logout]);

  // Wrap login with caching
  const cachedLogin = useCallback(async () => {
    // Check cache first
    const cached = authCache.get();
    if (cached && cached.isAuthenticated && !authCache.needsRefresh(cached)) {
      log.info('Using cached authentication');
      return {
        user: cached.user,
        token: cached.token,
        expiresAt: cached.expiresAt,
      } as AuthSession;
    }

    // Perform login
    const result = await auth.login();
    
    // Cache successful login
    if (result && result.user && result.token) {
      const cacheData: AuthCacheData = {
        user: {
          walletAddress: result.user.walletAddress || '',
          publicKey: result.user.publicKey,
          username: result.user.username,
          email: result.user.email,
          avatar: result.user.avatar,
        },
        token: result.token,
        refreshToken: null,
        expiresAt: Date.now() + CACHE_TTL,
        isAuthenticated: true,
        lastVerified: Date.now(),
      };
      
      authCache.set(cacheData, { 
        ttl: CACHE_TTL, 
        storage: 'all'
      });
      
      log.info('Login cached');
    }
    
    return result;
  }, [auth.login]);

  // Wrap logout with cache clearing
  const cachedLogout = useCallback(async () => {
    // Clear cache first
    authCache.clear();
    log.info('Cache cleared on logout');
    
    // Clean up auto-refresh
    if (cacheCleanupRef.current) {
      cacheCleanupRef.current();
      cacheCleanupRef.current = null;
    }
    
    // Perform logout
    await auth.logout();
  }, [auth.logout]);

  // Wrap refresh token with caching
  const cachedRefreshToken = useCallback(async () => {
    const newToken = await auth.refreshToken();
    
    if (newToken) {
      // Update cache with new token
      authCache.update({ 
        token: newToken,
        lastVerified: Date.now(),
        expiresAt: Date.now() + CACHE_TTL,
      });
      log.info('Token refreshed and cached');
    }
    
    return newToken;
  }, [auth.refreshToken]);

  const contextValue: AuthContextValue = useMemo(
    () => ({
      // Auth state
      isAuthenticated: auth.isAuthenticated,
      isLoading: auth.isLoading || wallet.isConnecting,
      user: auth.user,
      token: auth.token,
      error: auth.error,

      // Auth methods (cached versions)
      login: cachedLogin,
      logout: cachedLogout,
      refreshToken: cachedRefreshToken,
      clearError: auth.clearError,
      validateSession,

      // Wallet integration
      isWalletConnected: wallet.isConnected,
      walletAddress: wallet.publicKey?.toString() ?? null,
      publicKey: wallet.publicKey?.toString() ?? null,
    }),
    [
      auth.isAuthenticated,
      auth.isLoading,
      auth.user,
      auth.token,
      auth.error,
      cachedLogin,
      cachedLogout,
      cachedRefreshToken,
      auth.clearError,
      validateSession,
      wallet.isConnecting,
      wallet.isConnected,
      wallet.publicKey,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

// Convenience hooks for common use cases
export function useCurrentUser(): User | null {
  const { user } = useAuthContext();
  return user;
}

export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuthContext();
  return isAuthenticated;
}

export function useAuthToken(): string | null {
  const { token } = useAuthContext();
  return token;
}
