'use client';

import { ConvexAuthProvider } from '@convex-dev/auth/react';
import { ConvexReactClient } from 'convex/react';
// Forum does not have SidebarContext; render children directly
import { convexConfig, isDevelopment } from '@/lib/env';
import { createModuleLogger } from '@/lib/utils/logger';
// For forum, omit UpgradeProvider or import from web if shared via a package.
// Forum does not ship a custom ConvexErrorBoundary; render providers directly
import { AuthProvider } from './providers/auth-provider';
import { ClientOnlyWrapper } from './providers/client-only-wrapper';
import { SolanaAgentProvider } from './providers/solana-agent-provider';
import { ThemeSync } from './providers/theme-sync';
import { Toaster } from './ui/sonner';
import { WalletProvider } from './wallet/wallet-provider';
import { ThemeProvider } from '@/components/theme-provider';

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
    <ConvexAuthProvider client={convex}>
      <ClientOnlyWrapper>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
          storageKey="anubis-theme"
          themes={['light', 'dark']}
       >
          <WalletProvider>
            <AuthProvider>
              <ThemeSync />
              <SolanaAgentProvider>{children}</SolanaAgentProvider>
            </AuthProvider>
          </WalletProvider>
        </ThemeProvider>
      </ClientOnlyWrapper>
      <Toaster richColors />
    </ConvexAuthProvider>
  );
}

