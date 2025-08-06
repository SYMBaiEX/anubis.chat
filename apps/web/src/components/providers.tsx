'use client';

import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { AuthProvider } from './providers/auth-provider';
import { ThemeProvider } from './theme-provider';
import { Toaster } from './ui/sonner';
import { WalletProvider } from './wallet/wallet-provider';

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
      enableSystem
    >
      <ConvexProvider client={convex}>
        <WalletProvider>
          <AuthProvider>{children}</AuthProvider>
        </WalletProvider>
      </ConvexProvider>
      <Toaster richColors />
    </ThemeProvider>
  );
}
