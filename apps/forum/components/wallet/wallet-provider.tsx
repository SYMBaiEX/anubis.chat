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

const log = createModuleLogger('wallet-provider');

interface WalletProviderProps {
  children: ReactNode;
  network?: WalletAdapterNetwork;
}

export const WalletProvider: FC<WalletProviderProps> = ({ children, network }) => {
  const selectedNetwork =
    network ??
    (process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'mainnet-beta'
      ? WalletAdapterNetwork.Mainnet
      : process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'testnet'
        ? WalletAdapterNetwork.Testnet
        : WalletAdapterNetwork.Devnet);

  const endpoint = useMemo(() => clusterApiUrl(selectedNetwork), [selectedNetwork]);

  const wallets = useMemo(() => {
    if (typeof window === 'undefined') return [];
    return [new TorusWalletAdapter(), new LedgerWalletAdapter()];
  }, [selectedNetwork]);

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
          const errorMessage = (error as any)?.message || '';
          const isExpectedError =
            errorMessage.includes('User rejected') ||
            errorMessage.includes('Wallet not found') ||
            errorMessage.includes('Unexpected error') ||
            errorMessage.includes('wallet not installed') ||
            errorMessage.includes('connection cancelled');
          if (!isExpectedError && errorMessage) {
            log.error('Wallet error', { error: errorMessage });
          } else if (errorMessage) {
            log.debug('Wallet connection attempt', { message: errorMessage });
          }
        }}
        wallets={wallets}
      >
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};
