'use client';
import { api } from '@isis-chat/backend/convex/_generated/api';
import { useQuery } from 'convex/react';
import { RosettaHieroglyphs } from '@/components/effects/rosetta-hieroglyphs';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/useWallet';

export default function Home() {
  const healthCheck = useQuery(api.healthCheck.get);
  const {
    isConnected,
    publicKey,
    balance,
    formatAddress,
    connect: connectWallet,
    disconnect: disconnectWallet,
  } = useWallet();
  const {
    isAuthenticated,
    isLoading: authLoading,
    user,
    error: authError,
    login,
    logout,
    clearError,
  } = useAuthContext();

  return (
    <>
      <RosettaHieroglyphs />
      <div className="container relative z-10 mx-auto max-w-6xl px-4 py-12">
        <div className="mb-16 text-center">
          <h1 className="mb-4 font-light text-6xl tracking-wider">ISIS CHAT</h1>
          <p className="text-muted-foreground text-xl">
            Ancient wisdom meets modern technology
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* API Status Card */}
          <section className="rounded-lg border-2 border-border bg-card p-6 transition-colors hover:border-primary">
            <h2 className="mb-4 font-medium text-lg">System Status</h2>
            <div className="flex items-center gap-3">
              <div
                className={`h-3 w-3 rounded-full ${
                  healthCheck === 'OK'
                    ? 'bg-primary shadow-[0_0_10px_rgba(96,165,250,0.5)]'
                    : healthCheck === undefined
                      ? 'bg-orange-400'
                      : 'bg-red-500'
                }`}
              />
              <span className="text-muted-foreground">
                {healthCheck === undefined
                  ? 'Initializing...'
                  : healthCheck === 'OK'
                    ? 'System operational'
                    : 'Connection error'}
              </span>
            </div>
          </section>

          {/* Wallet & Auth Status Card */}
          <section className="rounded-lg border-2 border-border bg-card p-6 transition-colors hover:border-primary">
            <h2 className="mb-4 font-medium text-lg">
              Wallet & Authentication
            </h2>

            {/* Auth Error Display */}
            {authError && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                <p className="text-red-600 text-sm dark:text-red-400">
                  {authError}
                </p>
                <Button
                  className="mt-2 text-red-600 dark:text-red-400"
                  onClick={clearError}
                  size="sm"
                  variant="ghost"
                >
                  Clear Error
                </Button>
              </div>
            )}

            <div className="space-y-4">
              {/* Wallet Status */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm">Wallet Connection</h3>
                {isConnected && publicKey ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-primary shadow-[0_0_10px_rgba(96,165,250,0.5)]" />
                      <span className="text-muted-foreground">Connected</span>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Address: {formatAddress(6)}
                    </p>
                    {balance !== null && (
                      <p className="text-muted-foreground text-sm">
                        Balance: {balance.toFixed(4)} SOL
                      </p>
                    )}
                    <Button
                      className="mt-2"
                      onClick={disconnectWallet}
                      size="sm"
                      variant="outline"
                    >
                      Disconnect Wallet
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-muted" />
                      <span className="text-muted-foreground">
                        No wallet connected
                      </span>
                    </div>
                    <Button
                      className="mt-2"
                      onClick={connectWallet}
                      size="sm"
                      variant="default"
                    >
                      Connect Wallet
                    </Button>
                  </div>
                )}
              </div>

              {/* Authentication Status */}
              <div className="space-y-2 border-t pt-4">
                <h3 className="font-medium text-sm">Authentication</h3>
                {isAuthenticated && user ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-400 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                      <span className="text-muted-foreground">
                        Authenticated
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      User: {user.displayName ?? formatAddress(6)}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Subscription: {user.subscription.tier}
                    </p>
                    <Button
                      className="mt-2"
                      disabled={authLoading}
                      onClick={logout}
                      size="sm"
                      variant="outline"
                    >
                      {authLoading ? 'Logging out...' : 'Logout'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-muted" />
                      <span className="text-muted-foreground">
                        Not authenticated
                      </span>
                    </div>
                    {isConnected ? (
                      <Button
                        className="mt-2"
                        disabled={authLoading}
                        onClick={login}
                        size="sm"
                        variant="default"
                      >
                        {authLoading
                          ? 'Authenticating...'
                          : 'Sign In with Wallet'}
                      </Button>
                    ) : (
                      <p className="text-muted-foreground text-xs">
                        Connect wallet to authenticate
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Welcome Message */}
        <div className="mx-auto mt-16 max-w-2xl text-center">
          <p className="text-lg text-muted-foreground leading-relaxed">
            Welcome to ISIS Chat, where ancient Egyptian mystique meets
            cutting-edge AI and blockchain technology. Connect your Solana
            wallet to unlock the full potential of decentralized communication.
          </p>
        </div>
      </div>
    </>
  );
}
