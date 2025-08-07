'use client';

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import type { AuthSession, User } from '@/lib/types/api';

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

  // Auto-login if wallet connects and we don't have auth
  useEffect(() => {
    const autoLogin = async () => {
      // Only attempt auto-login if:
      // 1. Wallet is connected
      // 2. We're not already authenticated
      // 3. We're not currently loading
      // 4. No auth errors
      if (
        wallet.isConnected &&
        wallet.publicKey &&
        !auth.isAuthenticated &&
        !auth.isLoading &&
        !auth.error
      ) {
        try {
          await auth.login();
        } catch (error) {
          // Log to error tracking service instead of console in production
          // Error is handled by the auth hook
          // Error is handled by the auth hook, don't need to do anything here
        }
      }
    };

    // Small delay to allow wallet state to stabilize
    const timeoutId = setTimeout(autoLogin, 500);
    return () => clearTimeout(timeoutId);
  }, [
    wallet.isConnected,
    wallet.publicKey,
    auth.isAuthenticated,
    auth.isLoading,
    auth.error,
    auth.login,
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
