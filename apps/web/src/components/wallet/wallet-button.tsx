'use client';

import React from 'react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/button';
import Loader from '@/components/loader';

interface WalletButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'sm' | 'default' | 'lg';
}

export function WalletButton({ 
  className,
  variant = 'default',
  size = 'default'
}: WalletButtonProps) {
  const { setVisible } = useWalletModal();
  const { 
    isConnected, 
    isConnecting, 
    publicKey, 
    balance, 
    formatAddress,
    disconnect 
  } = useWallet();

  const handleClick = () => {
    if (isConnected) {
      disconnect();
    } else {
      setVisible(true);
    }
  };

  if (isConnected && publicKey) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-sm font-medium text-foreground">
            {formatAddress()}
          </div>
          {balance !== null && (
            <div className="text-xs text-muted-foreground">
              {balance.toFixed(4)} SOL
            </div>
          )}
        </div>
        <Button
          onClick={handleClick}
          variant={variant}
          size={size}
          className={`${className} bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20 hover:border-destructive/40 transition-all duration-300`}
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isConnecting}
      variant={variant}
      size={size}
      className={`${className} bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 hover:border-primary/50 transition-all duration-300 font-medium`}
    >
      {isConnecting ? (
        <>
          <Loader className="mr-2 h-4 w-4" />
          Connecting...
        </>
      ) : (
        'Connect Wallet'
      )}
    </Button>
  );
}