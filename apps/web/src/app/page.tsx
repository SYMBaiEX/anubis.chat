'use client';
import { api } from '@isis-chat/backend/convex/_generated/api';
import { useQuery } from 'convex/react';
import { RosettaHieroglyphs } from '@/components/effects/rosetta-hieroglyphs';
import { useWallet } from '@/hooks/useWallet';

export default function Home() {
  const healthCheck = useQuery(api.healthCheck.get);
  const { isConnected, publicKey, balance, formatAddress } = useWallet();

  return (
    <>
      <RosettaHieroglyphs />
      <div className="container mx-auto max-w-6xl px-4 py-12 relative z-10">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-light mb-4 tracking-wider">
            ISIS CHAT
          </h1>
          <p className="text-xl text-muted-foreground">
            Ancient wisdom meets modern technology
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* API Status Card */}
          <section className="rounded-lg border-2 border-border hover:border-primary transition-colors p-6 bg-card">
            <h2 className="mb-4 text-lg font-medium">System Status</h2>
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

          {/* Wallet Status Card */}
          <section className="rounded-lg border-2 border-border hover:border-primary transition-colors p-6 bg-card">
            <h2 className="mb-4 text-lg font-medium">Wallet Connection</h2>
            {isConnected && publicKey ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-primary shadow-[0_0_10px_rgba(96,165,250,0.5)]" />
                  <span className="text-muted-foreground">Connected</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Address: {formatAddress(6)}
                </p>
                {balance !== null && (
                  <p className="text-sm text-muted-foreground">
                    Balance: {balance.toFixed(4)} SOL
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-muted" />
                <span className="text-muted-foreground">
                  No wallet connected
                </span>
              </div>
            )}
          </section>
        </div>

        {/* Welcome Message */}
        <div className="mt-16 text-center max-w-2xl mx-auto">
          <p className="text-lg text-muted-foreground leading-relaxed">
            Welcome to ISIS Chat, where ancient Egyptian mystique meets cutting-edge AI 
            and blockchain technology. Connect your Solana wallet to unlock the full 
            potential of decentralized communication.
          </p>
        </div>
      </div>
    </>
  );
}