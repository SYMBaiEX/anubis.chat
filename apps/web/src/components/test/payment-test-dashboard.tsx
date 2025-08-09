'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSubscription } from '@/hooks/use-subscription';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PaymentIntegrationTest } from './payment-integration-test';
import { PaymentDevTools } from './payment-dev-tools';
import { PaymentValidationSuite } from './payment-validation-suite';
import { WalletIntegrationTest } from './wallet-integration-test';
import { 
  TestTube, 
  Shield, 
  Wrench, 
  Activity,
  CheckCircle, 
  AlertTriangle,
  Info,
  RefreshCw,
  Wallet,
  CreditCard,
  Users,
  Database,
  Zap
} from 'lucide-react';

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
    overall: 'healthy'
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
        overall: 'healthy'
      };

      // Check auth health
      if (!auth.isAuthenticated || !currentUser) {
        health.auth = 'error';
      } else if (auth.isLoading) {
        health.auth = 'warning';
      }

      // Check wallet health
      if (!connected || !publicKey) {
        health.wallet = 'error';
      }

      // Check subscription health
      if (!subscription) {
        health.subscription = 'error';
      } else if (subscription.messagesUsed >= subscription.messagesLimit) {
        health.subscription = 'warning';
      } else if (subscription.tier === 'free' && subscription.messagesUsed > subscription.messagesLimit * 0.8) {
        health.subscription = 'warning';
      }

      // Check payment system health (basic validation)
      if (health.auth === 'error' || health.wallet === 'error') {
        health.payment = 'error';
      } else if (subscription?.isExpired) {
        health.payment = 'warning';
      }

      // Determine overall health
      const healthValues = Object.values(health).filter(h => h !== 'healthy');
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
      interval = setInterval(checkSystemHealth, 10000); // Every 10 seconds
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

    const usagePercent = Math.round((subscription.messagesUsed / subscription.messagesLimit) * 100);
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
                Comprehensive testing suite for the Convex Auth + Solana payment integration. 
                {getStatusSummary()}
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Last health check: {new Date(lastHealthCheck).toLocaleTimeString()}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                >
                  <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 border rounded text-center">
              <div className="flex items-center justify-center mb-2">
                {getHealthIcon(systemHealth.overall)}
              </div>
              <div className="font-semibold">Overall</div>
              {getHealthBadge(systemHealth.overall)}
            </div>
            
            <div className="p-4 border rounded text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-4 w-4" />
              </div>
              <div className="font-semibold">Auth</div>
              {getHealthBadge(systemHealth.auth)}
            </div>
            
            <div className="p-4 border rounded text-center">
              <div className="flex items-center justify-center mb-2">
                <Wallet className="h-4 w-4" />
              </div>
              <div className="font-semibold">Wallet</div>
              {getHealthBadge(systemHealth.wallet)}
            </div>
            
            <div className="p-4 border rounded text-center">
              <div className="flex items-center justify-center mb-2">
                <Database className="h-4 w-4" />
              </div>
              <div className="font-semibold">Subscription</div>
              {getHealthBadge(systemHealth.subscription)}
            </div>
            
            <div className="p-4 border rounded text-center">
              <div className="flex items-center justify-center mb-2">
                <CreditCard className="h-4 w-4" />
              </div>
              <div className="font-semibold">Payment</div>
              {getHealthBadge(systemHealth.payment)}
            </div>
          </div>

          {/* Quick Stats */}
          {auth.isAuthenticated && subscription && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-muted rounded">
                <div className="text-sm text-muted-foreground">User ID</div>
                <div className="font-mono text-xs">
                  {currentUser?.walletAddress?.slice(0, 8)}...{currentUser?.walletAddress?.slice(-8)}
                </div>
              </div>
              <div className="p-3 bg-muted rounded">
                <div className="text-sm text-muted-foreground">Tier</div>
                <div className="font-semibold capitalize">{subscription.tier}</div>
              </div>
              <div className="p-3 bg-muted rounded">
                <div className="text-sm text-muted-foreground">Usage</div>
                <div className="font-semibold">
                  {subscription.messagesUsed}/{subscription.messagesLimit}
                </div>
              </div>
              <div className="p-3 bg-muted rounded">
                <div className="text-sm text-muted-foreground">Days Left</div>
                <div className="font-semibold">{subscription.daysRemaining}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Testing Tools Tabs */}
      <Tabs defaultValue="integration" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="integration" className="flex items-center gap-1">
            <TestTube className="h-4 w-4" />
            Integration Tests
          </TabsTrigger>
          <TabsTrigger value="validation" className="flex items-center gap-1">
            <Shield className="h-4 w-4" />
            Validation Suite
          </TabsTrigger>
          <TabsTrigger value="development" className="flex items-center gap-1">
            <Wrench className="h-4 w-4" />
            Dev Tools
          </TabsTrigger>
          <TabsTrigger value="wallet" className="flex items-center gap-1">
            <Wallet className="h-4 w-4" />
            Wallet Tests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="integration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Payment Integration Testing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Comprehensive tests for all aspects of the payment system integration including 
                authentication, subscription management, model access, and usage tracking.
              </p>
            </CardContent>
          </Card>
          <PaymentIntegrationTest />
        </TabsContent>

        <TabsContent value="validation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security & Validation Suite
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Advanced validation testing for security vulnerabilities, edge cases, 
                error handling, and performance issues.
              </p>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Security tests may generate error logs - this is expected behavior for validation.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
          <PaymentValidationSuite />
        </TabsContent>

        <TabsContent value="development" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Development Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Development utilities for testing payment flows, simulating usage scenarios,
                and debugging subscription issues.
              </p>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> These tools modify real user data. Use carefully and only in development environments.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
          <PaymentDevTools />
        </TabsContent>

        <TabsContent value="wallet" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Wallet Integration Testing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Tests for wallet connection, authentication flow, balance fetching, 
                and Solana Agent Kit integration.
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">RPC Endpoint</div>
              <div className="font-mono text-xs">
                {process.env.NEXT_PUBLIC_SOLANA_RPC?.includes('mainnet') ? '🟢 Mainnet' : 
                 process.env.NEXT_PUBLIC_SOLANA_RPC?.includes('devnet') ? '🟡 Devnet' : 
                 '🔵 Local'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Environment</div>
              <div className="font-semibold">
                {process.env.NODE_ENV === 'production' ? '🔴 Production' : '🟡 Development'}
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
                {process.env.NODE_ENV !== 'production' ? '✅ Enabled' : '❌ Disabled'}
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-muted rounded text-xs">
            <div className="font-medium mb-2">Testing Guidelines:</div>
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