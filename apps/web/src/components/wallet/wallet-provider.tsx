'use client';

<<<<<<< HEAD
=======
import { BackpackWalletAdapter } from '@solana/wallet-adapter-backpack';
>>>>>>> upstream/main
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
<<<<<<< HEAD
import { BackpackWalletAdapter } from '@solana/wallet-adapter-backpack';
import { useStandardWalletAdapters } from '@solana/wallet-standard-wallet-adapter-react';
import { clusterApiUrl } from '@solana/web3.js';
import type { FC, ReactNode } from 'react';
import React, { useMemo } from 'react';
=======
import { clusterApiUrl } from '@solana/web3.js';
import type { FC, ReactNode } from 'react';
import React, { useMemo } from 'react';
import { createModuleLogger } from '@/lib/utils/logger';
>>>>>>> upstream/main

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
<<<<<<< HEAD
  network,
=======
  network = WalletAdapterNetwork.Devnet,
>>>>>>> upstream/main
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
  const standardAdapters = useStandardWalletAdapters([]);

  // 2025 Wallet Standard: Combine standard adapters with explicit wallet support
  const wallets = useMemo(() => {
    // Include both standard adapters and explicit wallet adapters
    // This ensures maximum compatibility
    const explicitWallets = [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network: selectedNetwork }),
      new BackpackWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
    ];
<<<<<<< HEAD
    
    // Combine standard and explicit adapters, avoiding duplicates
    const walletMap = new Map();
    
    // Add standard adapters first
    standardAdapters.forEach(adapter => {
      walletMap.set(adapter.name, adapter);
    });
    
    // Add explicit adapters (will override if duplicate)
    explicitWallets.forEach(adapter => {
      walletMap.set(adapter.name, adapter);
    });
    
    return Array.from(walletMap.values());
  }, [standardAdapters, selectedNetwork]);
=======

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
>>>>>>> upstream/main

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider autoConnect wallets={wallets}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};
