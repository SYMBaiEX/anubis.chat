'use client';

import { useEffect } from 'react';
import { useAuthContext } from '@/components/providers/auth-provider';
import { useWallet } from '@/hooks/useWallet';
import { useRouter, useSearchParams } from 'next/navigation';
import { RosettaHieroglyphs } from '@/components/effects/rosetta-hieroglyphs';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/data/empty-states';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Wallet, 
  ArrowLeft, 
  Shield, 
  Zap, 
  Lock,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Coins,
  Cpu,
  Globe,
  Bot
} from 'lucide-react';
import Link from 'next/link';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    isConnected,
    publicKey,
    balance,
    formatAddress,
    connect: connectWallet,
  } = useWallet();
  const {
    isAuthenticated,
    isLoading: authLoading,
    user,
    error: authError,
    login,
    clearError,
  } = useAuthContext();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const next = searchParams?.get('next');
      const dest = next && next.startsWith('/') ? next : '/dashboard';
      router.push(dest);
    }
  }, [isAuthenticated, user, router, searchParams]);

  // The auth-provider handles auto-login, so we don't need to do it here
  // This prevents race conditions and duplicate login attempts

  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <RosettaHieroglyphs />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-background pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:radial-gradient(white,transparent_70%)]" />
      
      <div className="relative flex min-h-screen flex-col items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Back Button */}
          <Link href="/">
            <Button variant="ghost" size="sm" className="button-press">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>

          {/* Header */}
          <div className="text-center">
            <div className="mx-auto mb-6 relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 mx-auto">
                <Sparkles className="h-12 w-12 text-primary" />
              </div>
              <div className="absolute inset-0 h-24 w-24 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 blur-xl opacity-50 mx-auto" />
            </div>
            <h1 className="mb-3 font-bold text-4xl tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Welcome to ISIS Chat
            </h1>
            <p className="text-muted-foreground text-lg">
              Connect your wallet to unlock AI-powered Web3
            </p>
          </div>

          {/* Auth Error Display */}
          {authError && (
            <Card className="border-destructive/50 bg-destructive/10 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">
                    Authentication Error
                  </p>
                  <p className="text-sm text-destructive/80 mt-1">
                    {authError}
                  </p>
                  <Button
                    className="mt-3"
                    onClick={clearError}
                    size="sm"
                    variant="outline"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Authentication Flow */}
          <Card className="p-8 bg-card/50 backdrop-blur border-border/50 shadow-xl">
            {!isConnected ? (
              <div className="space-y-6">
                <EmptyState
                  action={{
                    label: "Connect Wallet",
                    onClick: connectWallet,
                  }}
                  description="Connect your Solana wallet to get started"
                  icon={<Wallet className="h-12 w-12 text-muted-foreground" />}
                  title="Connect Your Wallet"
                />
                
                <div className="pt-6 border-t border-border/50">
                  <p className="font-medium text-sm text-center mb-4">Why wallet authentication?</p>
                  <div className="grid gap-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <Shield className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium">No Passwords</p>
                        <p className="text-xs text-muted-foreground">Secure wallet-based auth</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <Lock className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium">Cryptographic Security</p>
                        <p className="text-xs text-muted-foreground">Military-grade encryption</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <Zap className="h-4 w-4 text-purple-500" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium">Instant Access</p>
                        <p className="text-xs text-muted-foreground">Direct Web3 integration</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Wallet Connected Status */}
                <div className="rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                          <Wallet className="h-6 w-6 text-green-500" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-background">
                          <CheckCircle className="h-3 w-3 text-white" />
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-sm flex items-center gap-2">
                          Wallet Connected
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20" variant="outline">
                            Active
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-xs font-mono">
                          {formatAddress(8)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Balance</p>
                      <p className="font-bold flex items-center gap-1">
                        <Coins className="h-4 w-4 text-yellow-500" />
                        {balance?.toFixed(3)} SOL
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sign In Button or Loading State */}
                {authLoading ? (
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span className="text-sm text-muted-foreground">Authenticating...</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Please approve the signature request in your wallet
                    </p>
                  </div>
                ) : (
                  <>
                    <Button
                      className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 button-press"
                      onClick={login}
                      size="lg"
                    >
                      <Shield className="h-5 w-5 mr-2" />
                      Sign In with Wallet
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      By signing in, you agree to our Terms of Service and Privacy Policy
                    </p>
                  </>
                )}
              </div>
            )}
          </Card>

          {/* Features List */}
          <Card className="p-6 bg-card/30 backdrop-blur border-border/50">
            <h3 className="font-semibold text-center mb-4 flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              What you'll unlock
            </h3>
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-medium">Multi-Model AI</p>
                  <p className="text-xs text-muted-foreground">Claude, GPT-4, DeepSeek & more</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Globe className="h-4 w-4 text-accent" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-medium">Blockchain Integration</p>
                  <p className="text-xs text-muted-foreground">Direct Solana interactions</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-chart-1/10">
                  <Cpu className="h-4 w-4 text-chart-1" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-medium">Custom AI Agents</p>
                  <p className="text-xs text-muted-foreground">Automated trading & DeFi</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Protected by Solana blockchain • Powered by ISIS Intelligence
          </p>
        </div>
      </div>
    </div>
  );
}