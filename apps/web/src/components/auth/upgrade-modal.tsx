'use client';

import { useState } from 'react';
import { X, Crown, Zap, Shield, Check, Wallet, AlertCircle, Loader, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { createModuleLogger } from '@/lib/utils/logger';
import { paymentConfig, solanaConfig } from '@/lib/env';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
// useCurrentUser replacement - using useSubscription hook instead
import { useSubscription } from '@/hooks/use-subscription';

// Initialize logger
const log = createModuleLogger('upgrade-modal');

export interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestedTier?: 'pro' | 'pro_plus';
  trigger?: 'limit_reached' | 'feature_request' | 'manual';
}

// Subscription tier configurations
const TIER_CONFIG = {
  pro: {
    name: 'Pro',
    priceSOL: paymentConfig.subscription.pro.priceSOL,
    priceUSD: paymentConfig.subscription.pro.priceUSD,
    messages: 1500,
    premiumMessages: 100,
    color: 'from-blue-500 to-blue-600',
    icon: Zap,
    popular: true,
    features: [
      'Standard Models Access',
      '1,500 messages per month',
      '100 premium model messages',
      'GPT-4o & Claude 3.5 Sonnet',
      'Document upload & processing',
      'Basic agents & workflows',
      'Chat history & export',
      'Priority customer support'
    ]
  },
  pro_plus: {
    name: 'Pro+',
    priceSOL: paymentConfig.subscription.proPLus.priceSOL,
    priceUSD: paymentConfig.subscription.proPLus.priceUSD,
    messages: 3000,
    premiumMessages: 300,
    color: 'from-purple-500 to-purple-600',
    icon: Shield,
    popular: false,
    features: [
      'Everything in Pro',
      '3,000 messages per month',
      '300 premium model messages',
      'All AI models available',
      'Large document uploads (50MB+)',
      'Advanced agents & custom tools',
      'API access for development',
      'Unlimited chat history',
      'Priority support & early access'
    ]
  }
};

