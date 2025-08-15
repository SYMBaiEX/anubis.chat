'use client';

// Polyfills will be imported dynamically when providers initialize

import { ConvexAuthProvider } from '@convex-dev/auth/react';
import { ConvexReactClient } from 'convex/react';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { convexConfig, isDevelopment } from '@/lib/env';
import { createModuleLogger } from '@/lib/utils/logger';
import { UpgradeProvider } from './auth/upgradeWrapper';
import { ConvexErrorBoundary } from './error/ConvexErrorBoundary';
import { AuthProvider } from './providers/auth-provider';
import { ClientOnlyWrapper } from './providers/client-only-wrapper';
import { MilestoneNotificationsProvider } from './providers/milestone-notifications-provider';
import { NotificationProvider } from './providers/notification-provider';
import { SolanaAgentProvider } from './providers/solanaAgentProvider';
import { ThemeSync } from './providers/theme-sync';
import { Toaster } from './ui/sonner';
import { WalletProvider } from './wallet/wallet-provider';

const log = createModuleLogger('providers');

if (!convexConfig.publicUrl) {
  throw new Error('NEXT_PUBLIC_CONVEX_URL environment variable is required');
}
const convex = new ConvexReactClient(convexConfig.publicUrl, {
  // Enable verbose logging in development
  verbose: isDevelopment,
});

export default function Providers({ children }: { children: React.ReactNode }) {
  // Import polyfills for browser environment
  // if (typeof window !== 'undefined') {
  //   import('@/lib/polyfills').catch(() => {
  //     // Silently fail if polyfills can't be loaded
  //   });
  // }

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
      <SidebarProvider>
        <ConvexAuthProvider client={convex}>
          <ClientOnlyWrapper>
            <WalletProvider>
              <AuthProvider>
                <ThemeSync />
                <NotificationProvider>
                  <MilestoneNotificationsProvider>
                    <UpgradeProvider>
                      <SolanaAgentProvider>
                        {children}
                      </SolanaAgentProvider>
                    </UpgradeProvider>
                  </MilestoneNotificationsProvider>
                </NotificationProvider>
              </AuthProvider>
            </WalletProvider>
          </ClientOnlyWrapper>
        </ConvexAuthProvider>
        <Toaster richColors />
      </SidebarProvider>
    </ConvexErrorBoundary>
  );
}
