'use client';

import { ConvexReactClient } from 'convex/react';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { convexConfig, isDevelopment } from '@/lib/env';
import { createModuleLogger } from '@/lib/utils/logger';
import { ConvexErrorBoundary } from './error/ConvexErrorBoundary';
import { AuthProvider } from './providers/auth-provider';
import { ClientOnlyWrapper } from './providers/client-only-wrapper';
import { SolanaAgentProvider } from './providers/solana-agent-provider';
import { ThemeProvider } from './theme-provider';
import { Toaster } from './ui/sonner';
import { WalletProvider } from './wallet/wallet-provider';
import { UpgradeProvider } from './auth/upgrade-wrapper';

const log = createModuleLogger('providers');

if (!convexConfig.publicUrl) {
  throw new Error('NEXT_PUBLIC_CONVEX_URL environment variable is required');
}
const convex = new ConvexReactClient(convexConfig.publicUrl, {
  // Enable verbose logging in development
  verbose: isDevelopment,
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
          operation: 'convex_error_boundary',
        });
      }}
      showDetails={isDevelopment}
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        disableTransitionOnChange
        enableSystem
      >
        <SidebarProvider>
          <ConvexAuthProvider client={convex}>
            <ClientOnlyWrapper>
              <WalletProvider>
                <AuthProvider>
                  <UpgradeProvider>
                    <SolanaAgentProvider>{children}</SolanaAgentProvider>
                  </UpgradeProvider>
                </AuthProvider>
              </WalletProvider>
            </ClientOnlyWrapper>
          </ConvexAuthProvider>
          <Toaster richColors />
        </SidebarProvider>
      </ThemeProvider>
    </ConvexErrorBoundary>
  );
}
