'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

// Dynamically import WalletProvider with SSR disabled to prevent "self is not defined" errors
const WalletProvider = dynamic(
  () =>
    import('./wallet-provider').then((mod) => ({
      default: mod.WalletProvider,
    })),
  {
    ssr: false,
    loading: () => <div>Loading wallet...</div>,
  }
);

interface WalletProviderWrapperProps {
  children: ReactNode;
}

export function WalletProviderWrapper({
  children,
}: WalletProviderWrapperProps) {
  return <WalletProvider>{children}</WalletProvider>;
}
