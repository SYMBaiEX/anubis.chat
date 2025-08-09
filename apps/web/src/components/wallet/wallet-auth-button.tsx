'use client';

import { useCallback } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Loader2, Wallet, LogOut } from 'lucide-react';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('wallet-auth-button');

interface WalletAuthButtonProps {
  className?: string;
  showAddress?: boolean;
}

/**
 * Wallet Authentication Button
 * 
 * Provides a unified interface for:
 * - Wallet connection/disconnection
 * - Convex Auth authentication
 * - User session management
 * 
 * Features:
 * - Automatic authentication after wallet connection
 * - Loading states and error handling
 * - Responsive design and accessibility
 * - Integration with Convex Auth system
 */
export function WalletAuthButton({ 
  className = '', 
  showAddress = false 
}: WalletAuthButtonProps) {
  const wallet = useWallet();
  const { isAuthenticated, user } = useAuthContext();

  const handleConnect = useCallback(async () => {
    try {
      log.info('Starting wallet connection flow');
      
      // Step 1: Connect wallet
      await wallet.connect();
      
      if (!wallet.isConnected || !wallet.publicKey) {
        throw new Error('Wallet connection failed');
      }
      
      // Step 2: Authenticate with Convex
      await wallet.authenticateWithConvex();
      
      log.info('Wallet connection and authentication successful', {
        publicKey: wallet.publicKey,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      log.error('Wallet connection/authentication failed', { error: errorMessage });
      
      // Show user-friendly error message
      // In production, you might want to use a toast notification
      console.error('Wallet authentication failed:', errorMessage);
    }
  }, [wallet]);

  const handleDisconnect = useCallback(async () => {
    try {
      log.info('Starting wallet disconnection');
      await wallet.disconnect();
      log.info('Wallet disconnected successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Disconnection failed';
      log.error('Wallet disconnection failed', { error: errorMessage });
    }
  }, [wallet]);

  // Loading state
  if (wallet.isConnecting || wallet.isAuthenticating) {
    return (
      <Button disabled className={className}>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {wallet.isConnecting ? 'Connecting...' : 'Authenticating...'}
      </Button>
    );
  }

  // Connected and authenticated
  if (wallet.isConnected && isAuthenticated && user) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showAddress && wallet.publicKey && (
          <div className="text-sm font-mono text-muted-foreground">
            {wallet.formatAddress(6)}
          </div>
        )}
        <Button
          variant="outline"
          onClick={handleDisconnect}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          Disconnect
        </Button>
      </div>
    );
  }

  // Connected but not authenticated
  if (wallet.isConnected && !isAuthenticated) {
    return (
      <Button 
        onClick={wallet.authenticateWithConvex}
        disabled={wallet.isAuthenticating}
        className={className}
      >
        <Wallet className="mr-2 h-4 w-4" />
        Authenticate
      </Button>
    );
  }

  // Not connected
  return (
    <Button onClick={handleConnect} className={className}>
      <Wallet className="mr-2 h-4 w-4" />
      Connect Wallet
    </Button>
  );
}

// Helper hook for wallet connection status
export function useWalletConnectionStatus() {
  const wallet = useWallet();
  const { isAuthenticated, user } = useAuthContext();
  
  return {
    // Connection states
    isConnected: wallet.isConnected,
    isConnecting: wallet.isConnecting,
    isDisconnecting: wallet.isDisconnecting,
    
    // Authentication states
    isAuthenticated,
    isAuthenticating: wallet.isAuthenticating,
    
    // User info
    user,
    publicKey: wallet.publicKey,
    walletName: wallet.walletName,
    balance: wallet.balance,
    
    // Actions
    connect: wallet.connect,
    disconnect: wallet.disconnect,
    authenticate: wallet.authenticateWithConvex,
    refreshBalance: wallet.refreshBalance,
    
    // Utilities
    formatAddress: wallet.formatAddress,
    
    // Error handling
    error: wallet.error,
    clearError: wallet.clearError,
    
    // Health monitoring
    isHealthy: wallet.isHealthy,
    connectionHealthScore: wallet.connectionHealthScore,
  };
}

export default WalletAuthButton;