'use client';

import React, { useState } from 'react';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { useWallet } from '@/hooks/useWallet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Loader from '@/components/loader';

interface WalletInfo {
  name: string;
  icon: string;
  adapter: any;
}

interface WalletModalProps {
  open: boolean;
  onClose: () => void;
}

export function WalletModal({ open, onClose }: WalletModalProps) {
  const { wallets, select } = useSolanaWallet();
  const { connect, isConnecting, error } = useWallet();
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  const handleWalletSelect = async (walletName: string) => {
    try {
      setSelectedWallet(walletName);
      const wallet = wallets.find(w => w.adapter.name === walletName);
      if (wallet) {
        select(wallet.adapter.name);
        await connect();
        onClose();
      }
    } catch (err) {
      console.error('Failed to connect wallet:', err);
    } finally {
      setSelectedWallet(null);
    }
  };

  const supportedWallets: WalletInfo[] = [
    {
      name: 'Phantom',
      icon: 'https://phantom.app/img/phantom-logo.png',
      adapter: wallets.find(w => w.adapter.name === 'Phantom')?.adapter
    },
    {
      name: 'Backpack',
      icon: 'https://backpack.app/backpack.png',
      adapter: wallets.find(w => w.adapter.name === 'Backpack')?.adapter
    },
    {
      name: 'Solflare',
      icon: 'https://solflare.com/img/logo.svg',
      adapter: wallets.find(w => w.adapter.name === 'Solflare')?.adapter
    },
    {
      name: 'Torus',
      icon: 'https://tor.us/img/favicon.png',
      adapter: wallets.find(w => w.adapter.name === 'Torus')?.adapter
    },
    {
      name: 'Ledger',
      icon: 'https://www.ledger.com/favicon.ico',
      adapter: wallets.find(w => w.adapter.name === 'Ledger')?.adapter
    }
  ].filter(wallet => wallet.adapter);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle 
            className="text-center"
            style={{
              background: 'linear-gradient(135deg, #FFD700 0%, #14F195 50%, #FFD700 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Connect Your Solana Wallet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-center text-sm text-amber-200/80">
            Choose your preferred wallet to connect to isis.chat
          </p>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="grid gap-3">
            {supportedWallets.map((wallet) => (
              <Card 
                key={wallet.name}
                className="cursor-pointer transition-all hover:bg-amber-600/5 border-amber-600/20"
                onClick={() => handleWalletSelect(wallet.name)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={wallet.icon}
                      alt={`${wallet.name} icon`}
                      className="w-8 h-8 rounded"
                      onError={(e) => {
                        e.currentTarget.src = '/favicon/favicon.svg';
                      }}
                    />
                    <div>
                      <p className="font-medium text-amber-200">{wallet.name}</p>
                      <p className="text-xs text-amber-200/60">
                        {wallet.adapter?.readyState === 'Installed' ? 'Installed' : 'Not Installed'}
                      </p>
                    </div>
                  </div>
                  
                  {selectedWallet === wallet.name && isConnecting ? (
                    <Loader className="h-4 w-4" />
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-amber-600/30 text-amber-200 hover:bg-amber-600/10"
                    >
                      Connect
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="pt-4 border-t border-amber-600/20">
            <p className="text-xs text-center text-amber-200/60">
              New to Solana wallets?{' '}
              <a
                href="https://phantom.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#14F195] hover:underline"
              >
                Download Phantom
              </a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}