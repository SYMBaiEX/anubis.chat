'use client';

import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { ConvexErrorBoundary } from './error/ConvexErrorBoundary';
import { AuthProvider } from './providers/auth-provider';
import { SolanaAgentProvider } from './providers/solana-agent-provider';
import { ThemeProvider } from './theme-provider';
import { Toaster } from './ui/sonner';
import { WalletProvider } from './wallet/wallet-provider';

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!, {
  // Enable verbose logging in development
  verbose: process.env.NODE_ENV === 'development',
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConvexErrorBoundary
      onError={(error, errorInfo) => {
        // Log to error tracking service in production
        console.error('Convex Error:', error, errorInfo);
      }}
      showDetails={process.env.NODE_ENV === 'development'}
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        disableTransitionOnChange
        enableSystem
      >
        <ConvexProvider client={convex}>
          <WalletProvider>
            <AuthProvider>
              <SolanaAgentProvider>
                {children}
              </SolanaAgentProvider>
            </AuthProvider>
          </WalletProvider>
        </ConvexProvider>
        <Toaster richColors />
      </ThemeProvider>
    </ConvexErrorBoundary>
  );
}
