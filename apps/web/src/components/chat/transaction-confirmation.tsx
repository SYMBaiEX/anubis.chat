'use client';

import {
  AlertTriangle,
  Check,
  CheckCircle,
  Coins,
  Copy,
  ExternalLink,
  Info,
  TrendingUp,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { LoadingStates } from '@/components/data/loading-states';
import {
  type BlockchainTransaction,
  useSolanaAgent,
} from '@/components/providers/solana-agent-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface TransactionConfirmationProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Partial<BlockchainTransaction> & {
    estimatedFee?: number;
    priceImpact?: number;
    estimatedTime?: string;
  };
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

/**
 * TransactionConfirmation component - Preview and confirm blockchain transactions
 * Provides detailed transaction information and risk warnings
 */
export function TransactionConfirmation({
  isOpen,
  onOpenChange,
  transaction,
  onConfirm,
  onCancel,
}: TransactionConfirmationProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationStep, setConfirmationStep] = useState<
    'preview' | 'signing' | 'broadcasting' | 'confirming' | 'success' | 'error'
  >('preview');
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { selectedAgent } = useSolanaAgent();

  const handleConfirm = async () => {
    setIsConfirming(true);
    setError(null);

    try {
      setConfirmationStep('signing');
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate signing

      setConfirmationStep('broadcasting');
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate broadcasting

      setConfirmationStep('confirming');
      await onConfirm();

      // Simulate getting signature
      setSignature(`3J2KxV8k...${Math.random().toString(36).substr(2, 9)}`);
      setConfirmationStep('success');
    } catch (err: any) {
      setError(err.message || 'Transaction failed');
      setConfirmationStep('error');
    } finally {
      setIsConfirming(false);
    }
  };

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'swap':
        return <TrendingUp className="h-5 w-5" />;
      case 'transfer':
        return <Coins className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getTransactionTitle = (type: string) => {
    switch (type) {
      case 'swap':
        return 'Token Swap';
      case 'transfer':
        return 'Token Transfer';
      case 'stake':
        return 'Stake Tokens';
      case 'unstake':
        return 'Unstake Tokens';
      case 'lend':
        return 'Lend Assets';
      case 'borrow':
        return 'Borrow Assets';
      case 'mint_nft':
        return 'Mint NFT';
      case 'create_token':
        return 'Create Token';
      default:
        return 'Blockchain Transaction';
    }
  };

  const getRiskLevel = () => {
    if (transaction.priceImpact && transaction.priceImpact > 5) {
      return 'high';
    }
    if (transaction.priceImpact && transaction.priceImpact > 2) {
      return 'medium';
    }
    return 'low';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
  };

  const copySignature = async () => {
    if (!signature) {
      return;
    }

    try {
      await navigator.clipboard.writeText(signature);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_error) {}
  };

  const getProgressValue = () => {
    switch (confirmationStep) {
      case 'preview':
        return 0;
      case 'signing':
        return 25;
      case 'broadcasting':
        return 50;
      case 'confirming':
        return 75;
      case 'success':
      case 'error':
        return 100;
      default:
        return 0;
    }
  };

  const getProgressText = () => {
    switch (confirmationStep) {
      case 'signing':
        return 'Waiting for wallet signature...';
      case 'broadcasting':
        return 'Broadcasting transaction...';
      case 'confirming':
        return 'Confirming on blockchain...';
      case 'success':
        return 'Transaction confirmed!';
      case 'error':
        return 'Transaction failed';
      default:
        return 'Ready to submit';
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {getTransactionTypeIcon(transaction.type || '')}
            <span>{getTransactionTitle(transaction.type || '')}</span>
          </DialogTitle>
          <DialogDescription>
            Review the transaction details below before confirming.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress Bar (when confirming) */}
          {isConfirming && (
            <div className="space-y-2">
              <Progress className="w-full" value={getProgressValue()} />
              <p className="text-center text-muted-foreground text-sm">
                {getProgressText()}
              </p>
            </div>
          )}

          {/* Success State */}
          {confirmationStep === 'success' && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                  <h4 className="font-medium text-green-800 dark:text-green-200">
                    Transaction Successful
                  </h4>
                  {signature && (
                    <div className="mt-2 flex items-center space-x-2">
                      <code className="rounded bg-green-100 px-2 py-1 text-green-800 text-xs dark:bg-green-800 dark:text-green-200">
                        {signature}
                      </code>
                      <Button onClick={copySignature} size="sm" variant="ghost">
                        {copied ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        onClick={() =>
                          window.open(
                            `https://solscan.io/tx/${signature}`,
                            '_blank'
                          )
                        }
                        size="sm"
                        variant="ghost"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {confirmationStep === 'error' && error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
              <div className="flex items-center space-x-2">
                <X className="h-5 w-5 text-red-600 dark:text-red-400" />
                <div>
                  <h4 className="font-medium text-red-800 dark:text-red-200">
                    Transaction Failed
                  </h4>
                  <p className="text-red-700 text-sm dark:text-red-300">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Transaction Details */}
          {confirmationStep === 'preview' && (
            <>
              {/* Agent Info */}
              {selectedAgent && (
                <div className="flex items-center space-x-2 rounded-lg bg-muted p-3">
                  <Badge className="text-xs" variant="secondary">
                    Agent: {selectedAgent.name}
                  </Badge>
                </div>
              )}

              {/* Transaction Parameters */}
              {transaction.parameters && (
                <div className="space-y-3">
                  {transaction.parameters.amount && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Amount:
                      </span>
                      <span className="font-medium">
                        {transaction.parameters.amount}
                      </span>
                    </div>
                  )}

                  {transaction.parameters.tokenMint && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Token:
                      </span>
                      <code className="text-xs">
                        {transaction.parameters.tokenMint.slice(0, 8)}...
                      </code>
                    </div>
                  )}

                  {transaction.parameters.targetAddress && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">To:</span>
                      <code className="text-xs">
                        {transaction.parameters.targetAddress.slice(0, 8)}...
                      </code>
                    </div>
                  )}

                  {transaction.parameters.slippage && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Slippage:
                      </span>
                      <span>{transaction.parameters.slippage}%</span>
                    </div>
                  )}
                </div>
              )}

              {/* Cost Breakdown */}
              <div className="space-y-2 rounded-lg border p-3">
                <h4 className="font-medium text-sm">Cost Breakdown</h4>

                {transaction.estimatedFee && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Network Fee:</span>
                    <span>{transaction.estimatedFee.toFixed(6)} SOL</span>
                  </div>
                )}

                {transaction.priceImpact && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Price Impact:</span>
                    <Badge
                      className={cn('text-xs', getRiskColor(getRiskLevel()))}
                      variant="secondary"
                    >
                      {transaction.priceImpact.toFixed(2)}%
                    </Badge>
                  </div>
                )}

                {transaction.estimatedTime && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Est. Time:</span>
                    <span>{transaction.estimatedTime}</span>
                  </div>
                )}
              </div>

              {/* Risk Warning */}
              {getRiskLevel() !== 'low' && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <div>
                      <h4 className="font-medium text-sm text-yellow-800 dark:text-yellow-200">
                        {getRiskLevel() === 'high'
                          ? 'High Risk Transaction'
                          : 'Medium Risk Transaction'}
                      </h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        {getRiskLevel() === 'high'
                          ? 'This transaction has high price impact. Consider reducing the amount.'
                          : 'This transaction has moderate price impact. Please review carefully.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          {confirmationStep === 'preview' && (
            <>
              <Button onClick={onCancel} variant="outline">
                Cancel
              </Button>
              <Button disabled={isConfirming} onClick={handleConfirm}>
                {isConfirming ? (
                  <LoadingStates size="sm" variant="spinner" />
                ) : (
                  'Confirm Transaction'
                )}
              </Button>
            </>
          )}

          {(confirmationStep === 'success' || confirmationStep === 'error') && (
            <Button className="w-full" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TransactionConfirmation;
