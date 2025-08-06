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
  network = WalletAdapterNetwork.Devnet,
}) => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // 2025 Wallet Standard: Use standard wallet adapters for automatic detection
  const standardAdapters = useStandardWalletAdapters();

  // 2025 Wallet Standard: Combine standard adapters with mobile support
  const wallets = useMemo(() => {
    // Use standard wallet adapters for automatic detection of all compatible wallets
    // This includes Phantom, Solflare, Backpack, and mobile wallet adapters
    const walletList = standardAdapters;

    // Debug: Log wallet standard configuration (August 2025)
    console.log('🔗 Using Wallet Standard for automatic wallet detection');
    console.log('📱 Mobile Wallet Adapter support enabled');
    console.log(
      '🔍 Detected wallets:',
      walletList.length,
      'standard-compliant adapters'
    );

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
