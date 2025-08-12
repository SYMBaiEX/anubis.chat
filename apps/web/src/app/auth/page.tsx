'use client';

import { useAuthActions } from '@convex-dev/auth/react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Authenticated, AuthLoading, Unauthenticated } from 'convex/react';
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  CheckCircle,
  Coins,
  Cpu,
  Globe,
  Lock,
  Shield,
  Sparkles,
  Wallet,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { EmptyState } from '@/components/data/empty-states';
import LandingFooter from '@/components/landing/landing-footer';
import LandingHeader from '@/components/landing/landing-header';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useWallet } from '@/hooks/useWallet';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('auth-page');

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuthActions();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const {
    isConnected,
    publicKey,
    balance,
    formatAddress,
    authenticateWithConvex,
    connect: connectWallet,
    disconnect,
  } = useWallet();
  const { setVisible } = useWalletModal();

  const { isAuthenticated, user } = useAuthContext();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const next = searchParams?.get('next');
      const dest = next?.startsWith('/') ? next : '/dashboard';
      router.push(dest);
    }
  }, [isAuthenticated, user, router, searchParams]);

  // Handle Solana wallet sign-in using Convex Auth
  const handleWalletSignIn = async () => {
    if (!(isConnected && publicKey)) {
      setAuthError('Please connect your wallet first');
      return;
    }

    setIsSigningIn(true);
    setAuthError(null);

    try {
      log.info('Starting Convex Auth sign-in with Solana wallet');

      // Use wallet hook flow to create challenge, sign it, and sign in with all required fields
      await authenticateWithConvex();

      log.info('Convex Auth sign-in successful');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Authentication failed';
      log.error('Convex Auth sign-in failed', { error: errorMessage });
      setAuthError(errorMessage);
    } finally {
      setIsSigningIn(false);
    }
  };

  const clearError = () => {
    setAuthError(null);
  };

  const handleSwitchWallet = async () => {
    try {
      if (isConnected) {
        await disconnect();
      }
      setVisible(true);
    } catch (_e) {
      setAuthError('Unable to switch wallet. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 dark:from-primary/10">
      <LandingHeader />

      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-background" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:radial-gradient(white,transparent_70%)]" />

      <div className="relative z-0 mx-auto min-h-screen w-full px-3 pt-16 pb-10 sm:px-4 md:px-6 lg:pt-24">
        <div className="mx-auto max-w-6xl">
          {/* Mobile Welcome Header - Only visible on mobile */}
          <div className="mb-8 block text-center lg:hidden">
            <div className="relative mx-auto mb-6">
              <div className="absolute inset-0 mx-auto h-24 w-24 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 opacity-50 blur-xl" />
            </div>
            <div className="mb-3 flex flex-row items-center justify-center gap-2.5">
              <span className="text-3xl text-muted-foreground sm:text-3xl">
                Welcome to
              </span>
              <span className="font-extrabold font-heading text-3xl tracking-tight sm:text-3xl">
                <span className="bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text text-transparent">
                  anubis
                </span>
                <span className="text-muted-foreground">.chat</span>
              </span>
            </div>
            <p className="px-4 text-base text-muted-foreground">
              Connect your wallet to unlock AI-powered Web3
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-2">
            {/* Left: Feature/Brand Panel */}
            <div className="order-2 space-y-6 lg:order-1">
              {/* Desktop Welcome Header - Only visible on desktop */}
              <div className="hidden text-center lg:block lg:text-left">
                <div className="relative mx-auto mb-6 lg:mx-0">
                  <div className="absolute inset-0 mx-auto h-24 w-24 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 opacity-50 blur-xl lg:mx-0" />
                </div>
                <div className="mb-3 flex flex-row items-center justify-center gap-3 lg:justify-start">
                  <span className="text-3xl text-muted-foreground xl:text-4xl">
                    Welcome to
                  </span>
                  <span className="font-extrabold font-heading text-2xl tracking-tight xl:text-3xl 2xl:text-4xl">
                    <span className="bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text text-transparent">
                      anubis
                    </span>
                    <span className="text-muted-foreground">.chat</span>
                  </span>
                </div>
                <p className="text-base text-muted-foreground sm:text-lg">
                  Connect your wallet to unlock AI-powered Web3
                </p>
              </div>

              {/* Features List */}
              <Card className="border-border/50 bg-card/30 p-6 backdrop-blur">
                <h3 className="mb-4 flex items-center justify-center gap-2 text-center font-semibold lg:justify-start lg:text-left">
                  <Sparkles className="h-5 w-5 text-primary" />
                  What you'll unlock
                </h3>
                <div className="grid gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-sm">Multi-Model AI</p>
                      <p className="text-muted-foreground text-xs">
                        GPT-5, Gemini 2.5 Pro, Free models & more
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-accent/10 p-2">
                      <Globe className="h-4 w-4 text-accent" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-sm">Web3 Native</p>
                      <p className="text-muted-foreground text-xs">
                        Solana wallet authentication
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-chart-1/10 p-2">
                      <Cpu className="h-4 w-4 text-chart-1" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-sm">Referral Program</p>
                      <p className="text-muted-foreground text-xs">
                        Earn up to 5% commission
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Footer */}
              <div className="text-center lg:text-left">
                <p className="text-muted-foreground text-xs">
                  Protected by Solana blockchain • Powered by Anubis
                  Intelligence
                </p>
              </div>
            </div>

            {/* Right: Auth Panel */}
            <div className="order-1 lg:order-2">
              <div className="mx-auto w-full max-w-md space-y-6">
                {/* Auth Error Display */}
                {authError && (
                  <Card className="border-destructive/50 bg-destructive/10 p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
                      <div className="flex-1">
                        <p className="font-medium text-destructive text-sm">
                          Authentication Error
                        </p>
                        <p className="mt-1 text-destructive/80 text-sm">
                          {authError}
                        </p>
                        <div className="mt-3 flex gap-2">
                          <Button
                            onClick={clearError}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            Try Again
                          </Button>
                          <Button
                            onClick={handleSwitchWallet}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            Switch Wallet
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Authentication Flow */}
                <AuthLoading>
                  <Card className="border-border/50 bg-card/50 p-8 shadow-xl backdrop-blur">
                    <div className="text-center">
                      <div className="inline-flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <span className="text-muted-foreground text-sm">
                          Loading authentication...
                        </span>
                      </div>
                    </div>
                  </Card>
                </AuthLoading>

                <Unauthenticated>
                  <Card className="border-border/50 bg-card/50 p-8 shadow-xl backdrop-blur">
                    {isConnected ? (
                      <div className="space-y-4">
                        {/* Wallet Connected Status */}
                        <div className="rounded-xl border border-green-500/20 bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                                  <Wallet className="h-6 w-6 text-green-500" />
                                </div>
                                <div className="-bottom-1 -right-1 absolute h-4 w-4 rounded-full border-2 border-background bg-green-500">
                                  <CheckCircle className="h-3 w-3 text-white" />
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center gap-2 font-semibold text-sm">
                                  Wallet Connected
                                  <Badge
                                    className="border-green-500/20 bg-green-500/10 text-green-600"
                                    variant="outline"
                                  >
                                    Active
                                  </Badge>
                                </div>
                                <p className="font-mono text-muted-foreground text-xs">
                                  {formatAddress(8)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-muted-foreground text-xs">
                                Balance
                              </p>
                              <p className="flex items-center gap-1 font-bold">
                                <Coins className="h-4 w-4 text-yellow-500" />
                                {balance?.toFixed(3)} SOL
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Sign In Button or Loading State */}
                        {isSigningIn ? (
                          <div className="text-center">
                            <div className="inline-flex items-center gap-2">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                              <span className="text-muted-foreground text-sm">
                                Authenticating with Convex...
                              </span>
                            </div>
                            <p className="mt-2 text-muted-foreground text-xs">
                              Please approve the signature request in your
                              wallet
                            </p>
                          </div>
                        ) : (
                          <>
                            <Button
                              className="button-press w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                              disabled={isSigningIn}
                              onClick={handleWalletSignIn}
                              size="lg"
                              type="button"
                            >
                              <Shield className="mr-2 h-5 w-5" />
                              Sign In with Wallet
                            </Button>
                            <div className="mt-2 text-center">
                              <Button
                                onClick={handleSwitchWallet}
                                size="sm"
                                type="button"
                                variant="outline"
                              >
                                Switch Wallet
                              </Button>
                            </div>
                            <p className="text-center text-muted-foreground text-xs">
                              By signing in, you agree to our Terms of Service
                              and Privacy Policy
                            </p>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <EmptyState
                          action={{
                            label: 'Connect Wallet',
                            onClick: connectWallet,
                          }}
                          description="Connect your Solana wallet to get started"
                          icon={
                            <Wallet className="h-12 w-12 text-muted-foreground" />
                          }
                          title="Connect Your Wallet"
                        />
                        <div className="border-border/50 border-t pt-6">
                          <p className="mb-4 text-center font-medium text-sm">
                            Why wallet authentication?
                          </p>
                          <div className="grid gap-3">
                            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                              <div className="rounded-lg bg-green-500/10 p-2">
                                <Shield className="h-4 w-4 text-green-500" />
                              </div>
                              <div className="text-left">
                                <p className="font-medium text-sm">
                                  No Passwords
                                </p>
                                <p className="text-muted-foreground text-xs">
                                  Secure wallet-based auth
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                              <div className="rounded-lg bg-blue-500/10 p-2">
                                <Lock className="h-4 w-4 text-blue-500" />
                              </div>
                              <div className="text-left">
                                <p className="font-medium text-sm">
                                  Cryptographic Security
                                </p>
                                <p className="text-muted-foreground text-xs">
                                  Military-grade encryption
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                              <div className="rounded-lg bg-purple-500/10 p-2">
                                <Zap className="h-4 w-4 text-purple-500" />
                              </div>
                              <div className="text-left">
                                <p className="font-medium text-sm">
                                  Instant Access
                                </p>
                                <p className="text-muted-foreground text-xs">
                                  Direct Web3 integration
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                </Unauthenticated>

                <Authenticated>
                  <Card className="border-border/50 bg-card/50 p-8 shadow-xl backdrop-blur">
                    <div className="space-y-4 text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          Successfully Authenticated!
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          Redirecting you to the dashboard...
                        </p>
                      </div>
                      <div className="mx-auto h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  </Card>
                </Authenticated>
              </div>
            </div>
          </div>
        </div>
      </div>

      <LandingFooter />
    </div>
  );
}
