'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import { Check, ExternalLink, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: 'pro' | 'pro_plus';
  currentTier?: 'free' | 'pro' | 'pro_plus';
  onSuccess?: () => void;
}

const TIER_CONFIG = {
  pro: {
    name: 'Pro',
    price: 0.05,
    originalPrice: 0.1,
    features: [
      '500 messages / month',
      '100 premium messages (GPT-4o, Claude)',
      'All standard models unlimited',
      'Document uploads',
      'Basic agents',
      'Chat history',
    ],
  },
  pro_plus: {
    name: 'Pro+',
    price: 0.1,
    originalPrice: 0.2,
    features: [
      '1,000 messages / month',
      '300 premium messages',
      'All models unlimited',
      'Large file uploads (100MB)',
      'Advanced agents',
      'API access',
      'Priority support',
    ],
  },
};

const TREASURY_WALLET =
  process.env.NEXT_PUBLIC_TREASURY_WALLET ||
  '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs';
const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com';

export function PaymentModal({
  isOpen,
  onClose,
  tier,
  currentTier = 'free',
  onSuccess,
}: PaymentModalProps) {
  const { publicKey, sendTransaction } = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [step, setStep] = useState<
    'details' | 'processing' | 'success' | 'error'
  >('details');

  const config = TIER_CONFIG[tier];
  const connection = new Connection(RPC_ENDPOINT);

  // Calculate upgrade pricing
  const isUpgrade = currentTier === 'pro' && tier === 'pro_plus';
  const upgradeDiscount = isUpgrade ? TIER_CONFIG.pro.price : 0;
  const finalPrice = config.price - upgradeDiscount;
  const displayPrice = finalPrice;

  const handlePayment = async () => {
    if (!publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setStep('processing');

      // Create transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(TREASURY_WALLET),
          lamports: displayPrice * LAMPORTS_PER_SOL,
        })
      );

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Send transaction
      const signature = await sendTransaction(transaction, connection);
      setTxSignature(signature);

      // Confirm transaction
      const confirmation = await connection.confirmTransaction(
        signature,
        'confirmed'
      );

      if (confirmation.value.err) {
        throw new Error('Transaction failed to confirm');
      }

      // Process payment on backend
      const response = await fetch('/api/subscriptions/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          txSignature: signature,
          tier,
          amountSol: displayPrice,
          isUpgrade,
          previousTier: currentTier,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Payment processing failed');
      }

      setStep('success');
      onSuccess?.();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Payment failed');
      setStep('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
      // Reset state after close
      setTimeout(() => {
        setStep('details');
        setError(null);
        setTxSignature(null);
      }, 300);
    }
  };

  return (
    <Dialog onOpenChange={handleClose} open={isOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'success' && <Check className="h-5 w-5 text-green-500" />}
            {step === 'error' && <X className="h-5 w-5 text-red-500" />}
            {step === 'processing' && (
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            )}
            {step === 'details' && (isUpgrade ? 'Upgrade to' : 'Subscribe to')}{' '}
            {config.name}
          </DialogTitle>
        </DialogHeader>

        {step === 'details' && (
          <div className="space-y-6">
            <Card className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{config.name} Plan</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-2xl">
                      {displayPrice} SOL
                    </span>
                    {isUpgrade ? (
                      <>
                        <span className="text-muted-foreground text-sm line-through">
                          {config.price} SOL
                        </span>
                        <Badge className="text-xs" variant="secondary">
                          Upgrade Pricing
                        </Badge>
                      </>
                    ) : (
                      <>
                        <span className="text-muted-foreground text-sm line-through">
                          {config.originalPrice} SOL
                        </span>
                        <Badge className="text-xs" variant="secondary">
                          50% Off
                        </Badge>
                      </>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {isUpgrade ? 'Upgrade difference' : 'per month'}
                  </p>
                </div>
              </div>

              <ul className="space-y-2 text-sm">
                {config.features.map((feature, index) => (
                  <li className="flex items-start gap-2" key={index}>
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {publicKey ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm">
                    <strong>Payment to:</strong> {TREASURY_WALLET.slice(0, 8)}
                    ...{TREASURY_WALLET.slice(-8)}
                  </p>
                  <p className="text-sm">
                    <strong>Amount:</strong> {displayPrice} SOL (~$
                    {(displayPrice * 200).toFixed(0)} USD)
                  </p>
                </div>

                <Button
                  className="w-full"
                  disabled={isProcessing}
                  onClick={handlePayment}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Pay ${displayPrice} SOL`
                  )}
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <p className="mb-4 text-muted-foreground text-sm">
                  Connect your Solana wallet to continue
                </p>
                <WalletMultiButton />
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
                {error}
              </div>
            )}
          </div>
        )}

        {step === 'processing' && (
          <div className="py-8 text-center">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-blue-500" />
            <h3 className="mb-2 font-semibold">Processing Payment</h3>
            <p className="text-muted-foreground text-sm">
              Please confirm the transaction in your wallet and wait for
              blockchain confirmation...
            </p>
            {txSignature && (
              <div className="mt-4">
                <a
                  className="inline-flex items-center gap-1 text-blue-600 text-sm hover:text-blue-800"
                  href={`https://solscan.io/tx/${txSignature}`}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  View on Solscan <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        )}

        {step === 'success' && (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="mb-2 font-semibold">Payment Successful!</h3>
            <p className="mb-4 text-muted-foreground text-sm">
              Your {config.name} subscription is now active. Enjoy your upgraded
              features!
            </p>
            {txSignature && (
              <a
                className="mb-4 inline-flex items-center gap-1 text-blue-600 text-sm hover:text-blue-800"
                href={`https://solscan.io/tx/${txSignature}`}
                rel="noopener noreferrer"
                target="_blank"
              >
                View transaction <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <Button className="w-full" onClick={handleClose}>
              Continue
            </Button>
          </div>
        )}

        {step === 'error' && (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <X className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="mb-2 font-semibold">Payment Failed</h3>
            <p className="mb-4 text-muted-foreground text-sm">
              {error || 'Something went wrong during payment processing.'}
            </p>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => setStep('details')}
                variant="outline"
              >
                Try Again
              </Button>
              <Button className="flex-1" onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
