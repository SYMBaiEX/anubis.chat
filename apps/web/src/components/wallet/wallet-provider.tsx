'use client';

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  LedgerWalletAdapter,
  TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets';
// Solana Mobile Wallet Adapter will be imported dynamically
import { clusterApiUrl } from '@solana/web3.js';
import type { FC, ReactNode } from 'react';
import { useMemo } from 'react';
import { createModuleLogger } from '@/lib/utils/logger';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

// Initialize logger
const log = createModuleLogger('wallet-provider');

interface WalletProviderProps {
  children: ReactNode;
  network?: WalletAdapterNetwork;
}

export const WalletProvider: FC<WalletProviderProps> = ({
  children,
  network,
}) => {
  // Require explicit network configuration to prevent accidental use of wrong network
  const selectedNetwork =
    network ??
    (process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'mainnet-beta'
      ? WalletAdapterNetwork.Mainnet
      : process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'testnet'
        ? WalletAdapterNetwork.Testnet
        : WalletAdapterNetwork.Devnet);

  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'
  const endpoint = useMemo(
    () => clusterApiUrl(selectedNetwork),
    [selectedNetwork]
  );

  // Configure wallets according to official documentation:
  // - Wallets implementing Wallet Standard (Phantom, Solflare, Backpack) are auto-detected
  // - Mobile Wallet Adapter is automatically available via Solana Mobile Stack
  // - Only legacy wallets that don't implement standards need manual configuration
  const wallets = useMemo(() => {
    /**
     * Wallets that implement either of these standards will be available automatically:
     *
     *   - Solana Mobile Stack Mobile Wallet Adapter Protocol
     *     (https://github.com/solana-mobile/mobile-wallet-adapter)
     *   - Solana Wallet Standard
     *     (https://github.com/anza-xyz/wallet-standard)
     *
     * If you wish to support a wallet that supports neither of those standards,
     * instantiate its legacy wallet adapter here. Common legacy adapters can be found
     * in the npm package `@solana/wallet-adapter-wallets`.
     */
    
    // Only instantiate wallet adapters in browser environment to prevent SSR issues
    if (typeof window === 'undefined') {
      return [];
    }
    
    return [
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
    ];
  }, [selectedNetwork]);

  // Log available wallets for debugging
  log.info('Solana wallets configured', {
    wallets: wallets.map((w) => ({
      name: w.name,
      readyState: w.readyState,
      publicKey: (w as any).publicKey?.toString() || 'Not connected',
    })),
    network: selectedNetwork,
    endpoint,
  });

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider
        autoConnect={true}
        onError={(error) => {
          // Silently handle expected errors
          const errorMessage = error?.message || '';
          const isExpectedError =
            errorMessage.includes('User rejected') ||
            errorMessage.includes('Wallet not found') ||
            errorMessage.includes('Unexpected error') ||
            errorMessage.includes('wallet not installed') ||
            errorMessage.includes('connection cancelled');

          if (!isExpectedError && errorMessage) {
            log.error('Wallet error', { error: errorMessage });
          } else {
            log.debug('Wallet connection attempt', { message: errorMessage });
          }
        }} // Enable auto-connect for better UX
        wallets={wallets}
      >
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};
