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

  // Only include wallets that don't implement the Wallet Standard
  // Phantom, Solflare, and Backpack are now auto-detected via Wallet Standard
  const wallets = useMemo(() => {
    const configured = [
      // Only include wallets that aren't auto-detected via Wallet Standard
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
    ];

    // Filter out any duplicates and MetaMask
    const seen = new Set<string>();
    return configured.filter((w) => {
      const name = String(w.name || '');
      if (name === 'MetaMask') {
        return false;
      }
      if (seen.has(name)) {
        return false;
      }
      seen.add(name);
      return true;
    });
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
