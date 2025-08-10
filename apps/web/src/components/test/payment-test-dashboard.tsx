'use client';

import { api } from '@convex/_generated/api';
import { useWallet } from '@solana/wallet-adapter-react';
import { useQuery } from 'convex/react';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  CreditCard,
  Database,
  Info,
  RefreshCw,
  Shield,
  TestTube,
  Users,
  Wallet,
  Wrench,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSubscription } from '@/hooks/use-subscription';
import { PaymentDevTools } from './payment-dev-tools';
import { PaymentIntegrationTest } from './payment-integration-test';
import { PaymentValidationSuite } from './payment-validation-suite';
import { WalletIntegrationTest } from './wallet-integration-test';

interface SystemHealth {
  auth: 'healthy' | 'warning' | 'error';
  payment: 'healthy' | 'warning' | 'error';
  subscription: 'healthy' | 'warning' | 'error';
  wallet: 'healthy' | 'warning' | 'error';
  overall: 'healthy' | 'warning' | 'error';
}

/**
 * Payment Test Dashboard
 *
 * Comprehensive testing dashboard for the Convex Auth + Solana payment system.
 * Provides unified access to all testing tools and real-time system monitoring.
 *
 * Features:
 * - System health monitoring
 * - Integration testing suite
 * - Development tools for debugging
 * - Security validation suite
 * - Wallet integration testing
 * - Real-time status monitoring
 * - Performance metrics
 */
