'use client';

import { BackpackWalletAdapter } from '@solana/wallet-adapter-backpack';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  LedgerWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import type { FC, ReactNode } from 'react';
import React, { useMemo } from 'react';
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
  network = WalletAdapterNetwork.Devnet,
}) => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // Configure supported wallets
  const wallets = useMemo(() => {
    const walletList = [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      new BackpackWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
    ];

    // Log available wallets for debugging
    log.info('Solana wallets configured', {
      wallets: walletList.map((w) => ({
        name: w.name,
        readyState: w.readyState,
        publicKey: w.publicKey?.toString() || 'Not connected',
      })),
      network,
      endpoint,
    });

    return walletList;
  }, [network]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider autoConnect wallets={wallets}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};
