'use client';

import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

export function WalletConnectButton() {
  const { isConnected, isConnecting, formatAddress, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  const handleClick = () => {
    if (isConnected) {
      disconnect();
    } else {
      setVisible(true);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isConnecting}
      variant="outline"
      size="sm"
      className="border-2 hover:border-primary transition-colors"
    >
      <Wallet className="mr-2 h-4 w-4" />
      {isConnecting
        ? 'Connecting...'
        : isConnected
        ? formatAddress()
        : 'Connect Wallet'}
    </Button>
  );
}