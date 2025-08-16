'use client';

import { api, api as convexApi } from '@convex/_generated/api';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import { useMutation, useQuery } from 'convex/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  Check,
  CreditCard,
  Crown,
  ExternalLink,
  Loader,
  Shield,
  Wallet,
  Zap,
  Sparkles,
} from 'lucide-react';
import { useEffect, useRef, useState, useMemo } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// useCurrentUser replacement - using useSubscription hook instead
import { useSubscription } from '@/hooks/use-subscription';
import { paymentConfig, solanaConfig } from '@/lib/env';
import { getSolanaEndpoint } from '@/lib/solana';
import {
  createPaymentTransaction,
  processPaymentTransaction,
} from '@/lib/solana';
import { cn } from '@/lib/utils';
import { createModuleLogger } from '@/lib/utils/logger';
import {
  createSPLTokenTransferTransaction,
  validateSPLTokenTransfer,
} from '@/lib/solana-spl';

// Initialize logger
const log = createModuleLogger('upgrade-modal');

export interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestedTier?: 'pro' | 'pro_plus';
  trigger?: import('@/hooks/use-upgrade-modal').UpgradeTrigger;
  initialTab?: 'subscription' | 'credits';
}

// Message credit pack configuration
const MESSAGE_CREDIT_PACK = {
  standardCredits: 150,
  premiumCredits: 25,
  priceSOL: 0.025,
  priceUSD: 3.5,
};

// Subscription tier configurations with billing period support
const TIER_CONFIG = {
  pro: {
    name: 'Pro',
    monthly: {
      priceSOL: paymentConfig.subscription.pro.monthly.priceSOL,
      priceUSD: paymentConfig.subscription.pro.monthly.priceUSD,
    },
    yearly: {
      priceSOL: paymentConfig.subscription.pro.yearly.priceSOL,
      priceUSD: paymentConfig.subscription.pro.yearly.priceUSD,
    },
    messages: 500,
    premiumMessages: 100,
    color: 'from-blue-500 to-blue-600',
    icon: Zap,
    popular: true,
    features: [
      'Standard Models Access',
      '500 messages per month',
      '100 premium model messages',
      'GPT-4o & Claude 3.5 Sonnet',
      'Document upload & processing',
      'Basic agents & workflows',
      'Chat history & export',
      'Priority customer support',
    ],
  },
  pro_plus: {
    name: 'Pro+',
    monthly: {
      priceSOL: paymentConfig.subscription.proPlus.monthly.priceSOL,
      priceUSD: paymentConfig.subscription.proPlus.monthly.priceUSD,
    },
    yearly: {
      priceSOL: paymentConfig.subscription.proPlus.yearly.priceSOL,
      priceUSD: paymentConfig.subscription.proPlus.yearly.priceUSD,
    },
    messages: 1000,
    premiumMessages: 300,
    color: 'from-purple-500 to-purple-600',
    icon: Shield,
    popular: false,
    features: [
      'Everything in Pro',
      '1,000 messages per month',
      '300 premium model messages',
      'All AI models available',
      'Large document uploads (50MB+)',
      'Advanced agents & custom tools',
      'API access for development',
      'Unlimited chat history',
      'Priority support & early access',
    ],
  },
};

