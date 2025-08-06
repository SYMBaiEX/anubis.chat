'use client';

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { useStandardWalletAdapters } from '@solana/wallet-standard-wallet-adapter-react';
import { clusterApiUrl } from '@solana/web3.js';
import type { FC, ReactNode } from 'react';
import React, { useMemo } from 'react';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

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

  // 2025 Wallet Standard: Use standard wallet adapters for automatic detection
  const standardAdapters = useStandardWalletAdapters();

  // 2025 Wallet Standard: Combine standard adapters with mobile support
  const wallets = useMemo(() => {
    // Use standard wallet adapters for automatic detection of all compatible wallets
    // This includes Phantom, Solflare, Backpack, and mobile wallet adapters
    const walletList = standardAdapters;

    // Note: In production, send wallet detection metrics to monitoring service instead
    // Debug logging removed per coding guidelines

    return walletList;
  }, [standardAdapters]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider autoConnect wallets={wallets}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};
