'use client';

import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { ConvexErrorBoundary } from './error/ConvexErrorBoundary';
import { AuthProvider } from './providers/auth-provider';
import { SolanaAgentProvider } from './providers/solana-agent-provider';
import { ThemeProvider } from './theme-provider';
import { Toaster } from './ui/sonner';
import { WalletProvider } from './wallet/wallet-provider';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('providers');

const convexUrl = (process.env.NEXT_PUBLIC_CONVEX_URL || '').replace(/\/+$/, '');
if (!convexUrl) {
  throw new Error('NEXT_PUBLIC_CONVEX_URL environment variable is required');
}
const convex = new ConvexReactClient(convexUrl, {
  // Enable verbose logging in development
  verbose: process.env.NODE_ENV === 'development',
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConvexErrorBoundary
      onError={(error, errorInfo) => {
        // Log to error tracking service in production
        log.error('Convex Error caught', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          errorInfo,
          operation: 'convex_error_boundary'
        });
      }}
      showDetails={process.env.NODE_ENV === 'development'}
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        disableTransitionOnChange
        enableSystem
      >
        <SidebarProvider>
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
        </SidebarProvider>
      </ThemeProvider>
    </ConvexErrorBoundary>
  );
}
