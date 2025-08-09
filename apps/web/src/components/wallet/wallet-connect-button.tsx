'use client';

import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/useWallet';

// UI Health Score Threshold
const HEALTH_SCORE_THRESHOLD = 80;

interface WalletConnectButtonProps {
  collapsed?: boolean;
}

export function WalletConnectButton({ collapsed = false }: WalletConnectButtonProps) {
  const {
    isConnected,
    isConnecting,
    formatAddress,
    disconnect,
    error,
    isHealthy,
    connectionHealthScore,
  } = useWallet();
  const { setVisible } = useWalletModal();

  const handleClick = () => {
    if (isConnected) {
      disconnect();
    } else {
      setVisible(true);
    }
  };

  // 2025 UX: Dynamic styling based on connection health
  const getButtonVariant = () => {
    if (!isConnected) return 'outline';
    if (!isHealthy) return 'destructive';
    if (connectionHealthScore < HEALTH_SCORE_THRESHOLD) return 'secondary';
    return 'default';
  };

  const getHealthIndicator = () => {
    if (!isConnected) return null;
    if (!isHealthy) return '🔴';
    if (connectionHealthScore < HEALTH_SCORE_THRESHOLD) return '🟡';
    return '🟢';
  };

  if (collapsed) {
    return (
      <Button
        className="h-10 w-10 border-2 p-0 transition-colors hover:border-primary"
        disabled={isConnecting}
        onClick={handleClick}
        size="icon"
        title={
          isConnected
            ? `${formatAddress()} - Health: ${connectionHealthScore}% ${isHealthy ? '(Good)' : '(Poor)'}`
            : error || 'Connect your Solana wallet'
        }
        variant={getButtonVariant()}
      >
        <Wallet className="h-5 w-5" />
        {getHealthIndicator() && (
          <span className="absolute -top-1 -right-1 text-[10px]">{getHealthIndicator()}</span>
        )}
      </Button>
    );
  }

  return (
    <Button
      className="w-full border-2 transition-colors hover:border-primary"
      disabled={isConnecting}
      onClick={handleClick}
      size="sm"
      title={
        isConnected
          ? `Health: ${connectionHealthScore}% ${isHealthy ? '(Good)' : '(Poor)'}`
          : error || 'Connect your Solana wallet'
      }
      variant={getButtonVariant()}
    >
      <Wallet className="mr-2 h-4 w-4" />
      {getHealthIndicator()}
      {isConnecting
        ? 'Connecting...'
        : isConnected
          ? formatAddress()
          : 'Connect Wallet'}
      {error && !isConnected && (
        <span className="ml-2 text-destructive text-xs">!</span>
      )}
    </Button>
  );
}