export function UpgradeModal({ isOpen, onClose, suggestedTier = 'pro', trigger = 'manual' }: UpgradeModalProps) {
  const [selectedTier, setSelectedTier] = useState<'pro' | 'pro_plus'>(suggestedTier);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'select' | 'payment' | 'processing' | 'success' | 'error'>('select');
  const [error, setError] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<{
    walletAddress?: string;
    txSignature?: string;
    amount?: number;
  }>({});

  // User data comes from useSubscription hook
  const { subscription, upgradePrompt } = useSubscription();
  const processPayment = useMutation(api.subscriptions.processPayment);
  
  // Get user data from Convex query
  const user = useQuery(api.users.getCurrentUserProfile);

  const selectedConfig = TIER_CONFIG[selectedTier];

  const handleUpgrade = async () => {
    if (!user) {
      setError('Please sign in first');
      return;
    }

    try {
      setIsProcessing(true);
      setPaymentStep('payment');

      // Create payment instructions
      setPaymentDetails({
        walletAddress: user.walletAddress,
        amount: selectedConfig.priceSOL,
      });

      log.info('Upgrade initiated', {
        tier: selectedTier,
        user: user._id,
        walletAddress: user.walletAddress,
        trigger,
      });

    } catch (err) {
      log.error('Upgrade failed', { error: err });
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setPaymentStep('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentComplete = async (txSignature: string) => {
    try {
      setIsProcessing(true);
      setPaymentStep('processing');

      const result = await processPayment({
        userId: user._id,
        tier: selectedTier,
        txSignature,
        amountSol: selectedConfig.priceSOL,
      });

      if (result.success) {
        setPaymentStep('success');
        setPaymentDetails(prev => ({ ...prev, txSignature }));
        
        log.info('Payment processed successfully', {
          tier: selectedTier,
          txSignature,
          paymentId: result.paymentId,
        });

        // Close modal after 3 seconds
        setTimeout(() => {
          onClose();
          setPaymentStep('select');
          setError(null);
        }, 3000);
      }
    } catch (err) {
      log.error('Payment processing failed', { error: err });
      setError(err instanceof Error ? err.message : 'Payment processing failed');
      setPaymentStep('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (paymentStep !== 'processing') {
      onClose();
      setPaymentStep('select');
      setError(null);
      setPaymentDetails({});
    }
  };

  const renderTierCard = (tier: 'pro' | 'pro_plus') => {
    const config = TIER_CONFIG[tier];
    const Icon = config.icon;
    const isSelected = selectedTier === tier;
    const currentTier = subscription?.tier;
    const isCurrentTier = currentTier === tier;
    const isDowngrade = currentTier === 'pro_plus' && tier === 'pro';

    return (
      <Card
        key={tier}
        className={cn(
          'relative p-6 cursor-pointer transition-all duration-200 border-2',
          isSelected 
            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-lg' 
            : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600',
          isCurrentTier && 'opacity-50 cursor-not-allowed',
          isDowngrade && 'opacity-50 cursor-not-allowed'
        )}
        onClick={() => {
          if (!isCurrentTier && !isDowngrade) {
            setSelectedTier(tier);
          }
        }}
      >
        {config.popular && (
          <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-orange-600">
            Most Popular
          </Badge>
        )}
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={cn('p-2 rounded-lg bg-gradient-to-r', config.color)}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{config.name}</h3>
              <p className="text-sm text-muted-foreground">
                {config.messages.toLocaleString()} messages/month
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-xl">{config.priceSOL} SOL</div>
            <div className="text-sm text-muted-foreground">≈ ${config.priceUSD}/month</div>
          </div>
        </div>

        <div className="space-y-3">
          {config.features.map((feature, index) => (
            <div key={index} className="flex items-start space-x-2">
              <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
            </div>
          ))}
        </div>

        {isCurrentTier && (
          <div className="mt-4 p-2 bg-gray-100 dark:bg-gray-800 rounded text-center">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Current Plan
            </span>
          </div>
        )}
      </Card>
    );
  };

  const renderPaymentInstructions = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className={cn('inline-flex p-4 rounded-full bg-gradient-to-r', selectedConfig.color, 'mb-4')}>
          <Wallet className="h-8 w-8 text-white" />
        </div>
        <h3 className="font-semibold text-xl mb-2">Send Payment</h3>
        <p className="text-muted-foreground">
          Send exactly {selectedConfig.priceSOL} SOL to complete your {selectedConfig.name} upgrade
        </p>
      </div>

      <Card className="p-6 bg-gray-50 dark:bg-gray-800/50">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Payment Address
            </label>
            <div className="mt-1 p-3 bg-white dark:bg-gray-900 border rounded-lg font-mono text-sm">
              {/* Replace with your actual payment wallet address */}
              <div className="flex items-center justify-between">
                <span className="break-all">{solanaConfig.paymentAddress || 'Payment address not configured'}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(solanaConfig.paymentAddress || '')}
                  disabled={!solanaConfig.paymentAddress}
                >
                  Copy
                </Button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Amount
            </label>
            <div className="mt-1 p-3 bg-white dark:bg-gray-900 border rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{selectedConfig.priceSOL} SOL</span>
                <span className="text-sm text-muted-foreground">
                  ≈ ${selectedConfig.priceUSD} USD
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
            <p><strong>Important:</strong> Send exactly {selectedConfig.priceSOL} SOL to avoid processing delays.</p>
            <p>Your subscription will activate automatically once the payment is confirmed on the blockchain.</p>
          </div>
        </AlertDescription>
      </Alert>

      <div className="flex flex-col space-y-3">
        <Button
          onClick={() => window.open('https://phantom.app/', '_blank')}
          variant="outline"
          className="w-full"
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Open Phantom Wallet
        </Button>
        <Button
          onClick={() => setPaymentStep('processing')}
          className="w-full"
          disabled={isProcessing}
        >
          I've Sent the Payment
        </Button>
      </div>
    </div>
  );

  const renderProcessingState = () => (
    <div className="text-center space-y-4 py-8">
      <div className="relative">
        <Loader className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Wallet className="h-6 w-6 text-blue-600" />
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-xl mb-2">Processing Payment</h3>
        <p className="text-muted-foreground">
          We're verifying your transaction on the Solana blockchain...
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          This usually takes 30-60 seconds
        </p>
      </div>
    </div>
  );

  const renderSuccessState = () => (
    <div className="text-center space-y-4 py-8">
      <div className={cn('inline-flex p-4 rounded-full bg-gradient-to-r', selectedConfig.color)}>
        <Check className="h-8 w-8 text-white" />
      </div>
      <div>
        <h3 className="font-semibold text-xl mb-2">Payment Successful!</h3>
        <p className="text-muted-foreground">
          Welcome to ISIS Chat {selectedConfig.name}! Your account has been upgraded.
        </p>
        {paymentDetails.txSignature && (
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://explorer.solana.com/tx/${paymentDetails.txSignature}`, '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View Transaction
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const renderErrorState = () => (
    <div className="text-center space-y-4 py-8">
      <div className="inline-flex p-4 rounded-full bg-red-100 dark:bg-red-900/20">
        <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
      </div>
      <div>
        <h3 className="font-semibold text-xl mb-2">Payment Failed</h3>
        <p className="text-muted-foreground mb-4">
          {error || 'There was an issue processing your payment. Please try again.'}
        </p>
        <div className="flex flex-col space-y-2">
          <Button onClick={() => setPaymentStep('select')} className="w-full">
            Try Again
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open('mailto:support@isischat.ai', '_blank')}
          >
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">Upgrade Your Plan</DialogTitle>
              <DialogDescription>
                {upgradePrompt?.message || 'Unlock more messages and premium AI models'}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={paymentStep === 'processing'}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="mt-6">
          {paymentStep === 'select' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderTierCard('pro')}
                {renderTierCard('pro_plus')}
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={handleClose}>
                  Maybe Later
                </Button>
                <Button 
                  onClick={handleUpgrade}
                  disabled={isProcessing}
                  className={cn('bg-gradient-to-r', selectedConfig.color)}
                >
                  {isProcessing && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                  Upgrade to {selectedConfig.name}
                </Button>
              </div>
            </div>
          )}

          {paymentStep === 'payment' && renderPaymentInstructions()}
          {paymentStep === 'processing' && renderProcessingState()}
          {paymentStep === 'success' && renderSuccessState()}
          {paymentStep === 'error' && renderErrorState()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default UpgradeModal;