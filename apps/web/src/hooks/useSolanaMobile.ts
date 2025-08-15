/**
 * Solana Mobile Integration Hook
 * 
 * This hook provides a unified interface for Solana Mobile Wallet Adapter
 * integration, including transaction signing, message signing, and wallet management.
 */

import { useCallback, useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { useMobileWalletAdapter } from '@/components/wallet/mobile-wallet-adapter';
import {
  signTransactionWithMobileWallet,
  signAndSendTransactionWithMobileWallet,
  signMultipleTransactionsWithMobileWallet,
  signMessageWithMobileWallet,
  type TransactionResult,
} from '@/lib/mobile-transaction-helper';
import { isMobileEnvironment, isSolanaMobileApp } from '@/lib/solana-mobile-config';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('use-solana-mobile');

export interface SolanaMobileState {
  isConnected: boolean;
  publicKey: PublicKey | null;
  authToken: string | null;
  walletLabel: string | null;
  isMobileWallet: boolean;
  isConnecting: boolean;
}

export interface SolanaMobileActions {
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  signTransaction: (transaction: Transaction | VersionedTransaction) => Promise<Transaction | VersionedTransaction | null>;
  signAndSendTransaction: (transaction: Transaction | VersionedTransaction) => Promise<TransactionResult>;
  signMultipleTransactions: (transactions: (Transaction | VersionedTransaction)[]) => Promise<(Transaction | VersionedTransaction)[] | null>;
  signMessage: (message: Uint8Array) => Promise<Uint8Array | null>;
}

export function useSolanaMobile(): SolanaMobileState & SolanaMobileActions {
  const { connection } = useConnection();
  const { wallet, publicKey: standardPublicKey, connected: standardConnected } = useWallet();
  const { connectWallet, disconnectWallet, reauthorizeWallet } = useMobileWalletAdapter();
  
  const [mobileState, setMobileState] = useState<{
    publicKey: PublicKey | null;
    authToken: string | null;
    walletLabel: string | null;
    isConnecting: boolean;
  }>({
    publicKey: null,
    authToken: null,
    walletLabel: null,
    isConnecting: false,
  });

  // Determine if we should use mobile wallet
  const isMobileWallet = isMobileEnvironment() || isSolanaMobileApp();

  // Get the active public key (mobile or standard wallet)
  const activePublicKey = isMobileWallet ? mobileState.publicKey : standardPublicKey;
  const isConnected = isMobileWallet ? Boolean(mobileState.publicKey) : standardConnected;

  // Connect to wallet (mobile or standard)
  const connect = useCallback(async (): Promise<boolean> => {
    if (mobileState.isConnecting) return false;

    setMobileState(prev => ({ ...prev, isConnecting: true }));

    try {
      if (isMobileWallet) {
        // Check for stored auth token first
        const storedAuthToken = localStorage.getItem('solana-mobile-auth-token');
        
        let result;
        if (storedAuthToken) {
          // Try reauthorization first
          result = await reauthorizeWallet(storedAuthToken);
          if (!result) {
            // If reauthorization fails, try fresh authorization
            result = await connectWallet();
          }
        } else {
          // Fresh authorization
          result = await connectWallet();
        }

        if (result) {
          setMobileState({
            publicKey: result.publicKey,
            authToken: result.authToken,
            walletLabel: result.label || null,
            isConnecting: false,
          });
          
          // Store auth token for future use
          localStorage.setItem('solana-mobile-auth-token', result.authToken);
          
          log.info('Mobile wallet connected successfully', {
            address: result.address,
            label: result.label,
          });
          return true;
        }
      }
      
      return false;
    } catch (error) {
      log.error('Failed to connect wallet', {
        error: error instanceof Error ? error.message : 'Unknown error',
        isMobile: isMobileWallet,
      });
      return false;
    } finally {
      setMobileState(prev => ({ ...prev, isConnecting: false }));
    }
  }, [isMobileWallet, mobileState.isConnecting, connectWallet, reauthorizeWallet]);

  // Disconnect from wallet
  const disconnect = useCallback(async (): Promise<void> => {
    try {
      if (isMobileWallet && mobileState.authToken) {
        await disconnectWallet(mobileState.authToken);
        setMobileState({
          publicKey: null,
          authToken: null,
          walletLabel: null,
          isConnecting: false,
        });
        localStorage.removeItem('solana-mobile-auth-token');
        log.info('Mobile wallet disconnected');
      }
    } catch (error) {
      log.error('Failed to disconnect wallet', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, [isMobileWallet, mobileState.authToken, disconnectWallet]);

  // Sign a transaction
  const signTransaction = useCallback(async (
    transaction: Transaction | VersionedTransaction
  ): Promise<Transaction | VersionedTransaction | null> => {
    if (!activePublicKey) {
      log.warn('Cannot sign transaction: wallet not connected');
      return null;
    }

    if (isMobileWallet && mobileState.authToken) {
      const result = await signTransactionWithMobileWallet(transaction, mobileState.authToken);
      return result?.signedTransaction || null;
    }

    // For standard wallets, use the existing wallet adapter
    // This would typically be handled by the wallet adapter's signTransaction method
    log.warn('Standard wallet transaction signing not implemented in this hook');
    return null;
  }, [activePublicKey, isMobileWallet, mobileState.authToken]);

  // Sign and send a transaction
  const signAndSendTransaction = useCallback(async (
    transaction: Transaction | VersionedTransaction
  ): Promise<TransactionResult> => {
    if (!activePublicKey) {
      return {
        signature: '',
        success: false,
        error: 'Wallet not connected',
      };
    }

    if (isMobileWallet && mobileState.authToken) {
      return await signAndSendTransactionWithMobileWallet(transaction, mobileState.authToken);
    }

    return {
      signature: '',
      success: false,
      error: 'Standard wallet transaction sending not supported in this hook',
    };
  }, [activePublicKey, isMobileWallet, mobileState.authToken]);

  // Sign multiple transactions
  const signMultipleTransactions = useCallback(async (
    transactions: (Transaction | VersionedTransaction)[]
  ): Promise<(Transaction | VersionedTransaction)[] | null> => {
    if (!activePublicKey) {
      log.warn('Cannot sign transactions: wallet not connected');
      return null;
    }

    if (isMobileWallet && mobileState.authToken) {
      return await signMultipleTransactionsWithMobileWallet(transactions, mobileState.authToken);
    }

    log.warn('Standard wallet multiple transaction signing not implemented in this hook');
    return null;
  }, [activePublicKey, isMobileWallet, mobileState.authToken]);

  // Sign a message
  const signMessage = useCallback(async (message: Uint8Array): Promise<Uint8Array | null> => {
    if (!activePublicKey) {
      log.warn('Cannot sign message: wallet not connected');
      return null;
    }

    if (isMobileWallet && mobileState.authToken) {
      return await signMessageWithMobileWallet(message, activePublicKey, mobileState.authToken);
    }

    log.warn('Standard wallet message signing not implemented in this hook');
    return null;
  }, [activePublicKey, isMobileWallet, mobileState.authToken]);

  // Auto-connect on mount if we have a stored auth token
  useEffect(() => {
    if (isMobileWallet && !isConnected && !mobileState.isConnecting) {
      const storedAuthToken = localStorage.getItem('solana-mobile-auth-token');
      if (storedAuthToken) {
        connect();
      }
    }
  }, [isMobileWallet, isConnected, mobileState.isConnecting, connect]);

  return {
    // State
    isConnected,
    publicKey: activePublicKey,
    authToken: mobileState.authToken,
    walletLabel: mobileState.walletLabel,
    isMobileWallet,
    isConnecting: mobileState.isConnecting,
    
    // Actions
    connect,
    disconnect,
    signTransaction,
    signAndSendTransaction,
    signMultipleTransactions,
    signMessage,
  };
}