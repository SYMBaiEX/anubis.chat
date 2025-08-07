'use client';

import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/useWallet';

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
      className="border-2 transition-colors hover:border-primary"
      disabled={isConnecting}
      onClick={handleClick}
      size="sm"
      variant="outline"
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
