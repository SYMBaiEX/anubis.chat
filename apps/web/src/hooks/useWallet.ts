'use client';

import { useCallback, useEffect, useState } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { useWallet as useSolanaWallet, useConnection } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';
import { 
  connection, 
  lamportsToSol, 
  createSignInMessage, 
  WalletConnectionState,
  INITIAL_WALLET_STATE 
} from '@/lib/solana';

interface UseWalletReturn extends WalletConnectionState {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  signInWithSolana: () => Promise<{ publicKey: string; signature: string; message: string }>;
  refreshBalance: () => Promise<void>;
  formatAddress: (length?: number) => string;
}

export const useWallet = (): UseWalletReturn => {
  const { 
    wallet,
    publicKey: walletPublicKey,
    connected,
    connecting,
    connect: connectWallet,
    disconnect: disconnectWallet,
    signMessage: walletSignMessage
  } = useSolanaWallet();

  const [state, setState] = useState<WalletConnectionState>(INITIAL_WALLET_STATE);

  // Update wallet state when Solana wallet state changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isConnected: connected,
      isConnecting: connecting,
      publicKey: walletPublicKey,
      error: null
    }));
  }, [connected, connecting, walletPublicKey]);

  // Fetch balance when wallet connects
  const fetchBalance = useCallback(async (pubkey: PublicKey): Promise<number> => {
    try {
      const balance = await connection.getBalance(pubkey);
      return lamportsToSol(balance);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      return 0;
    }
  }, []);

  // Update balance when public key changes
  useEffect(() => {
    if (walletPublicKey && connected) {
      fetchBalance(walletPublicKey).then(balance => {
        setState(prev => ({ ...prev, balance }));
      });
    } else {
      setState(prev => ({ ...prev, balance: null }));
    }
  }, [walletPublicKey, connected, fetchBalance]);

  // Save wallet state to localStorage
  useEffect(() => {
    if (connected && walletPublicKey && wallet?.adapter.name) {
      localStorage.setItem('isis-wallet-state', JSON.stringify({
        publicKey: walletPublicKey.toString(),
        walletName: wallet.adapter.name,
        connected: true,
        timestamp: Date.now()
      }));
    } else if (!connected) {
      localStorage.removeItem('isis-wallet-state');
    }
  }, [connected, walletPublicKey, wallet]);

  const connect = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isConnecting: true, error: null }));
      await connectWallet();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isConnecting: false 
      }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isConnecting: false }));
    }
  }, [connectWallet]);

  const disconnect = useCallback(async (): Promise<void> => {
    try {
      await disconnectWallet();
      setState(INITIAL_WALLET_STATE);
      localStorage.removeItem('isis-wallet-state');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to disconnect wallet';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [disconnectWallet]);

  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (!walletSignMessage || !walletPublicKey) {
      throw new Error('Wallet not connected or does not support message signing');
    }

    try {
      const messageBytes = new TextEncoder().encode(message);
      const signature = await walletSignMessage(messageBytes);
      return bs58.encode(signature);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign message';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw new Error(`Message signing failed: ${errorMessage}`);
    }
  }, [walletSignMessage, walletPublicKey]);

  const signInWithSolana = useCallback(async (): Promise<{ 
    publicKey: string; 
    signature: string; 
    message: string 
  }> => {
    if (!walletPublicKey) {
      throw new Error('Wallet not connected');
    }

    const message = createSignInMessage(walletPublicKey.toString());
    const signature = await signMessage(message);

    return {
      publicKey: walletPublicKey.toString(),
      signature,
      message
    };
  }, [walletPublicKey, signMessage]);

  const refreshBalance = useCallback(async (): Promise<void> => {
    if (!walletPublicKey) {
      return;
    }

    try {
      const balance = await fetchBalance(walletPublicKey);
      setState(prev => ({ ...prev, balance }));
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  }, [walletPublicKey, fetchBalance]);

  const formatAddress = useCallback((length: number = 4): string => {
    if (!walletPublicKey) return '';
    const address = walletPublicKey.toString();
    return `${address.slice(0, length)}...${address.slice(-length)}`;
  }, [walletPublicKey]);

  return {
    ...state,
    connect,
    disconnect,
    signMessage,
    signInWithSolana,
    refreshBalance,
    formatAddress
  };
};