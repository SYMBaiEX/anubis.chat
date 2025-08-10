'use client';

import { api } from '@convex/_generated/api';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import { useMutation, useQuery } from 'convex/react';
import {
  AlertTriangle,
  CheckCircle,
  CreditCard,
  Database,
  RefreshCw,
  User,
  Wrench,
  XCircle,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectItem } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Payment System Development Tools
 *
 * Provides utilities for testing and debugging the payment system during development:
 * - Manual usage tracking
 * - Subscription tier simulation
 * - Test payment processing
 * - Usage reset utilities
 * - Feature gate testing
 * - Quota manipulation for testing edge cases
 */
export function PaymentDevTools() {
  const { publicKey, sendTransaction } = useWallet();

  // Convex queries and mutations
  const currentUser = useQuery(api.users.getCurrentUserProfile);
  const subscriptionStatus = useQuery(api.subscriptions.getSubscriptionStatus);
  const trackUsage = useMutation(api.subscriptions.trackMessageUsage);
  const trackDetailedUsage = useMutation(
    api.subscriptions.trackDetailedMessageUsage
  );
  const processPayment = useMutation(api.subscriptions.processPayment);
  const resetUsage = useMutation(api.subscriptions.resetMonthlyUsage);

  // Component state
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Test form states
  const [testModel, setTestModel] = useState('gpt-4o-mini');
  const [testTokensInput, setTestTokensInput] = useState(1000);
  const [testTokensOutput, setTestTokensOutput] = useState(500);
  const [testTier, setTestTier] = useState<'pro' | 'pro_plus'>('pro');
  const [testAmount, setTestAmount] = useState(0.05);

  const connection = new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com'
  );

  const showFeedback = (
    type: 'success' | 'error' | 'info',
    message: string
  ) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleTrackUsage = async (isPremium: boolean) => {
    if (!currentUser) {
      showFeedback('error', 'User not authenticated');
      return;
    }

    setIsLoading(true);
    try {
      const result = await trackUsage({ isPremiumModel: isPremium });
      showFeedback(
        'success',
        `Tracked ${isPremium ? 'premium' : 'standard'} message. ` +
          `Usage: ${result.messagesUsed}/${result.messagesUsed + result.messagesRemaining}`
      );
    } catch (error) {
      showFeedback(
        'error',
        `Failed to track usage: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrackDetailedUsage = async () => {
    if (!currentUser) {
      showFeedback('error', 'User not authenticated');
      return;
    }

    setIsLoading(true);
    try {
      const result = await trackDetailedUsage({
        model: testModel,
        inputTokens: testTokensInput,
        outputTokens: testTokensOutput,
      });

      showFeedback(
        'success',
        `Tracked detailed usage for ${testModel}. ` +
          `Tokens: ${testTokensInput} in, ${testTokensOutput} out`
      );
    } catch (error) {
      showFeedback(
        'error',
        `Failed to track detailed usage: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestPayment = async () => {
    if (!publicKey) {
      showFeedback('error', 'Wallet not connected');
      return;
    }

    setIsLoading(true);
    try {
      // Create a test signature (in real scenario, this would be from an actual transaction)
      const testSignature = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const result = await processPayment({
        tier: testTier,
        txSignature: testSignature,
        amountSol: testAmount,
      });

      showFeedback(
        'success',
        `Test payment processed successfully! Payment ID: ${result.paymentId}`
      );
    } catch (error) {
      showFeedback(
        'error',
        `Test payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetUsage = async () => {
    if (!currentUser) {
      showFeedback('error', 'User not authenticated');
      return;
    }

    if (
      !confirm(
        'Are you sure you want to reset usage for this user? This action cannot be undone.'
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      await resetUsage();
      showFeedback('success', 'Usage reset successfully');
    } catch (error) {
      showFeedback(
        'error',
        `Failed to reset usage: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const simulateUsageScenario = async (scenario: string) => {
    if (!currentUser) {
      showFeedback('error', 'User not authenticated');
      return;
    }

    setIsLoading(true);
    try {
      let operations = 0;

      switch (scenario) {
        case 'approaching_limit': {
          // Simulate getting close to the limit (80%)
          const limit = subscriptionStatus?.messagesLimit || 50;
          const targetUsage = Math.floor(limit * 0.8);
          const currentUsage = subscriptionStatus?.messagesUsed || 0;
          operations = Math.max(0, targetUsage - currentUsage);

          for (let i = 0; i < operations && i < 10; i++) {
            // Cap at 10 for safety
            await trackUsage({ isPremiumModel: false });
          }
          break;
        }

        case 'premium_limit': {
          // Simulate hitting premium limit
          const premiumLimit = subscriptionStatus?.premiumMessagesLimit || 0;
          const currentPremium = subscriptionStatus?.premiumMessagesUsed || 0;
          operations = Math.min(5, Math.max(0, premiumLimit - currentPremium));

          for (let i = 0; i < operations; i++) {
            await trackUsage({ isPremiumModel: true });
          }
          break;
        }

        case 'mixed_usage':
          // Simulate mixed standard and premium usage
          for (let i = 0; i < 3; i++) {
            await trackUsage({ isPremiumModel: false });
            if (subscriptionStatus?.tier !== 'free') {
              await trackUsage({ isPremiumModel: true });
            }
          }
          break;
      }

      showFeedback(
        'success',
        `Simulated ${scenario.replace('_', ' ')} scenario`
      );
    } catch (error) {
      showFeedback(
        'error',
        `Scenario simulation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit <= 0) return 0;
    return Math.round((used / limit) * 100);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Payment System Dev Tools
          </CardTitle>
        </CardHeader>
        <CardContent>
          {feedback && (
            <Alert
              className={`mb-4 ${
                feedback.type === 'success'
                  ? 'border-green-500'
                  : feedback.type === 'error'
                    ? 'border-red-500'
                    : 'border-blue-500'
              }`}
            >
              {feedback.type === 'success' && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              {feedback.type === 'error' && (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              {feedback.type === 'info' && (
                <Zap className="h-4 w-4 text-blue-500" />
              )}
              <AlertDescription>{feedback.message}</AlertDescription>
            </Alert>
          )}

          <div className="text-muted-foreground text-sm">
            Development utilities for testing payment system integration. Use
            with caution - these operations affect real data.
          </div>
        </CardContent>
      </Card>

      <Tabs className="w-full" defaultValue="usage">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="usage">Usage Testing</TabsTrigger>
          <TabsTrigger value="payments">Payment Testing</TabsTrigger>
          <TabsTrigger value="scenarios">Test Scenarios</TabsTrigger>
          <TabsTrigger value="status">System Status</TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-4" value="usage">
          <Card>
            <CardHeader>
              <CardTitle>Manual Usage Tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  disabled={isLoading}
                  onClick={() => handleTrackUsage(false)}
                  variant="outline"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Track Standard Message
                </Button>
                <Button
                  disabled={isLoading || subscriptionStatus?.tier === 'free'}
                  onClick={() => handleTrackUsage(true)}
                  variant="outline"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Track Premium Message
                </Button>
              </div>

              <div className="space-y-3">
                <Label>Detailed Usage Tracking</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="test-model">Model</Label>
                    <Select
                      value={testModel}
                      onChange={(e) => setTestModel(e.currentTarget.value)}
                    >
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                      <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                      <SelectItem value="claude-3.5-sonnet">Claude 3.5 Sonnet</SelectItem>
                      <SelectItem value="deepseek-chat">DeepSeek Chat</SelectItem>
                      <SelectItem value="deepseek-r1">DeepSeek R1</SelectItem>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="input-tokens">Input Tokens</Label>
                    <Input
                      id="input-tokens"
                      max="10000"
                      min="1"
                      onChange={(e) =>
                        setTestTokensInput(Number(e.target.value))
                      }
                      type="number"
                      value={testTokensInput}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="output-tokens">Output Tokens</Label>
                    <Input
                      id="output-tokens"
                      max="10000"
                      min="1"
                      onChange={(e) =>
                        setTestTokensOutput(Number(e.target.value))
                      }
                      type="number"
                      value={testTokensOutput}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      className="w-full"
                      disabled={isLoading}
                      onClick={handleTrackDetailedUsage}
                    >
                      Track Detailed Usage
                    </Button>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <Button
                  disabled={isLoading}
                  onClick={handleResetUsage}
                  size="sm"
                  variant="destructive"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset Usage (Dev Only)
                </Button>
                <p className="mt-2 text-muted-foreground text-xs">
                  Resets monthly usage counters for the current user
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-4" value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment Testing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="test-tier">Test Tier</Label>
                  <Select
                    value={testTier}
                    onChange={(e) =>
                      setTestTier(e.currentTarget.value as 'pro' | 'pro_plus')
                    }
                  >
                    <SelectItem value="pro">Pro (0.05 SOL)</SelectItem>
                    <SelectItem value="pro_plus">Pro+ (0.1 SOL)</SelectItem>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="test-amount">Test Amount (SOL)</Label>
                  <Input
                    id="test-amount"
                    onChange={(e) => setTestAmount(Number(e.target.value))}
                    step="0.001"
                    type="number"
                    value={testAmount}
                  />
                </div>
              </div>

              <Button
                className="w-full"
                disabled={isLoading || !publicKey}
                onClick={handleTestPayment}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Process Test Payment
              </Button>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Test payments use mock transaction signatures and will be
                  processed through the backend validation system. No actual
                  blockchain transactions are created.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-4" value="scenarios">
          <Card>
            <CardHeader>
              <CardTitle>Usage Scenario Testing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <Button
                  disabled={isLoading}
                  onClick={() => simulateUsageScenario('approaching_limit')}
                  variant="outline"
                >
                  Simulate Approaching Limit (80%)
                </Button>
                <Button
                  disabled={isLoading || subscriptionStatus?.tier === 'free'}
                  onClick={() => simulateUsageScenario('premium_limit')}
                  variant="outline"
                >
                  Simulate Premium Limit Hit
                </Button>
                <Button
                  disabled={isLoading}
                  onClick={() => simulateUsageScenario('mixed_usage')}
                  variant="outline"
                >
                  Simulate Mixed Usage Pattern
                </Button>
              </div>

              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  These scenarios will create multiple usage entries to test
                  different states of the system. Use carefully as they will
                  affect your actual usage counters.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-4" value="status">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Current User Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentUser && subscriptionStatus ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="rounded border p-3">
                      <div className="text-muted-foreground text-sm">
                        Wallet
                      </div>
                      <div className="font-mono text-xs">
                        {currentUser.walletAddress?.slice(0, 8)}...
                        {currentUser.walletAddress?.slice(-8)}
                      </div>
                    </div>
                    <div className="rounded border p-3">
                      <div className="text-muted-foreground text-sm">Tier</div>
                      <Badge className="mt-1">
                        {subscriptionStatus.tier.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="rounded border p-3">
                      <div className="text-muted-foreground text-sm">
                        Status
                      </div>
                      <Badge
                        variant={
                          currentUser.isActive ? 'default' : 'destructive'
                        }
                      >
                        {currentUser.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="rounded border p-3">
                      <div className="text-muted-foreground text-sm">Role</div>
                      <div className="font-semibold">
                        {currentUser.role || 'User'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded border p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-medium text-sm">
                          Standard Messages
                        </span>
                        <Badge variant="outline">
                          {getUsagePercentage(
                            subscriptionStatus?.messagesUsed ?? 0,
                            subscriptionStatus?.messagesLimit ?? 0
                          )}
                          %
                        </Badge>
                      </div>
                      <div className="font-bold text-2xl">
                        {subscriptionStatus.messagesUsed} /{' '}
                        {subscriptionStatus.messagesLimit}
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                        <div
                          className={`h-2 rounded-full ${
                            getUsagePercentage(
                              subscriptionStatus?.messagesUsed ?? 0,
                              subscriptionStatus?.messagesLimit ?? 0
                            ) > 90
                              ? 'bg-red-500'
                              : getUsagePercentage(
                                    subscriptionStatus?.messagesUsed ?? 0,
                                    subscriptionStatus?.messagesLimit ?? 0
                                  ) > 75
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                          }`}
                          style={{
                            width: `${getUsagePercentage(
                              subscriptionStatus?.messagesUsed ?? 0,
                              subscriptionStatus?.messagesLimit ?? 0
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="rounded border p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-medium text-sm">
                          Premium Messages
                        </span>
                        <Badge variant="outline">
                          {getUsagePercentage(
                            subscriptionStatus?.premiumMessagesUsed ?? 0,
                            subscriptionStatus?.premiumMessagesLimit ?? 0
                          )}
                          %
                        </Badge>
                      </div>
                      <div className="font-bold text-2xl">
                        {subscriptionStatus.premiumMessagesUsed} /{' '}
                        {subscriptionStatus.premiumMessagesLimit}
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                        <div
                          className={`h-2 rounded-full ${
                            getUsagePercentage(
                              subscriptionStatus?.premiumMessagesUsed ?? 0,
                              subscriptionStatus?.premiumMessagesLimit ?? 0
                            ) > 90
                              ? 'bg-red-500'
                              : getUsagePercentage(
                                    subscriptionStatus?.premiumMessagesUsed ?? 0,
                                    subscriptionStatus?.premiumMessagesLimit ?? 0
                                  ) > 75
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                          }`}
                          style={{
                            width: `${getUsagePercentage(
                              subscriptionStatus?.premiumMessagesUsed ?? 0,
                              subscriptionStatus?.premiumMessagesLimit ?? 0
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded border bg-muted p-3">
                    <div className="mb-2 text-muted-foreground text-sm">
                      Period
                    </div>
                    <div className="text-sm">
                      {subscriptionStatus?.currentPeriodStart != null
                        ? new Date(
                            subscriptionStatus.currentPeriodStart
                          ).toLocaleDateString()
                        : '—'}{' '}
                      -{' '}
                      {subscriptionStatus?.currentPeriodEnd != null
                        ? new Date(
                            subscriptionStatus.currentPeriodEnd
                          ).toLocaleDateString()
                        : '—'}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {subscriptionStatus.daysRemaining} days remaining
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  User not authenticated or data not loaded
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default PaymentDevTools;
