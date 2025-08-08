'use client';

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import type { AuthSession, User } from '@/lib/types/api';

// Token refresh configuration
const TOKEN_REFRESH_INTERVAL = 20 * 60 * 1000; // Refresh every 20 minutes
const TOKEN_VALIDITY_CHECK_INTERVAL = 60 * 1000; // Check validity every minute

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

  // Validate session with backend
  const validateSession = useCallback(async (): Promise<boolean> => {
    if (!auth.token) {
      return false;
    }

    try {
      const response = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Token is invalid, try to refresh
        const newToken = await auth.refreshToken();
        return !!newToken;
      }

      return true;
    } catch (error) {
      console.error('Session validation failed:', error);
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
    if (!wallet.isConnected || !wallet.publicKey || auth.isAuthenticated || auth.isLoading) {
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

  const contextValue: AuthContextValue = useMemo(
    () => ({
      // Auth state
      isAuthenticated: auth.isAuthenticated,
      isLoading: auth.isLoading || wallet.isConnecting,
      user: auth.user,
      token: auth.token,
      error: auth.error,

      // Auth methods
      login: auth.login,
      logout: auth.logout,
      refreshToken: auth.refreshToken,
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
      auth.login,
      auth.logout,
      auth.refreshToken,
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
