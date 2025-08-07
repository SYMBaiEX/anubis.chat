'use client';
import { useAuthContext } from '@/components/providers/auth-provider';
import { useWallet } from '@/hooks/useWallet';
import { ChatInterface } from '@/components/chat/chat-interface';
import { RosettaHieroglyphs } from '@/components/effects/rosetta-hieroglyphs';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/data/empty-states';
import { MessageSquare, Wallet } from 'lucide-react';

export default function Home() {
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

  // Show chat interface if authenticated
  if (isAuthenticated && user) {
    return <ChatInterface />;
  }

  // Show welcome/login screen
  return (
    <>
      <RosettaHieroglyphs />
      <div className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <MessageSquare className="h-10 w-10 text-primary" />
            </div>
            <h1 className="mb-2 font-bold text-3xl tracking-tight">ISIS Chat</h1>
            <p className="text-muted-foreground">
              Modern AI chat with Solana blockchain capabilities
            </p>
          </div>

          {/* Auth Error Display */}
          {authError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
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

          {/* Authentication Flow */}
          <div className="space-y-4 rounded-lg border bg-card p-6">
            {!isConnected ? (
              <EmptyState
                action={{
                  label: "Connect Wallet",
                  onClick: connectWallet,
                }}
                description="Connect your Solana wallet to access AI chat with blockchain capabilities"
                icon={<Wallet className="h-12 w-12 text-muted-foreground" />}
                title="Connect Your Wallet"
              />
            ) : (
              <div className="space-y-4">
                {/* Wallet Connected */}
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                    <Wallet className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Wallet Connected</p>
                    <p className="text-muted-foreground text-xs">
                      {formatAddress(6)} • {balance?.toFixed(4)} SOL
                    </p>
                  </div>
                </div>

                {/* Sign In Button */}
                <Button
                  className="w-full"
                  disabled={authLoading}
                  onClick={login}
                  size="lg"
                >
                  {authLoading ? 'Authenticating...' : 'Sign In to Chat'}
                </Button>
              </div>
            )}
          </div>

          {/* Features */}
          <div className="space-y-3 text-center text-sm text-muted-foreground">
            <p className="font-medium">Features:</p>
            <ul className="space-y-1 text-xs">
              <li>• AI-powered conversations with multiple models</li>
              <li>• Solana blockchain operations and trading</li>
              <li>• DeFi management and portfolio tracking</li>
              <li>• NFT creation and marketplace interactions</li>
              <li>• Voice input and file sharing</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
