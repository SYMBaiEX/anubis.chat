'use client';

import React, { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wrench, 
  RefreshCw, 
  CreditCard, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  User,
  Database
} from 'lucide-react';

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
  const trackDetailedUsage = useMutation(api.subscriptions.trackDetailedMessageUsage);
  const processPayment = useMutation(api.subscriptions.processPayment);
  const resetUsage = useMutation(api.subscriptions.resetMonthlyUsage);
  
  // Component state
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  
  // Test form states
  const [testModel, setTestModel] = useState('gpt-4o-mini');
  const [testTokensInput, setTestTokensInput] = useState(1000);
  const [testTokensOutput, setTestTokensOutput] = useState(500);
  const [testTier, setTestTier] = useState<'pro' | 'pro_plus'>('pro');
  const [testAmount, setTestAmount] = useState(0.05);

  const connection = new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com'
  );

  const showFeedback = (type: 'success' | 'error' | 'info', message: string) => {
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
      showFeedback('success', 
        `Tracked ${isPremium ? 'premium' : 'standard'} message. ` +
        `Usage: ${result.messagesUsed}/${result.messagesUsed + result.messagesRemaining}`
      );
    } catch (error) {
      showFeedback('error', `Failed to track usage: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        outputTokens: testTokensOutput
      });
      
      showFeedback('success', 
        `Tracked detailed usage for ${testModel}. ` +
        `Tokens: ${testTokensInput} in, ${testTokensOutput} out`
      );
    } catch (error) {
      showFeedback('error', `Failed to track detailed usage: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        amountSol: testAmount
      });
      
      showFeedback('success', `Test payment processed successfully! Payment ID: ${result.paymentId}`);
    } catch (error) {
      showFeedback('error', `Test payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetUsage = async () => {
    if (!currentUser) {
      showFeedback('error', 'User not authenticated');
      return;
    }

    if (!confirm('Are you sure you want to reset usage for this user? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      await resetUsage();
      showFeedback('success', 'Usage reset successfully');
    } catch (error) {
      showFeedback('error', `Failed to reset usage: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        case 'approaching_limit':
          // Simulate getting close to the limit (80%)
          const limit = subscriptionStatus?.messagesLimit || 50;
          const targetUsage = Math.floor(limit * 0.8);
          const currentUsage = subscriptionStatus?.messagesUsed || 0;
          operations = Math.max(0, targetUsage - currentUsage);
          
          for (let i = 0; i < operations && i < 10; i++) { // Cap at 10 for safety
            await trackUsage({ isPremiumModel: false });
          }
          break;
          
        case 'premium_limit':
          // Simulate hitting premium limit
          const premiumLimit = subscriptionStatus?.premiumMessagesLimit || 0;
          const currentPremium = subscriptionStatus?.premiumMessagesUsed || 0;
          operations = Math.min(5, Math.max(0, premiumLimit - currentPremium));
          
          for (let i = 0; i < operations; i++) {
            await trackUsage({ isPremiumModel: true });
          }
          break;
          
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
      
      showFeedback('success', `Simulated ${scenario.replace('_', ' ')} scenario`);
    } catch (error) {
      showFeedback('error', `Scenario simulation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
            <Alert className={`mb-4 ${
              feedback.type === 'success' ? 'border-green-500' : 
              feedback.type === 'error' ? 'border-red-500' : 
              'border-blue-500'
            }`}>
              {feedback.type === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
              {feedback.type === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
              {feedback.type === 'info' && <Zap className="h-4 w-4 text-blue-500" />}
              <AlertDescription>{feedback.message}</AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-muted-foreground">
            Development utilities for testing payment system integration. 
            Use with caution - these operations affect real data.
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="usage" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="usage">Usage Testing</TabsTrigger>
          <TabsTrigger value="payments">Payment Testing</TabsTrigger>
          <TabsTrigger value="scenarios">Test Scenarios</TabsTrigger>
          <TabsTrigger value="status">System Status</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual Usage Tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={() => handleTrackUsage(false)}
                  disabled={isLoading}
                  variant="outline"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Track Standard Message
                </Button>
                <Button 
                  onClick={() => handleTrackUsage(true)}
                  disabled={isLoading || subscriptionStatus?.tier === 'free'}
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
                    <Select value={testModel} onValueChange={setTestModel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                        <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                        <SelectItem value="claude-3.5-sonnet">Claude 3.5 Sonnet</SelectItem>
                        <SelectItem value="deepseek-chat">DeepSeek Chat</SelectItem>
                        <SelectItem value="deepseek-r1">DeepSeek R1</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="input-tokens">Input Tokens</Label>
                    <Input
                      id="input-tokens"
                      type="number"
                      value={testTokensInput}
                      onChange={(e) => setTestTokensInput(Number(e.target.value))}
                      min="1"
                      max="10000"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="output-tokens">Output Tokens</Label>
                    <Input
                      id="output-tokens"
                      type="number"
                      value={testTokensOutput}
                      onChange={(e) => setTestTokensOutput(Number(e.target.value))}
                      min="1"
                      max="10000"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={handleTrackDetailedUsage}
                      disabled={isLoading}
                      className="w-full"
                    >
                      Track Detailed Usage
                    </Button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button 
                  onClick={handleResetUsage}
                  disabled={isLoading}
                  variant="destructive"
                  size="sm"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset Usage (Dev Only)
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Resets monthly usage counters for the current user
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Testing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="test-tier">Test Tier</Label>
                  <Select value={testTier} onValueChange={(value: 'pro' | 'pro_plus') => setTestTier(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pro">Pro (0.05 SOL)</SelectItem>
                      <SelectItem value="pro_plus">Pro+ (0.1 SOL)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="test-amount">Test Amount (SOL)</Label>
                  <Input
                    id="test-amount"
                    type="number"
                    step="0.001"
                    value={testAmount}
                    onChange={(e) => setTestAmount(Number(e.target.value))}
                  />
                </div>
              </div>

              <Button 
                onClick={handleTestPayment}
                disabled={isLoading || !publicKey}
                className="w-full"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Process Test Payment
              </Button>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Test payments use mock transaction signatures and will be processed through the backend 
                  validation system. No actual blockchain transactions are created.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage Scenario Testing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <Button 
                  onClick={() => simulateUsageScenario('approaching_limit')}
                  disabled={isLoading}
                  variant="outline"
                >
                  Simulate Approaching Limit (80%)
                </Button>
                <Button 
                  onClick={() => simulateUsageScenario('premium_limit')}
                  disabled={isLoading || subscriptionStatus?.tier === 'free'}
                  variant="outline"
                >
                  Simulate Premium Limit Hit
                </Button>
                <Button 
                  onClick={() => simulateUsageScenario('mixed_usage')}
                  disabled={isLoading}
                  variant="outline"
                >
                  Simulate Mixed Usage Pattern
                </Button>
              </div>

              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  These scenarios will create multiple usage entries to test different states of the system.
                  Use carefully as they will affect your actual usage counters.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 border rounded">
                      <div className="text-sm text-muted-foreground">Wallet</div>
                      <div className="font-mono text-xs">
                        {currentUser.walletAddress?.slice(0, 8)}...{currentUser.walletAddress?.slice(-8)}
                      </div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="text-sm text-muted-foreground">Tier</div>
                      <Badge className="mt-1">{subscriptionStatus.tier.toUpperCase()}</Badge>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="text-sm text-muted-foreground">Status</div>
                      <Badge variant={currentUser.isActive ? 'default' : 'destructive'}>
                        {currentUser.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="text-sm text-muted-foreground">Role</div>
                      <div className="font-semibold">{currentUser.role || 'User'}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Standard Messages</span>
                        <Badge variant="outline">
                          {getUsagePercentage(subscriptionStatus.messagesUsed, subscriptionStatus.messagesLimit)}%
                        </Badge>
                      </div>
                      <div className="text-2xl font-bold">
                        {subscriptionStatus.messagesUsed} / {subscriptionStatus.messagesLimit}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className={`h-2 rounded-full ${
                            getUsagePercentage(subscriptionStatus.messagesUsed, subscriptionStatus.messagesLimit) > 90 
                              ? 'bg-red-500' 
                              : getUsagePercentage(subscriptionStatus.messagesUsed, subscriptionStatus.messagesLimit) > 75 
                                ? 'bg-yellow-500' 
                                : 'bg-green-500'
                          }`}
                          style={{ 
                            width: `${getUsagePercentage(subscriptionStatus.messagesUsed, subscriptionStatus.messagesLimit)}%` 
                          }}
                        />
                      </div>
                    </div>

                    <div className="p-4 border rounded">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Premium Messages</span>
                        <Badge variant="outline">
                          {getUsagePercentage(subscriptionStatus.premiumMessagesUsed, subscriptionStatus.premiumMessagesLimit)}%
                        </Badge>
                      </div>
                      <div className="text-2xl font-bold">
                        {subscriptionStatus.premiumMessagesUsed} / {subscriptionStatus.premiumMessagesLimit}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className={`h-2 rounded-full ${
                            getUsagePercentage(subscriptionStatus.premiumMessagesUsed, subscriptionStatus.premiumMessagesLimit) > 90 
                              ? 'bg-red-500' 
                              : getUsagePercentage(subscriptionStatus.premiumMessagesUsed, subscriptionStatus.premiumMessagesLimit) > 75 
                                ? 'bg-yellow-500' 
                                : 'bg-green-500'
                          }`}
                          style={{ 
                            width: `${getUsagePercentage(subscriptionStatus.premiumMessagesUsed, subscriptionStatus.premiumMessagesLimit)}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 border rounded bg-muted">
                    <div className="text-sm text-muted-foreground mb-2">Period</div>
                    <div className="text-sm">
                      {new Date(subscriptionStatus.currentPeriodStart).toLocaleDateString()} - {' '}
                      {new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
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