export function UpgradeModal({
  isOpen,
  onClose,
  suggestedTier = 'pro',
  trigger = 'manual',
  initialTab = 'subscription',
}: UpgradeModalProps) {
  // Tab management
  const [activeTab, setActiveTab] = useState<'subscription' | 'credits'>(
    'subscription'
  );

  // Apply requested initial tab each time the modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Subscription upgrade state
  const [selectedTier, setSelectedTier] = useState<'pro' | 'pro_plus'>(
    suggestedTier
  );
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>(
    'monthly'
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<
    'select' | 'payment' | 'processing' | 'success' | 'error'
  >('select');
  const [error, setError] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<{
    walletAddress?: string;
    txSignature?: string;
    amount?: number;
  }>({});

  // Message credits state
  const [numberOfPacks, setNumberOfPacks] = useState(1);
  const [isProcessingCredits, setIsProcessingCredits] = useState(false);
  const [creditsPaymentStep, setCreditsPaymentStep] = useState<
    'select' | 'payment' | 'processing' | 'success' | 'error'
  >('select');
  const [creditsError, setCreditsError] = useState<string | null>(null);
  const [creditsPaymentDetails, setCreditsPaymentDetails] = useState<{
    walletAddress?: string;
    txSignature?: string;
    amount?: number;
  }>({});

  // User data comes from useSubscription hook
  const { subscription, upgradePrompt } = useSubscription();
  const _processPayment = useMutation(api.subscriptions.processPayment);
  const checkPaymentStatus = useQuery(
    api.subscriptions.checkPaymentStatus,
    paymentDetails.txSignature
      ? { txSignature: paymentDetails.txSignature }
      : 'skip'
  );
  const proratedUpgrade = useQuery(
    api.subscriptions.calculateProratedUpgrade,
    selectedTier ? { targetTier: selectedTier } : 'skip'
  );

  // SPL Token queries and state
  const availableTokens = useQuery(api.splTokens.getAvailablePaymentTokens);
  const [selectedToken, setSelectedToken] = useState<string>('SOL');
  const tokenCalculation = useQuery(
    api.splTokens.calculateTokenPaymentAmount,
    selectedToken && selectedTier
      ? {
          tokenAddress: selectedToken === 'SOL' ? 'native' : selectedToken,
          subscriptionTier: selectedTier,
        }
      : 'skip'
  );

  // Credits SPL token state
  const [selectedCreditsToken, setSelectedCreditsToken] = useState<string>('SOL');
  const creditsTokenCalculation = useQuery(
    api.splTokens.calculateTokenPaymentAmount,
    selectedCreditsToken
      ? {
          tokenAddress: selectedCreditsToken === 'SOL' ? 'native' : selectedCreditsToken,
          subscriptionTier: 'pro', // Use pro pricing as base for credits calculation
        }
      : 'skip'
  );


  // Message credits queries and mutations
  const _purchaseMessageCredits = useMutation(
    api.subscriptions.purchaseMessageCredits
  );
  const checkCreditsPurchaseStatus = useQuery(
    api.subscriptions.checkMessageCreditPurchaseStatus,
    creditsPaymentDetails.txSignature
      ? { txSignature: creditsPaymentDetails.txSignature }
      : 'skip'
  );

  // Referral payout info (if user has a referrer)
  const referrerInfo = useQuery(convexApi.referrals.getReferrerPayoutInfo, {});

  // Get user data from Convex query
  const user = useQuery(api.users.getCurrentUserProfile);

  // Solana wallet integration
  const { publicKey, signTransaction, connected } = useWallet();
  const { setVisible } = useWalletModal();

  const selectedConfig = {
    ...TIER_CONFIG[selectedTier],
    priceSOL: TIER_CONFIG[selectedTier][billingPeriod].priceSOL,
    priceUSD: TIER_CONFIG[selectedTier][billingPeriod].priceUSD,
  };
  const isSendingRef = useRef(false);
  const isSendingCreditsRef = useRef(false);
  const currentTier = subscription?.tier;
  const isCurrentTierSelected = currentTier === selectedTier;
  const isDowngradeSelected =
    currentTier === 'pro_plus' && selectedTier === 'pro';
  const canUpgrade = !(isCurrentTierSelected || isDowngradeSelected);

  // Message credits computed values
  const totalCreditsCost = MESSAGE_CREDIT_PACK.priceSOL * numberOfPacks;
  const totalStandardCredits =
    MESSAGE_CREDIT_PACK.standardCredits * numberOfPacks;
  const totalPremiumCredits =
    MESSAGE_CREDIT_PACK.premiumCredits * numberOfPacks;

  // Calculate actual credits token amounts (0.025 SOL vs 0.05 SOL for pro)
  const creditsTokenAmount = useMemo(() => {
    if (selectedCreditsToken === 'SOL') {
      return {
        symbol: 'SOL',
        amount: totalCreditsCost,
        rawAmount: Math.floor(totalCreditsCost * 10 ** 9), // Convert to lamports
        decimals: 9,
      };
    }
    
    if (!creditsTokenCalculation?.priceInfo) return null;
    
    // Calculate token amount for credits: (0.025 SOL per pack) / (token price in SOL)
    const solPerPack = MESSAGE_CREDIT_PACK.priceSOL; // 0.025 SOL
    const totalSolCost = solPerPack * numberOfPacks;
    const tokenAmount = totalSolCost / creditsTokenCalculation.priceInfo.solPrice;
    const decimals = creditsTokenCalculation.decimals || 6;
    
    return {
      symbol: creditsTokenCalculation.symbol,
      amount: tokenAmount,
      rawAmount: Math.floor(tokenAmount * 10 ** decimals),
      decimals,
      priceInfo: creditsTokenCalculation.priceInfo,
    };
  }, [selectedCreditsToken, creditsTokenCalculation, totalCreditsCost, numberOfPacks]);

  // Initialize Solana connection
  const connection = new Connection(
    getSolanaEndpoint(),
    solanaConfig.commitment
  );

  // Poll payment status when in processing state
  useEffect(() => {
    if (
      paymentStep === 'processing' &&
      paymentDetails.txSignature &&
      checkPaymentStatus
    ) {
      const pollStatus = () => {
        if (checkPaymentStatus.status === 'confirmed') {
          setPaymentStep('success');
          log.info('Payment confirmed via polling', {
            txSignature: paymentDetails.txSignature,
          });
        } else if (checkPaymentStatus.status === 'failed') {
          setPaymentStep('error');
          setError('Payment verification failed');
          log.error('Payment failed via polling', {
            txSignature: paymentDetails.txSignature,
          });
        }
        // Keep polling if still pending
      };

      const interval = setInterval(pollStatus, 3000); // Poll every 3 seconds
      const timeout = setTimeout(() => {
        clearInterval(interval);
        if (paymentStep === 'processing') {
          setPaymentStep('error');
          setError('Payment verification timeout - please contact support');
        }
      }, 300_000); // 5 minute timeout

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [paymentStep, paymentDetails.txSignature, checkPaymentStatus]);

  // Poll credits payment status when processing
  useEffect(() => {
    if (
      creditsPaymentStep === 'processing' &&
      creditsPaymentDetails.txSignature &&
      checkCreditsPurchaseStatus
    ) {
      const pollStatus = () => {
        if (checkCreditsPurchaseStatus.status === 'confirmed') {
          setCreditsPaymentStep('success');
          log.info('Message credits purchase confirmed', {
            txSignature: creditsPaymentDetails.txSignature,
          });
        } else if (checkCreditsPurchaseStatus.status === 'failed') {
          setCreditsPaymentStep('error');
          setCreditsError('Purchase verification failed');
          log.error('Credits purchase failed via polling', {
            txSignature: creditsPaymentDetails.txSignature,
          });
        }
      };

      const interval = setInterval(pollStatus, 3000);
      const timeout = setTimeout(() => {
        clearInterval(interval);
        if (creditsPaymentStep === 'processing') {
          setCreditsPaymentStep('error');
          setCreditsError(
            'Purchase verification timeout - please contact support'
          );
        }
      }, 300_000); // 5 minute timeout

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [
    creditsPaymentStep,
    creditsPaymentDetails.txSignature,
    checkCreditsPurchaseStatus,
  ]);

  const handleUpgrade = async () => {
    if (!canUpgrade) {
      setError(
        isCurrentTierSelected
          ? 'You are already on this plan.'
          : 'Downgrades are not available from Pro+ within this flow.'
      );
      setPaymentStep('error');
      return;
    }
    if (!user) {
      setError('Please sign in first');
      return;
    }

    if (!(connected && publicKey)) {
      setError('Please connect your wallet first');
      return;
    }

    if (!solanaConfig.paymentAddress) {
      setError('Payment system not configured - please contact support');
      return;
    }

    try {
      setIsProcessing(true);
      setPaymentStep('payment');

      // Create payment instructions with prorated pricing
      // Only allow proration when keeping the same billing period as current subscription
      const isProrated =
        proratedUpgrade?.isProrated &&
        selectedTier === 'pro_plus' &&
        subscription?.tier === 'pro' &&
        billingPeriod === (subscription as any)?.billingCycle;
      const paymentAmount = isProrated
        ? proratedUpgrade.proratedPrice
        : selectedConfig.priceSOL;

      setPaymentDetails({
        walletAddress: publicKey.toString(),
        amount: paymentAmount,
      });

      log.info('Upgrade initiated', {
        tier: selectedTier,
        user: user?._id,
        walletAddress: publicKey.toString(),
        trigger,
      });
    } catch (err) {
      log.error('Upgrade failed', { error: err });
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
      setPaymentStep('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentComplete = async (retryAttempt = 0) => {
    const MAX_RETRIES = 3;

    if (!(connected && publicKey && signTransaction)) {
      setError('Please connect your wallet first');
      return;
    }

    if (!solanaConfig.paymentAddress) {
      setError('Payment address not configured - please contact support');
      return;
    }

    try {
      setIsProcessing(true);
      setPaymentStep('processing');
      setError(null);

      // Get the correct payment amount (prorated or full price)
      const isProrated =
        proratedUpgrade?.isProrated &&
        selectedTier === 'pro_plus' &&
        subscription?.tier === 'pro' &&
        billingPeriod === (subscription as any)?.billingCycle;
      const paymentAmount = isProrated
        ? proratedUpgrade.proratedPrice
        : selectedConfig.priceSOL;
      // If we already sent a transaction before, reuse its signature to avoid double-charging
      let txSignatureToVerify = paymentDetails.txSignature;

      // Only create and send a new transaction if we don't have a prior signature
      if (!txSignatureToVerify) {
        if (isSendingRef.current) {
          // Another send is in progress, rely on verification/polling
          throw new Error('Payment already in progress');
        }

        // Set the flag immediately to prevent race conditions
        isSendingRef.current = true;

        // Check wallet balance first
        const balance = await connection.getBalance(publicKey);
        const balanceSol = balance / 1_000_000_000; // Convert lamports to SOL
        if (balanceSol < paymentAmount) {
          throw new Error(
            `Insufficient balance. Required: ${paymentAmount} SOL, Available: ${balanceSol.toFixed(4)} SOL`
          );
        }

        // Build transaction; include referral payout in the same transaction when applicable
        const recipientPublicKey = new PublicKey(solanaConfig.paymentAddress);
        let tx = new Transaction();
        let mainAmount = paymentAmount;
        let referralAmount = 0;
        let referralWallet: string | undefined;

        if (referrerInfo?.hasReferrer) {
          referralAmount =
            Math.round(
              paymentAmount * (referrerInfo.commissionRate ?? 0) * 1_000_000
            ) / 1_000_000;
          mainAmount = Math.max(0, paymentAmount - referralAmount);
          referralWallet = referrerInfo.referrerWalletAddress;
        }

        // Create transfer to treasury (mainAmount)
        const mainTx = await createPaymentTransaction(
          publicKey,
          recipientPublicKey,
          mainAmount
        );
        tx = mainTx;

        // Add referral payout transfer if applicable
        if (referralWallet && referralAmount > 0) {
          const referralIx = SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: new PublicKey(referralWallet),
            lamports: Math.floor(referralAmount * 1_000_000_000),
          });
          tx.add(referralIx);
        }

        log.info('Payment transaction created', {
          tier: selectedTier,
          amount: paymentAmount,
          isProrated,
          recipient: solanaConfig.paymentAddress,
          sender: publicKey.toString(),
          attempt: retryAttempt + 1,
          blockhash: tx.recentBlockhash,
        });

        // Send transaction (no auto-retry here; retries handled at higher level)
        const sentSignature = await processPaymentTransaction(
          tx,
          signTransaction,
          {
            maxRetries: 0,
            skipPreflight: false,
          }
        );

        // Validate the signature we just received
        if (
          !sentSignature ||
          typeof sentSignature !== 'string' ||
          sentSignature.length < 64
        ) {
          throw new Error(
            `Invalid transaction signature received: "${sentSignature}"`
          );
        }

        txSignatureToVerify = sentSignature;
        setPaymentDetails((prev) => ({ ...prev, txSignature: sentSignature }));

        log.info('Payment transaction sent', {
          tier: selectedTier,
          txSignature: sentSignature,
          signatureLength: sentSignature.length,
          attempt: retryAttempt + 1,
        });
      }

      // Submit to backend for verification with retry logic (does not resend funds)
      let verificationResult;
      let lastError;

      for (let i = 0; i < 3; i++) {
        try {
          const verificationResponse = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              txSignature: txSignatureToVerify,
              expectedAmount: paymentAmount,
              tier: selectedTier,
              billingCycle: billingPeriod,
              walletAddress: publicKey.toString(),
              isProrated,
              referralCode: referrerInfo?.hasReferrer
                ? referrerInfo.referralCode
                : undefined,
              referralPayoutTx: referrerInfo?.hasReferrer
                ? txSignatureToVerify
                : undefined,
              referrerWalletAddress: referrerInfo?.referrerWalletAddress,
              commissionRate: referrerInfo?.commissionRate,
            }),
          });

          if (!verificationResponse.ok) {
            const errorText = await verificationResponse.text();
            throw new Error(
              `HTTP ${verificationResponse.status}: ${errorText}`
            );
          }

          verificationResult = await verificationResponse.json();
          break; // Success, exit retry loop
        } catch (fetchError) {
          lastError = fetchError;
          if (i < 2) {
            // Don't wait after last attempt
            await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** i)); // Exponential backoff
          }
        }
      }

      if (!verificationResult) {
        throw new Error(
          `Verification failed after 3 attempts: ${lastError instanceof Error ? lastError.message : 'Unknown error'}`
        );
      }

      if (verificationResult.success) {
        setPaymentStep('success');
        if (txSignatureToVerify) {
          setPaymentDetails((prev) => ({
            ...prev,
            txSignature: txSignatureToVerify,
          }));
        }

        log.info('Payment verified successfully', {
          tier: selectedTier,
          txSignature: txSignatureToVerify,
          paymentId: verificationResult.paymentId,
          attempt: retryAttempt + 1,
        });

        // No full page reload needed; Convex queries update in realtime.
        // Briefly show success, then close the modal.
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        throw new Error(
          verificationResult.error || 'Payment verification failed'
        );
      }
    } catch (err) {
      log.error('Payment processing failed', {
        error: err,
        attempt: retryAttempt + 1,
        maxRetries: MAX_RETRIES,
      });

      // Enhanced error handling with specific messages
      let errorMessage = 'Payment processing failed';
      let isRetryable = false;

      if (err instanceof Error) {
        // Handle specific error types
        if (
          err.message.includes('DUPLICATE_TRANSACTION') ||
          err.message.includes('already been processed') ||
          err.message.includes('ALREADY_PROCESSED')
        ) {
          // This transaction was already processed - NOT retryable
          errorMessage =
            'This payment has already been processed. Your subscription will update automatically.';
          isRetryable = false;

          // Set success state since payment was actually processed
          setPaymentStep('success');
          return;
        }
        if (err.message.includes('SIGNATURE_VERIFICATION_FAILED')) {
          // Signature verification failed - retryable with new transaction
          errorMessage =
            'Transaction signature verification failed. Retrying with fresh transaction...';
          isRetryable = true;
        } else if (
          err.message.includes('BLOCKHASH_NOT_FOUND') ||
          err.message.includes('blockhash')
        ) {
          // Blockhash expired - retryable with new transaction
          errorMessage =
            'Transaction expired. Retrying with fresh blockhash...';
          isRetryable = true;
        } else if (err.message.includes('SIMULATION_FAILED')) {
          // Simulation failed - check the specific reason
          errorMessage = err.message.replace(
            'SIMULATION_FAILED:',
            'Transaction simulation failed:'
          );
          // Only retry if it's a transient error
          isRetryable =
            err.message.includes('node') || err.message.includes('network');
        } else if (err.message.includes('User rejected')) {
          // User cancelled - NOT retryable
          errorMessage = 'Transaction was cancelled by user';
          isRetryable = false;
        } else if (
          err.message.includes('Insufficient balance') ||
          err.message.includes('insufficient funds')
        ) {
          // Insufficient funds - NOT retryable
          errorMessage = err.message;
          isRetryable = false;
        } else if (
          err.message.includes('Network error') ||
          err.message.includes('fetch')
        ) {
          // Network error - retryable
          errorMessage = 'Network error - please check your connection';
          isRetryable = true;
        } else if (
          err.message.includes('timeout') ||
          err.message.includes('confirmation timeout')
        ) {
          // Timeout - retryable
          errorMessage = 'Transaction timeout - the network may be congested';
          isRetryable = true;
        } else if (err.message.includes('Payment address not configured')) {
          // Configuration error - NOT retryable
          errorMessage =
            'Payment system not configured - please contact support';
          isRetryable = false;
        } else if (err.message.includes('HTTP 5')) {
          // Server error - retryable
          errorMessage = 'Server error - retrying...';
          isRetryable = true;
        } else if (err.message.includes('Verification failed after')) {
          // Verification failed after several attempts - retry verification only
          errorMessage =
            'Payment verification failed - retrying verification...';
          isRetryable = true;
        } else {
          // Unknown error - don't retry by default
          errorMessage = err.message;
          isRetryable = false;
        }
      }

      if (isRetryable && retryAttempt < MAX_RETRIES) {
        // Wait before retry with exponential backoff
        const delay = 2000 * 2 ** retryAttempt;
        setTimeout(() => {
          handlePaymentComplete(retryAttempt + 1);
        }, delay);

        setError(
          `${errorMessage} - Retrying in ${delay / 1000} seconds... (Attempt ${retryAttempt + 1}/${MAX_RETRIES})`
        );
        return;
      }

      setError(errorMessage);
      setPaymentStep('error');
    } finally {
      isSendingRef.current = false;
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (paymentStep !== 'processing' && creditsPaymentStep !== 'processing') {
      onClose();
      setPaymentStep('select');
      setCreditsPaymentStep('select');
      setError(null);
      setCreditsError(null);
      setPaymentDetails({});
      setCreditsPaymentDetails({});
      setNumberOfPacks(1);
      setActiveTab('subscription');
    }
  };

  const renderTierCard = (tier: 'pro' | 'pro_plus') => {
    const config = TIER_CONFIG[tier];
    const Icon = config.icon;
    const isSelected = selectedTier === tier;
    const currentTier = subscription?.tier;
    const isCurrentTier = currentTier === tier;
    const isDowngrade = currentTier === 'pro_plus' && tier === 'pro';

    // Check if this is a prorated upgrade
    const isProrated =
      proratedUpgrade?.isProrated &&
      tier === 'pro_plus' &&
      currentTier === 'pro' &&
      billingPeriod === (subscription as any)?.billingCycle;
    
    // Calculate display price based on selected token and billing period
    const basePrice = isProrated ? proratedUpgrade.proratedPrice : config[billingPeriod].priceSOL;
    let displayPrice = basePrice;
    let displaySymbol = 'SOL';
    
    if (tokenCalculation && selectedToken !== 'SOL' && tier === selectedTier) {
      displayPrice = tokenCalculation.amount;
      displaySymbol = tokenCalculation.symbol;
    }

    return (
      <Card
        className={cn(
          'relative cursor-pointer border-2 p-6 transition-all duration-200',
          isSelected
            ? 'border-blue-500 bg-blue-50/50 shadow-lg dark:bg-blue-900/20'
            : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600',
          isCurrentTier && 'cursor-not-allowed opacity-50',
          isDowngrade && 'cursor-not-allowed opacity-50'
        )}
        key={tier}
        onClick={() => {
          if (!(isCurrentTier || isDowngrade)) {
            setSelectedTier(tier);
          }
        }}
      >
        {config.popular && (
          <Badge className="-top-2 -translate-x-1/2 absolute left-1/2 bg-gradient-to-r from-orange-500 to-orange-600">
            Most Popular
          </Badge>
        )}

        {isProrated && (
          <Badge className="-top-2 -translate-x-1/2 absolute left-1/2 bg-gradient-to-r from-green-500 to-green-600">
            Prorated Upgrade
          </Badge>
        )}

        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={cn('rounded-lg bg-gradient-to-r p-2', config.color)}
            >
              <Icon className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{config.name}</h3>
              <p className="text-muted-foreground text-sm">
                {config.messages.toLocaleString()} messages/month
              </p>
            </div>
          </div>
          <div className="text-right">
            {isProrated ? (
              <div className="space-y-1">
                <div className="font-bold text-green-600 text-xl">
                  {displayPrice.toFixed(displaySymbol === 'SOL' ? 3 : 6)} {displaySymbol}
                </div>
                <div className="text-muted-foreground text-xs line-through">
                  {config[billingPeriod].priceSOL} SOL
                </div>
                <div className="font-medium text-green-600 text-xs">
                  Upgrade price only
                </div>
              </div>
            ) : (
              <div>
                <div className="font-bold text-xl">
                  {displayPrice.toFixed(displaySymbol === 'SOL' ? 3 : 6)} {displaySymbol}
                </div>
                <div className="text-muted-foreground text-sm">
                  ≈ ${config[billingPeriod].priceUSD}/{billingPeriod === 'yearly' ? 'year' : 'month'}
                  {billingPeriod === 'yearly' && (
                    <span className="block text-xs text-green-600 font-medium">
                      ${(config[billingPeriod].priceUSD / 12).toFixed(0)}/month (5% savings)
                    </span>
                  )}
                  {tokenCalculation?.priceInfo && selectedToken !== 'SOL' && (
                    <span className="block text-xs">
                      ({tokenCalculation.priceInfo.solPrice.toFixed(6)} SOL)
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {config.features.map((feature, index) => (
            <div className="flex items-start space-x-2" key={index}>
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
              <span className="text-gray-600 text-sm dark:text-gray-300">
                {feature}
              </span>
            </div>
          ))}
        </div>

        {isCurrentTier && (
          <div className="mt-4 rounded bg-muted p-2 text-center">
            <span className="font-medium text-gray-600 text-sm dark:text-gray-400">
              Current Plan
            </span>
          </div>
        )}

        {isProrated && (
          <div className="mt-4 rounded bg-green-50 p-3 dark:bg-green-900/20">
            <div className="text-center text-green-800 text-sm dark:text-green-200">
              <p className="font-medium">Pro Member Discount</p>
              <p className="text-xs">
                Pay only the difference - your remaining Pro time continues!
              </p>
              {proratedUpgrade?.daysRemaining && (
                <p className="mt-1 text-xs">
                  {proratedUpgrade.daysRemaining} days left in your Pro plan
                </p>
              )}
            </div>
          </div>
        )}
      </Card>
    );
  };

  const renderPaymentInstructions = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div
          className={cn(
            'inline-flex rounded-full bg-gradient-to-r p-4',
            selectedConfig.color,
            'mb-4'
          )}
        >
          <Wallet className="h-8 w-8 text-primary-foreground" />
        </div>
        <h3 className="mb-2 font-semibold text-xl">Send Payment</h3>
        <p className="text-muted-foreground">
          {connected
            ? 'Click "Send Payment" to create and sign the transaction with your connected wallet'
            : 'Connect your wallet to proceed with the payment'}
        </p>
      </div>

      <Card className="bg-muted/50 p-6">
        <div className="space-y-4">
          <div>
            <label className="font-medium text-gray-700 text-sm dark:text-gray-300">
              Your Wallet
            </label>
            <div className="mt-1 rounded-lg border bg-background p-3">
              <div className="flex items-center justify-between">
                {connected && publicKey ? (
                  <span className="break-all font-mono text-sm">
                    {publicKey.toString()}
                  </span>
                ) : (
                  <span className="text-gray-500 text-sm">
                    Wallet not connected
                  </span>
                )}
                {connected && (
                  <Badge className="ml-2" variant="secondary">
                    Connected
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="font-medium text-gray-700 text-sm dark:text-gray-300">
              Payment Address
            </label>
            <div className="mt-1 rounded-lg border bg-card p-3 font-mono text-sm">
              <div className="flex items-center justify-between">
                <span className="break-all">
                  {solanaConfig.paymentAddress ||
                    'Payment address not configured'}
                </span>
                <Button
                  disabled={!solanaConfig.paymentAddress}
                  onClick={() =>
                    navigator.clipboard.writeText(
                      solanaConfig.paymentAddress || ''
                    )
                  }
                  size="sm"
                  variant="ghost"
                >
                  Copy
                </Button>
              </div>
            </div>
          </div>

          <div>
            <label className="font-medium text-gray-700 text-sm dark:text-gray-300">
              Amount
            </label>
            <div className="mt-1 rounded-lg border bg-background p-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">
                  {tokenCalculation && selectedToken !== 'SOL' 
                    ? `${tokenCalculation.amount.toFixed(6)} ${tokenCalculation.symbol}`
                    : `${paymentDetails.amount || selectedConfig.priceSOL} SOL`
                  }
                </span>
                <span className="text-muted-foreground text-sm">
                  {proratedUpgrade?.isProrated &&
                  selectedTier === 'pro_plus' &&
                  subscription?.tier === 'pro'
                    ? 'Prorated upgrade'
                    : tokenCalculation?.priceInfo && selectedToken !== 'SOL'
                      ? `≈ ${tokenCalculation.priceInfo.solPrice.toFixed(6)} SOL`
                      : `≈ $${selectedConfig.priceUSD} USD`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          <div className="space-y-2">
            <p>
              <strong>Important:</strong> Send exactly {selectedConfig.priceSOL}{' '}
              SOL to avoid processing delays.
            </p>
            <p>
              Your subscription will activate automatically once the payment is
              confirmed on the blockchain.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      <div className="flex flex-col space-y-3">
        {!connected && (
          <Button
            className="w-full"
            onClick={() => setVisible(true)}
            variant="outline"
          >
            <Wallet className="mr-2 h-4 w-4" />
            Connect Wallet
          </Button>
        )}
        {connected && (
          <Button
            className="w-full"
            disabled={isProcessing || !publicKey}
            onClick={() => handlePaymentComplete()}
          >
            {isProcessing ? 'Processing Payment...' : 'Send Payment'}
          </Button>
        )}
      </div>
    </div>
  );

  const renderProcessingState = () => {
    const processingSteps = [
      { label: 'Creating transaction...', icon: Wallet },
      { label: 'Signing with wallet...', icon: Shield },
      { label: 'Broadcasting to network...', icon: ExternalLink },
      { label: 'Confirming on blockchain...', icon: Check },
    ];

    return (
      <div className="space-y-6 py-8 text-center">
        <div className="relative">
          <Loader className="mx-auto h-12 w-12 animate-spin text-blue-500" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Wallet className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        <div>
          <h3 className="mb-2 font-semibold text-xl">Processing Payment</h3>
          <p className="text-muted-foreground">
            We're verifying your transaction on the Solana blockchain...
          </p>
          <p className="mt-2 text-muted-foreground text-sm">
            This usually takes 30-60 seconds
          </p>
        </div>

        {/* Processing steps indicator */}
        <div className="space-y-2">
          {processingSteps.map((step, index) => {
            const StepIcon = step.icon;
            return (
              <div
                className="flex items-center justify-center space-x-2 text-sm"
                key={index}
              >
                <StepIcon className="h-4 w-4 text-blue-500" />
                <span className="text-muted-foreground">{step.label}</span>
              </div>
            );
          })}
        </div>

        {/* Transaction link when available */}
        {paymentDetails.txSignature && (
          <div className="space-y-3">
            <div className="rounded-lg border bg-muted/50 p-3/50">
              <p className="font-medium text-sm">Transaction ID:</p>
              <p className="break-all font-mono text-muted-foreground text-xs">
                {paymentDetails.txSignature}
              </p>
            </div>
            <Button
              onClick={() =>
                window.open(
                  `https://explorer.solana.com/tx/${paymentDetails.txSignature}${solanaConfig.network !== 'mainnet-beta' ? `?cluster=${solanaConfig.network}` : ''}`,
                  '_blank'
                )
              }
              size="sm"
              variant="outline"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View on Solana Explorer
            </Button>
          </div>
        )}

        {/* Network status indicator */}
        <div className="text-muted-foreground text-xs">
          Network: {solanaConfig.network} • Status:{' '}
          {checkPaymentStatus?.status || 'checking...'}
        </div>
      </div>
    );
  };

  const renderSuccessState = () => (
    <div className="space-y-4 py-8 text-center">
      <div
        className={cn(
          'inline-flex rounded-full bg-gradient-to-r p-4',
          selectedConfig.color
        )}
      >
        <Check className="h-8 w-8 text-primary-foreground" />
      </div>
      <div>
        <h3 className="mb-2 font-semibold text-xl">Payment Successful!</h3>
        <p className="text-muted-foreground">
          Welcome to Anubis Chat {selectedConfig.name}! Your account has been
          upgraded.
        </p>
        {paymentDetails.txSignature && (
          <div className="mt-4">
            <Button
              onClick={() =>
                window.open(
                  `https://explorer.solana.com/tx/${paymentDetails.txSignature}`,
                  '_blank'
                )
              }
              size="sm"
              variant="outline"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View Transaction
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const renderErrorState = () => {
    // Categorize error for better recovery guidance
    const isNetworkError =
      error?.includes('Network') ||
      error?.includes('connectivity') ||
      error?.includes('timeout');
    const isBalanceError = error?.includes('Insufficient balance');
    const isUserCancellation =
      error?.includes('cancelled') || error?.includes('rejected');
    const isConfigError =
      error?.includes('not configured') || error?.includes('contact support');
    const isRetryable = isNetworkError && !isConfigError && !isUserCancellation;

    return (
      <div className="space-y-6 py-8 text-center">
        <div className="inline-flex rounded-full bg-red-100 p-4 dark:bg-red-900/20">
          <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>

        <div>
          <h3 className="mb-2 font-semibold text-xl">Payment Failed</h3>
          <p className="mb-4 text-muted-foreground">
            {error ||
              'There was an issue processing your payment. Please try again.'}
          </p>

          {/* Error-specific guidance */}
          {isBalanceError && (
            <Alert className="border-orange-200 bg-orange-50 text-left dark:border-orange-800 dark:bg-orange-900/20">
              <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <AlertDescription className="text-orange-800 dark:text-orange-200">
                <strong>Insufficient SOL:</strong> Please add more SOL to your
                wallet and try again. You can purchase SOL on exchanges like
                Coinbase, Binance, or directly through your wallet.
              </AlertDescription>
            </Alert>
          )}

          {isNetworkError && (
            <Alert className="border-blue-200 bg-blue-50 text-left dark:border-blue-800 dark:bg-blue-900/20">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                <strong>Network Issue:</strong> This is usually temporary. Check
                your internet connection and the Solana network status, then try
                again.
              </AlertDescription>
            </Alert>
          )}

          {isUserCancellation && (
            <Alert className="border-border bg-muted/50 text-left">
              <AlertCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <AlertDescription className="text-gray-800 dark:text-gray-200">
                <strong>Transaction Cancelled:</strong> You cancelled the
                transaction in your wallet. Click "Try Again" when you're ready
                to proceed.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex flex-col space-y-3">
          {!isConfigError && (
            <Button
              className="w-full"
              onClick={() => {
                setPaymentStep('select');
                setError(null);
              }}
            >
              {isRetryable ? 'Retry Payment' : 'Try Again'}
            </Button>
          )}

          {isBalanceError && (
            <Button
              onClick={() =>
                window.open(
                  `https://explorer.solana.com/address/${publicKey?.toString()}${solanaConfig.network !== 'mainnet-beta' ? `?cluster=${solanaConfig.network}` : ''}`,
                  '_blank'
                )
              }
              variant="outline"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Check Wallet Balance
            </Button>
          )}

          {isNetworkError && (
            <Button
              onClick={() =>
                window.open('https://status.solana.com/', '_blank')
              }
              variant="outline"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Check Solana Network Status
            </Button>
          )}

          {/* Support email removed per policy */}
        </div>

        {/* Transaction details if available for debugging */}
        {paymentDetails.txSignature && (
          <div className="rounded-lg border bg-muted/50 p-3 text-left">
            <p className="font-medium text-sm">Transaction ID for Support:</p>
            <p className="break-all font-mono text-muted-foreground text-xs">
              {paymentDetails.txSignature}
            </p>
          </div>
        )}
      </div>
    );
  };

  // Message Credits Purchase Functions
  const handleCreditsPurchase = async () => {
    if (!user) {
      setCreditsError('Please sign in first');
      return;
    }

    if (!(connected && publicKey)) {
      setCreditsError('Please connect your wallet first');
      return;
    }

    if (!solanaConfig.paymentAddress) {
      setCreditsError('Payment system not configured - please contact support');
      return;
    }

    try {
      setIsProcessingCredits(true);
      setCreditsPaymentStep('payment');

      setCreditsPaymentDetails({
        walletAddress: publicKey.toString(),
        amount: totalCreditsCost,
      });

      log.info('Message credits purchase initiated', {
        numberOfPacks,
        totalCreditsCost,
        user: user._id,
        walletAddress: publicKey.toString(),
      });
    } catch (err) {
      log.error('Credits purchase initiation failed', { error: err });
      setCreditsError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
      setCreditsPaymentStep('error');
    } finally {
      setIsProcessingCredits(false);
    }
  };

  const handleCreditsPaymentComplete = async (retryAttempt = 0) => {
    const MAX_RETRIES = 3;

    if (!(connected && publicKey && signTransaction)) {
      setCreditsError('Please connect your wallet first');
      return;
    }

    if (!solanaConfig.paymentAddress) {
      setCreditsError(
        'Payment address not configured - please contact support'
      );
      return;
    }

    try {
      setIsProcessingCredits(true);
      setCreditsPaymentStep('processing');
      setCreditsError(null);

      let txSignatureToVerify = creditsPaymentDetails.txSignature;

      // Only create and send a new transaction if we don't have a prior signature
      if (!txSignatureToVerify) {
        if (isSendingCreditsRef.current) {
          throw new Error('Payment already in progress');
        }

        isSendingCreditsRef.current = true;

        // Check wallet balance first
        if (!creditsTokenAmount) {
          throw new Error('Unable to calculate payment amount. Please try again.');
        }

        if (selectedCreditsToken === 'SOL') {
          const balance = await connection.getBalance(publicKey);
          const balanceSol = balance / 1_000_000_000;
          if (balanceSol < totalCreditsCost) {
            throw new Error(
              `Insufficient balance. Required: ${totalCreditsCost} SOL, Available: ${balanceSol.toFixed(4)} SOL`
            );
          }
        } else {
          // Validate SPL token balance
          const validation = await validateSPLTokenTransfer(
            connection,
            publicKey,
            selectedCreditsToken,
            creditsTokenAmount.rawAmount
          );
          
          if (!validation.isValid) {
            throw new Error(validation.error || 'Insufficient token balance');
          }
        }

        // Build transaction with referral payout if applicable
        const recipientPublicKey = new PublicKey(solanaConfig.paymentAddress);
        let tx: Transaction;

        if (selectedCreditsToken === 'SOL') {
          // SOL payment logic
          let mainAmount = totalCreditsCost;
          let referralAmount = 0;
          let referralWallet: string | undefined;

          if (referrerInfo?.hasReferrer) {
            referralAmount =
              Math.round(
                totalCreditsCost * (referrerInfo.commissionRate ?? 0) * 1_000_000
              ) / 1_000_000;
            mainAmount = Math.max(0, totalCreditsCost - referralAmount);
            referralWallet = referrerInfo.referrerWalletAddress;
          }

          // Create transfer to treasury
          const mainTx = await createPaymentTransaction(
            publicKey,
            recipientPublicKey,
            mainAmount
          );
          tx = mainTx;

          // Add referral payout transfer if applicable
          if (referralWallet && referralAmount > 0) {
            const referralIx = SystemProgram.transfer({
              fromPubkey: publicKey,
              toPubkey: new PublicKey(referralWallet),
              lamports: Math.floor(referralAmount * 1_000_000_000),
            });
            tx.add(referralIx);
          }
        } else {
          // SPL token payment logic
          // Note: For now, SPL token payments don't support referral payouts
          tx = await createSPLTokenTransferTransaction(
            connection,
            publicKey,
            recipientPublicKey,
            selectedCreditsToken,
            creditsTokenAmount.rawAmount,
            creditsTokenAmount.decimals
          );
        }

        log.info('Message credits transaction created', {
          numberOfPacks,
          amount: totalCreditsCost,
          token: selectedCreditsToken,
          tokenAmount: creditsTokenAmount.amount,
          recipient: solanaConfig.paymentAddress,
          sender: publicKey.toString(),
          attempt: retryAttempt + 1,
        });

        // Send transaction
        const sentSignature = await processPaymentTransaction(
          tx,
          signTransaction,
          {
            maxRetries: 0,
            skipPreflight: false,
          }
        );

        if (
          !sentSignature ||
          typeof sentSignature !== 'string' ||
          sentSignature.length < 64
        ) {
          throw new Error(`Invalid transaction signature: "${sentSignature}"`);
        }

        txSignatureToVerify = sentSignature;
        setCreditsPaymentDetails((prev) => ({
          ...prev,
          txSignature: sentSignature,
        }));

        log.info('Message credits transaction sent', {
          txSignature: sentSignature,
          attempt: retryAttempt + 1,
        });
      }

      // Submit to backend for verification
      let verificationResult;
      let lastError;

      for (let i = 0; i < 3; i++) {
        try {
          const verificationResponse = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              txSignature: txSignatureToVerify,
              expectedAmount: totalCreditsCost,
              paymentType: 'message_credits',
              packType: 'standard',
              numberOfPacks,
              walletAddress: publicKey.toString(),
              referralCode: referrerInfo?.hasReferrer
                ? referrerInfo.referralCode
                : undefined,
              referralPayoutTx: referrerInfo?.hasReferrer
                ? txSignatureToVerify
                : undefined,
              referrerWalletAddress: referrerInfo?.referrerWalletAddress,
              commissionRate: referrerInfo?.commissionRate,
              // Add SPL token data if using SPL tokens
              ...(selectedCreditsToken !== 'SOL' && creditsTokenAmount && {
                tokenAddress: selectedCreditsToken,
                tokenAmount: creditsTokenAmount.rawAmount,
                tokenSymbol: creditsTokenAmount.symbol,
                amountSol: totalCreditsCost, // SOL equivalent for verification
              }),
            }),
          });

          if (!verificationResponse.ok) {
            const errorText = await verificationResponse.text();
            throw new Error(
              `HTTP ${verificationResponse.status}: ${errorText}`
            );
          }

          verificationResult = await verificationResponse.json();
          break;
        } catch (fetchError) {
          lastError = fetchError;
          if (i < 2) {
            await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** i));
          }
        }
      }

      if (!verificationResult) {
        throw new Error(
          `Verification failed after 3 attempts: ${lastError instanceof Error ? lastError.message : 'Unknown error'}`
        );
      }

      if (verificationResult.success) {
        setCreditsPaymentStep('success');

        log.info('Message credits purchase verified', {
          txSignature: txSignatureToVerify,
          purchaseId: verificationResult.purchaseId,
          standardCredits: totalStandardCredits,
          premiumCredits: totalPremiumCredits,
        });

        // No full page reload needed; Convex queries update in realtime.
        // Briefly show success, then close the modal.
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        throw new Error(
          verificationResult.error || 'Purchase verification failed'
        );
      }
    } catch (err) {
      log.error('Message credits purchase failed', {
        error: err,
        attempt: retryAttempt + 1,
      });

      let errorMessage = 'Purchase processing failed';
      let isRetryable = false;

      if (err instanceof Error) {
        if (
          err.message.includes('DUPLICATE_TRANSACTION') ||
          err.message.includes('already been processed') ||
          err.message.includes('ALREADY_PROCESSED')
        ) {
          errorMessage =
            'This purchase has already been processed. Your credits will update automatically.';
          setCreditsPaymentStep('success');
          return;
        }

        // Handle other error types similar to subscription upgrade
        errorMessage = err.message;
        isRetryable =
          err.message.includes('Network') ||
          err.message.includes('timeout') ||
          err.message.includes('SIMULATION_FAILED');
      }

      if (isRetryable && retryAttempt < MAX_RETRIES) {
        const delay = 2000 * 2 ** retryAttempt;
        setTimeout(() => {
          handleCreditsPaymentComplete(retryAttempt + 1);
        }, delay);

        setCreditsError(
          `${errorMessage} - Retrying in ${delay / 1000} seconds... (Attempt ${retryAttempt + 1}/${MAX_RETRIES})`
        );
        return;
      }

      setCreditsError(errorMessage);
      setCreditsPaymentStep('error');
    } finally {
      isSendingCreditsRef.current = false;
      setIsProcessingCredits(false);
    }
  };

  const renderCreditsPackSelector = () => (
    <div className="space-y-6">
      {/* Current balance display */}
      {subscription && (
        <Card className="p-4 ring-1 ring-primary/10 transition hover:ring-primary/20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900">
                <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-base sm:text-lg">
                  Current Credits
                </h3>
                <p className="text-muted-foreground text-xs leading-snug sm:text-sm">
                  {subscription.messageCredits || 0} Standard •{' '}
                  {subscription.premiumMessageCredits || 0} Premium
                </p>
              </div>
            </div>
            {/* Removed redundant Buy More Credits button. Purchase action is available at bottom. */}
          </div>
        </Card>
      )}

      {/* Credit pack selection */}
      <Card className="p-4 ring-1 ring-border/50 transition hover:ring-primary/20 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-base sm:text-lg">
            Message Credit Pack
          </h3>
          <Badge className="bg-green-100 text-green-800">Best Value</Badge>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:grid-cols-3">
            {/* Pack details */}
            <div>
              <div className="group block h-full min-h-[8rem] cursor-default rounded-xl border border-green-200 bg-gradient-to-br from-green-50/50 to-transparent p-4 ring-1 ring-green-200/40 transition-all">
                <div className="flex h-full flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="font-semibold tracking-tight">
                        Credits
                      </div>
                    </div>
                    <div className="font-semibold text-foreground text-sm">
                      {MESSAGE_CREDIT_PACK.standardCredits +
                        MESSAGE_CREDIT_PACK.premiumCredits}{' '}
                      total
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {MESSAGE_CREDIT_PACK.standardCredits} standard +{' '}
                      {MESSAGE_CREDIT_PACK.premiumCredits} premium
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div>
              <div className="group block h-full min-h-[8rem] cursor-default rounded-xl border border-green-200 bg-gradient-to-br from-green-50/50 to-transparent p-4 ring-1 ring-green-200/40 transition-all">
                <div className="flex h-full flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="font-semibold tracking-tight">Price</div>
                    </div>
                    <div className="font-semibold text-foreground text-sm">
                      {MESSAGE_CREDIT_PACK.priceSOL} SOL
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      ≈ ${MESSAGE_CREDIT_PACK.priceUSD} USD
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quantity selector */}
            <div>
              <div className="group block h-full min-h-[8rem] cursor-default rounded-xl border border-green-200 bg-gradient-to-br from-green-50/50 to-transparent p-4 ring-1 ring-green-200/40 transition-all">
                <div className="flex h-full flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="font-semibold tracking-tight">Packs</div>
                    </div>
                    <div className="mt-1 flex items-center space-x-2">
                      <Button
                        className="h-6 w-6 p-0"
                        disabled={numberOfPacks <= 1}
                        onClick={() =>
                          setNumberOfPacks(Math.max(1, numberOfPacks - 1))
                        }
                        size="sm"
                        variant="outline"
                      >
                        -
                      </Button>
                      <span className="w-8 text-center font-bold text-sm">
                        {numberOfPacks}
                      </span>
                      <Button
                        className="h-6 w-6 p-0"
                        disabled={numberOfPacks >= 10}
                        onClick={() =>
                          setNumberOfPacks(Math.min(10, numberOfPacks + 1))
                        }
                        size="sm"
                        variant="outline"
                      >
                        +
                      </Button>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Max 10 packs
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Purchase summary */}
          <div>
            <h4 className="mb-2 font-medium">Purchase Summary</h4>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] sm:text-xs">
              <div className="rounded-xl border p-2">
                <div className="text-muted-foreground">Total Credits</div>
                <div className="font-medium">
                  {totalStandardCredits + totalPremiumCredits}
                </div>
              </div>
              <div className="rounded-xl border p-2">
                <div className="text-muted-foreground">Total Cost</div>
                <div className="font-medium">
                  {creditsTokenAmount 
                    ? `${creditsTokenAmount.amount.toFixed(creditsTokenAmount.decimals <= 6 ? creditsTokenAmount.decimals : 6)} ${creditsTokenAmount.symbol}`
                    : `${totalCreditsCost} SOL`
                  }
                </div>
              </div>
              <div className="rounded-xl border p-2">
                <div className="text-muted-foreground">Standard</div>
                <div className="font-medium">{totalStandardCredits}</div>
              </div>
              <div className="rounded-xl border p-2">
                <div className="text-muted-foreground">Premium</div>
                <div className="font-medium">{totalPremiumCredits}</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* SPL Token Selection for Credits */}
      {availableTokens && availableTokens.splTokens.length > 0 && (
        <Card className="p-4">
          <div className="mb-3">
            <label className="font-medium text-sm">Payment Token</label>
          </div>
          <Select onValueChange={setSelectedCreditsToken} value={selectedCreditsToken}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select payment token" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SOL">
                <div className="flex items-center gap-2">
                  <span className="font-medium">SOL</span>
                  <span className="text-muted-foreground text-sm">Solana</span>
                </div>
              </SelectItem>
              {availableTokens.splTokens.map((token: any) => (
                <SelectItem key={token.address} value={token.address}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{token.symbol}</span>
                    <span className="text-muted-foreground text-sm">{token.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>
      )}

      <div className="flex justify-end space-x-3">
        <Button onClick={handleClose} variant="outline">
          Maybe Later
        </Button>
        <Button
          className="bg-gradient-to-r from-green-500 to-green-600"
          disabled={isProcessingCredits || !creditsTokenAmount}
          onClick={handleCreditsPurchase}
        >
          {isProcessingCredits && (
            <Loader className="mr-2 h-4 w-4 animate-spin" />
          )}
          {creditsTokenAmount
            ? `Purchase Credits • ${creditsTokenAmount.amount.toFixed(creditsTokenAmount.decimals <= 6 ? creditsTokenAmount.decimals : 6)} ${creditsTokenAmount.symbol}`
            : 'Loading...'
          }
        </Button>
      </div>
    </div>
  );

  const renderCreditsPaymentInstructions = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mb-4 inline-flex rounded-full bg-gradient-to-r from-green-500 to-green-600 p-4">
          <Wallet className="h-8 w-8 text-primary-foreground" />
        </div>
        <h3 className="mb-2 font-semibold text-xl">Send Payment</h3>
        <p className="text-muted-foreground">
          {connected
            ? 'Click "Send Payment" to create and sign the transaction'
            : 'Connect your wallet to proceed with the payment'}
        </p>
      </div>

      <Card className="bg-muted/50 p-6">
        <div className="space-y-4">
          <div>
            <label className="font-medium text-gray-700 text-sm dark:text-gray-300">
              Purchase Summary
            </label>
            <div className="mt-1 rounded-lg border bg-background p-3">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Packs:</span>
                  <span className="font-medium">{numberOfPacks}</span>
                </div>
                <div className="flex justify-between">
                  <span>Standard Credits:</span>
                  <span className="font-medium">{totalStandardCredits}</span>
                </div>
                <div className="flex justify-between">
                  <span>Premium Credits:</span>
                  <span className="font-medium">{totalPremiumCredits}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">Total:</span>
                  <span className="font-bold">
                    {creditsTokenAmount 
                      ? `${creditsTokenAmount.amount.toFixed(creditsTokenAmount.decimals <= 6 ? creditsTokenAmount.decimals : 6)} ${creditsTokenAmount.symbol}`
                      : `${totalCreditsCost} SOL`
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="font-medium text-gray-700 text-sm dark:text-gray-300">
              Your Wallet
            </label>
            <div className="mt-1 rounded-lg border bg-background p-3">
              <div className="flex items-center justify-between">
                {connected && publicKey ? (
                  <span className="break-all font-mono text-sm">
                    {publicKey.toString()}
                  </span>
                ) : (
                  <span className="text-gray-500 text-sm">
                    Wallet not connected
                  </span>
                )}
                {connected && (
                  <Badge className="ml-2" variant="secondary">
                    Connected
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="font-medium text-gray-700 text-sm dark:text-gray-300">
              Payment Address
            </label>
            <div className="mt-1 rounded-lg border bg-card p-3 font-mono text-sm">
              <div className="flex items-center justify-between">
                <span className="break-all">
                  {solanaConfig.paymentAddress ||
                    'Payment address not configured'}
                </span>
                <Button
                  disabled={!solanaConfig.paymentAddress}
                  onClick={() =>
                    navigator.clipboard.writeText(
                      solanaConfig.paymentAddress || ''
                    )
                  }
                  size="sm"
                  variant="ghost"
                >
                  Copy
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
        <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertDescription className="text-green-800 dark:text-green-200">
          <div className="space-y-2">
            <p>
              <strong>Important:</strong> Send exactly{' '}
              {creditsTokenAmount 
                ? `${creditsTokenAmount.amount.toFixed(creditsTokenAmount.decimals <= 6 ? creditsTokenAmount.decimals : 6)} ${creditsTokenAmount.symbol}`
                : `${totalCreditsCost} SOL`
              }{' '}
              to avoid processing delays.
            </p>
            <p>
              Your message credits will be added automatically once payment is
              confirmed.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      <div className="flex flex-col space-y-3">
        {!connected && (
          <Button
            className="w-full"
            onClick={() => setVisible(true)}
            variant="outline"
          >
            <Wallet className="mr-2 h-4 w-4" />
            Connect Wallet
          </Button>
        )}
        {connected && (
          <Button
            className="w-full bg-gradient-to-r from-green-500 to-green-600"
            disabled={isProcessingCredits || !publicKey}
            onClick={() => handleCreditsPaymentComplete()}
          >
            {isProcessingCredits ? 'Processing Payment...' : 'Send Payment'}
          </Button>
        )}
      </div>
    </div>
  );

  const renderCreditsProcessingState = () => (
    <div className="space-y-6 py-8 text-center">
      <div className="relative">
        <Loader className="mx-auto h-12 w-12 animate-spin text-green-500" />
        <div className="absolute inset-0 flex items-center justify-center">
          <CreditCard className="h-6 w-6 text-green-600" />
        </div>
      </div>

      <div>
        <h3 className="mb-2 font-semibold text-xl">Processing Purchase</h3>
        <p className="text-muted-foreground">
          We're verifying your transaction on the Solana blockchain...
        </p>
        <p className="mt-2 text-muted-foreground text-sm">
          This usually takes 30-60 seconds
        </p>
      </div>

      {creditsPaymentDetails.txSignature && (
        <div className="space-y-3">
          <div className="rounded-lg border bg-muted/50 p-3/50">
            <p className="font-medium text-sm">Transaction ID:</p>
            <p className="break-all font-mono text-muted-foreground text-xs">
              {creditsPaymentDetails.txSignature}
            </p>
          </div>
          <Button
            onClick={() =>
              window.open(
                `https://explorer.solana.com/tx/${creditsPaymentDetails.txSignature}${
                  solanaConfig.network !== 'mainnet-beta'
                    ? `?cluster=${solanaConfig.network}`
                    : ''
                }`,
                '_blank'
              )
            }
            size="sm"
            variant="outline"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            View on Solana Explorer
          </Button>
        </div>
      )}
    </div>
  );

  const renderCreditsSuccessState = () => (
    <div className="space-y-4 py-8 text-center">
      <div className="inline-flex rounded-full bg-gradient-to-r from-green-500 to-green-600 p-4">
        <Check className="h-8 w-8 text-primary-foreground" />
      </div>
      <div>
        <h3 className="mb-2 font-semibold text-xl">Purchase Successful!</h3>
        <p className="text-muted-foreground">
          Your message credits have been added to your account.
        </p>
        <div className="mt-4 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
          <div className="space-y-1">
            <div className="font-medium text-green-800 dark:text-green-200">
              Credits Added:
            </div>
            <div className="text-green-700 dark:text-green-300">
              {totalStandardCredits} Standard + {totalPremiumCredits} Premium
            </div>
          </div>
        </div>
        {creditsPaymentDetails.txSignature && (
          <div className="mt-4">
            <Button
              onClick={() =>
                window.open(
                  `https://explorer.solana.com/tx/${creditsPaymentDetails.txSignature}`,
                  '_blank'
                )
              }
              size="sm"
              variant="outline"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View Transaction
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const renderCreditsErrorState = () => (
    <div className="space-y-6 py-8 text-center">
      <div className="inline-flex rounded-full bg-red-100 p-4 dark:bg-red-900/20">
        <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
      </div>

      <div>
        <h3 className="mb-2 font-semibold text-xl">Purchase Failed</h3>
        <p className="mb-4 text-muted-foreground">
          {creditsError ||
            'There was an issue processing your purchase. Please try again.'}
        </p>

        <div className="flex flex-col space-y-3">
          <Button
            className="w-full"
            onClick={() => {
              setCreditsPaymentStep('select');
              setCreditsError(null);
            }}
          >
            Try Again
          </Button>
        </div>

        {creditsPaymentDetails.txSignature && (
          <div className="rounded-lg border bg-muted/50 p-3 text-left">
            <p className="font-medium text-sm">Transaction ID for Support:</p>
            <p className="break-all font-mono text-muted-foreground text-xs">
              {creditsPaymentDetails.txSignature}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Dialog onOpenChange={handleClose} open={isOpen}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Sparkles className="h-5 w-5 text-primary" />
            </motion.div>
            <span>Upgrade Your Experience</span>
          </DialogTitle>
          <DialogDescription>
            Choose between subscription plans or purchase message credits
          </DialogDescription>
        </DialogHeader>

        <motion.div 
          className="mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Tabs
            className="w-full"
            onValueChange={(v: string) =>
              setActiveTab(v as 'subscription' | 'credits')
            }
            value={activeTab}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <TabsList className="grid w-full grid-cols-2 relative overflow-hidden">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5"
                  animate={{
                    background: [
                      "linear-gradient(90deg, rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))",
                      "linear-gradient(90deg, rgba(139, 92, 246, 0.05), rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05))",
                      "linear-gradient(90deg, rgba(16, 185, 129, 0.05), rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))",
                      "linear-gradient(90deg, rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))"
                    ]
                  }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                />
                <TabsTrigger
                  className="flex items-center space-x-1 sm:space-x-2 relative z-10 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-50 data-[state=active]:to-purple-50 dark:data-[state=active]:from-blue-900/20 dark:data-[state=active]:to-purple-900/20"
                  value="subscription"
                >
                  <motion.div
                    animate={{ 
                      rotate: activeTab === 'subscription' ? [0, 10, -10, 0] : 0,
                      scale: activeTab === 'subscription' ? [1, 1.1, 1] : 1
                    }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  >
                    <Crown className="h-4 w-4 flex-shrink-0" />
                  </motion.div>
                  <span className="hidden sm:inline">Subscription Plans</span>
                  <span className="sm:hidden">Plans</span>
                </TabsTrigger>
                <TabsTrigger
                  className="flex items-center space-x-1 sm:space-x-2 relative z-10 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-50 data-[state=active]:to-emerald-50 dark:data-[state=active]:from-green-900/20 dark:data-[state=active]:to-emerald-900/20"
                  value="credits"
                >
                  <motion.div
                    animate={{ 
                      rotate: activeTab === 'credits' ? [0, 360] : 0,
                      scale: activeTab === 'credits' ? [1, 1.1, 1] : 1
                    }}
                    transition={{ 
                      rotate: { duration: 2, repeat: activeTab === 'credits' ? Infinity : 0, ease: "linear" },
                      scale: { duration: 0.5, ease: "easeInOut" }
                    }}
                  >
                    <CreditCard className="h-4 w-4 flex-shrink-0" />
                  </motion.div>
                  <span className="hidden sm:inline">Message Credits</span>
                  <span className="sm:hidden">Credits</span>
                </TabsTrigger>
              </TabsList>
            </motion.div>

            <div className="mt-6 relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 25,
                    duration: 0.3
                  }}
                >
                  <TabsContent className="m-0" value="subscription">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={paymentStep}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                      >
                        {paymentStep === 'select' && (
                          <div className="space-y-6">
                            {/* Billing Period Toggle */}
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: 0.1 }}
                              className="flex items-center justify-center"
                            >
                              <div className="flex items-center space-x-1 rounded-lg bg-muted p-1">
                                <button
                                  onClick={() => setBillingPeriod('monthly')}
                                  className={cn(
                                    'rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                                    billingPeriod === 'monthly'
                                      ? 'bg-background text-foreground shadow-sm'
                                      : 'text-muted-foreground hover:text-foreground'
                                  )}
                                >
                                  Monthly
                                </button>
                                <button
                                  onClick={() => setBillingPeriod('yearly')}
                                  className={cn(
                                    'rounded-md px-3 py-1.5 text-sm font-medium transition-all relative',
                                    billingPeriod === 'yearly'
                                      ? 'bg-background text-foreground shadow-sm'
                                      : 'text-muted-foreground hover:text-foreground'
                                  )}
                                >
                                  Yearly
                                  <span className="ml-1 rounded-full bg-green-500 px-1.5 py-0.5 text-xs text-white">
                                    5% OFF
                                  </span>
                                </button>
                              </div>
                            </motion.div>

                            <motion.div 
                              className="grid grid-cols-1 gap-6 md:grid-cols-2"
                              initial="hidden"
                              animate="visible"
                              variants={{
                                visible: {
                                  transition: {
                                    staggerChildren: 0.1
                                  }
                                }
                              }}
                            >
                              <motion.div variants={{
                                hidden: { opacity: 0, y: 20 },
                                visible: { opacity: 1, y: 0 }
                              }}>
                                {renderTierCard('pro')}
                              </motion.div>
                              <motion.div variants={{
                                hidden: { opacity: 0, y: 20 },
                                visible: { opacity: 1, y: 0 }
                              }}>
                                {renderTierCard('pro_plus')}
                              </motion.div>
                            </motion.div>

                            {/* Token Selection */}
                            {availableTokens && availableTokens.splTokens.length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                              >
                                <Card className="p-4">
                                  <div className="mb-3">
                                    <label className="font-medium text-sm">Payment Token</label>
                                    <p className="text-muted-foreground text-xs">Choose how you'd like to pay</p>
                                  </div>
                                  <Select onValueChange={setSelectedToken} value={selectedToken}>
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select payment token" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="SOL">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium">SOL</span>
                                          <span className="text-muted-foreground text-sm">Solana</span>
                                        </div>
                                      </SelectItem>
                                      {availableTokens.splTokens.map((token: any) => (
                                        <SelectItem key={token.address} value={token.address}>
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium">{token.symbol}</span>
                                            <span className="text-muted-foreground text-sm">{token.name}</span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {tokenCalculation?.priceInfo && selectedToken !== 'SOL' && (
                                    <div className="mt-2 text-muted-foreground text-xs">
                                      Current price: {tokenCalculation.priceInfo.solPrice.toFixed(6)} SOL per {tokenCalculation.symbol}
                                      {tokenCalculation.priceInfo.lastUpdated && (
                                        <span className="ml-2">
                                          (Updated {new Date(tokenCalculation.priceInfo.lastUpdated).toLocaleTimeString()})
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </Card>
                              </motion.div>
                            )}

                            <motion.div 
                              className="flex justify-end space-x-3"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 }}
                            >
                              <Button onClick={handleClose} variant="outline">
                                Maybe Later
                              </Button>
                              <Button
                                className={cn('bg-gradient-to-r relative overflow-hidden transition-all duration-300 hover:scale-105', selectedConfig.color)}
                                disabled={isProcessing || !canUpgrade}
                                onClick={handleUpgrade}
                              >
                                <motion.span
                                  className="relative z-10 flex items-center gap-2"
                                  whileHover={{ x: 2 }}
                                >
                                  {isProcessing ? (
                                    <Loader className="h-4 w-4 animate-spin" />
                                  ) : (
                                    canUpgrade && <Sparkles className="h-4 w-4" />
                                  )}
                                  {canUpgrade
                                    ? `Upgrade to ${selectedConfig.name}`
                                    : 'Upgrade Unavailable'}
                                </motion.span>
                                {canUpgrade && (
                                  <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                                    animate={{ x: [-100, 100] }}
                                    transition={{
                                      duration: 3,
                                      repeat: Infinity,
                                      repeatType: "loop",
                                      ease: "linear"
                                    }}
                                  />
                                )}
                              </Button>
                            </motion.div>
                          </div>
                        )}

                        {paymentStep === 'payment' && renderPaymentInstructions()}
                        {paymentStep === 'processing' && renderProcessingState()}
                        {paymentStep === 'success' && renderSuccessState()}
                        {paymentStep === 'error' && renderErrorState()}
                      </motion.div>
                    </AnimatePresence>
                  </TabsContent>

                  <TabsContent className="m-0" value="credits">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={creditsPaymentStep}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                      >
                        {creditsPaymentStep === 'select' && renderCreditsPackSelector()}
                        {creditsPaymentStep === 'payment' && renderCreditsPaymentInstructions()}
                        {creditsPaymentStep === 'processing' && renderCreditsProcessingState()}
                        {creditsPaymentStep === 'success' && renderCreditsSuccessState()}
                        {creditsPaymentStep === 'error' && renderCreditsErrorState()}
                      </motion.div>
                    </AnimatePresence>
                  </TabsContent>
                </motion.div>
              </AnimatePresence>
            </div>
          </Tabs>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

export default UpgradeModal;