export function PaymentTestDashboard() {
  const { publicKey, connected } = useWallet();
  const auth = useAuthContext();
  const { subscription, limits, isLoading } = useSubscription();
  const currentUser = useQuery(api.users.getCurrentUserProfile);

  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    auth: 'healthy',
    payment: 'healthy',
    subscription: 'healthy',
    wallet: 'healthy',
    overall: 'healthy',
  });
  const [lastHealthCheck, setLastHealthCheck] = useState<number>(Date.now());
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Monitor system health
  useEffect(() => {
    const checkSystemHealth = () => {
      const health: SystemHealth = {
        auth: 'healthy',
        payment: 'healthy',
        subscription: 'healthy',
        wallet: 'healthy',
        overall: 'healthy',
      };

      // Check auth health
      if (!(auth.isAuthenticated && currentUser)) {
        health.auth = 'error';
      } else if (auth.isLoading) {
        health.auth = 'warning';
      }

      // Check wallet health
      if (!(connected && publicKey)) {
        health.wallet = 'error';
      }

      // Check subscription health
      if (!subscription) {
        health.subscription = 'error';
      } else if (subscription.messagesUsed >= subscription.messagesLimit) {
        health.subscription = 'warning';
      } else if (
        subscription.tier === 'free' &&
        subscription.messagesUsed > subscription.messagesLimit * 0.8
      ) {
        health.subscription = 'warning';
      }

      // Check payment system health (basic validation)
      if (health.auth === 'error' || health.wallet === 'error') {
        health.payment = 'error';
      } else if (subscription?.isExpired) {
        health.payment = 'warning';
      }

      // Determine overall health
      const healthValues = Object.values(health).filter((h) => h !== 'healthy');
      if (healthValues.includes('error')) {
        health.overall = 'error';
      } else if (healthValues.includes('warning')) {
        health.overall = 'warning';
      }

      setSystemHealth(health);
      setLastHealthCheck(Date.now());
    };

    checkSystemHealth();

    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(checkSystemHealth, 10_000); // Every 10 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [auth, currentUser, connected, publicKey, subscription, autoRefresh]);

  const getHealthIcon = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const getHealthBadge = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-500">Healthy</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500">Warning</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
    }
  };

  const getStatusSummary = () => {
    if (!auth.isAuthenticated) {
      return 'Connect and authenticate your wallet to access testing tools';
    }

    if (!subscription) {
      return 'Loading subscription data...';
    }

    const usagePercent = Math.round(
      (subscription.messagesUsed / subscription.messagesLimit) * 100
    );
    return `${subscription.tier.toUpperCase()} tier • ${usagePercent}% usage • ${limits.messagesRemaining} messages remaining`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-6 w-6" />
            Payment System Test Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Comprehensive testing suite for the Convex Auth + Solana payment
                integration.
                {getStatusSummary()}
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-between">
              <div className="text-muted-foreground text-sm">
                Last health check:{' '}
                {new Date(lastHealthCheck).toLocaleTimeString()}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  size="sm"
                  variant="outline"
                >
                  <Activity
                    className={`mr-2 h-4 w-4 ${autoRefresh ? 'animate-pulse' : ''}`}
                  />
                  Auto Refresh {autoRefresh ? 'On' : 'Off'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <div className="rounded border p-4 text-center">
              <div className="mb-2 flex items-center justify-center">
                {getHealthIcon(systemHealth.overall)}
              </div>
              <div className="font-semibold">Overall</div>
              {getHealthBadge(systemHealth.overall)}
            </div>

            <div className="rounded border p-4 text-center">
              <div className="mb-2 flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
              <div className="font-semibold">Auth</div>
              {getHealthBadge(systemHealth.auth)}
            </div>

            <div className="rounded border p-4 text-center">
              <div className="mb-2 flex items-center justify-center">
                <Wallet className="h-4 w-4" />
              </div>
              <div className="font-semibold">Wallet</div>
              {getHealthBadge(systemHealth.wallet)}
            </div>

            <div className="rounded border p-4 text-center">
              <div className="mb-2 flex items-center justify-center">
                <Database className="h-4 w-4" />
              </div>
              <div className="font-semibold">Subscription</div>
              {getHealthBadge(systemHealth.subscription)}
            </div>

            <div className="rounded border p-4 text-center">
              <div className="mb-2 flex items-center justify-center">
                <CreditCard className="h-4 w-4" />
              </div>
              <div className="font-semibold">Payment</div>
              {getHealthBadge(systemHealth.payment)}
            </div>
          </div>

          {/* Quick Stats */}
          {auth.isAuthenticated && subscription && (
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded bg-muted p-3">
                <div className="text-muted-foreground text-sm">User ID</div>
                <div className="font-mono text-xs">
                  {currentUser?.walletAddress?.slice(0, 8)}...
                  {currentUser?.walletAddress?.slice(-8)}
                </div>
              </div>
              <div className="rounded bg-muted p-3">
                <div className="text-muted-foreground text-sm">Tier</div>
                <div className="font-semibold capitalize">
                  {subscription.tier}
                </div>
              </div>
              <div className="rounded bg-muted p-3">
                <div className="text-muted-foreground text-sm">Usage</div>
                <div className="font-semibold">
                  {subscription.messagesUsed}/{subscription.messagesLimit}
                </div>
              </div>
              <div className="rounded bg-muted p-3">
                <div className="text-muted-foreground text-sm">Days Left</div>
                <div className="font-semibold">
                  {subscription.daysRemaining}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Testing Tools Tabs */}
      <Tabs className="w-full" defaultValue="integration">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger className="flex items-center gap-1" value="integration">
            <TestTube className="h-4 w-4" />
            Integration Tests
          </TabsTrigger>
          <TabsTrigger className="flex items-center gap-1" value="validation">
            <Shield className="h-4 w-4" />
            Validation Suite
          </TabsTrigger>
          <TabsTrigger className="flex items-center gap-1" value="development">
            <Wrench className="h-4 w-4" />
            Dev Tools
          </TabsTrigger>
          <TabsTrigger className="flex items-center gap-1" value="wallet">
            <Wallet className="h-4 w-4" />
            Wallet Tests
          </TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-6" value="integration">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Payment Integration Testing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-muted-foreground text-sm">
                Comprehensive tests for all aspects of the payment system
                integration including authentication, subscription management,
                model access, and usage tracking.
              </p>
            </CardContent>
          </Card>
          <PaymentIntegrationTest />
        </TabsContent>

        <TabsContent className="space-y-6" value="validation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security & Validation Suite
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-muted-foreground text-sm">
                Advanced validation testing for security vulnerabilities, edge
                cases, error handling, and performance issues.
              </p>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Security tests may generate error logs - this is expected
                  behavior for validation.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
          <PaymentValidationSuite />
        </TabsContent>

        <TabsContent className="space-y-6" value="development">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Development Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-muted-foreground text-sm">
                Development utilities for testing payment flows, simulating
                usage scenarios, and debugging subscription issues.
              </p>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> These tools modify real user data.
                  Use carefully and only in development environments.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
          <PaymentDevTools />
        </TabsContent>

        <TabsContent className="space-y-6" value="wallet">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Wallet Integration Testing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-muted-foreground text-sm">
                Tests for wallet connection, authentication flow, balance
                fetching, and Solana Agent Kit integration.
              </p>
            </CardContent>
          </Card>
          <WalletIntegrationTest />
        </TabsContent>
      </Tabs>

      {/* Environment Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Environment Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <div className="text-muted-foreground">RPC Endpoint</div>
              <div className="font-mono text-xs">
                {process.env.NEXT_PUBLIC_SOLANA_RPC?.includes('mainnet')
                  ? '🟢 Mainnet'
                  : process.env.NEXT_PUBLIC_SOLANA_RPC?.includes('devnet')
                    ? '🟡 Devnet'
                    : '🔵 Local'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Environment</div>
              <div className="font-semibold">
                {process.env.NODE_ENV === 'production'
                  ? '🔴 Production'
                  : '🟡 Development'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Convex Auth</div>
              <div className="font-semibold">
                {auth.isAuthenticated ? '✅ Active' : '❌ Inactive'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Test Mode</div>
              <div className="font-semibold">
                {process.env.NODE_ENV !== 'production'
                  ? '✅ Enabled'
                  : '❌ Disabled'}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded bg-muted p-3 text-xs">
            <div className="mb-2 font-medium">Testing Guidelines:</div>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Always test on devnet before mainnet deployment</li>
              <li>• Use small amounts for payment testing (0.001-0.01 SOL)</li>
              <li>• Monitor usage carefully when using development tools</li>
              <li>• Validate all security tests pass before production</li>
              <li>• Keep test wallets separate from production wallets</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PaymentTestDashboard;
