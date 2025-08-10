'use client';

import { AlertCircle, Check, RefreshCw, X } from 'lucide-react';
import { useState } from 'react';
import { useAuthContext } from '@/components/providers/auth-provider';
import { useSolanaAgent } from '@/components/providers/solana-agent-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WalletAuthButton } from '@/components/wallet/wallet-auth-button';
import { useWallet } from '@/hooks/useWallet';

/**
 * Wallet Integration Test Component
 *
 * Provides a comprehensive test interface for verifying:
 * - Wallet connection functionality
 * - Convex Auth integration
 * - Solana Agent Kit initialization
 * - Balance fetching and updates
 * - Error handling and recovery
 *
 * Useful for development and debugging the wallet integration.
 */
export function WalletIntegrationTest() {
  const wallet = useWallet();
  const auth = useAuthContext();
  const solanaAgent = useSolanaAgent();
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  const runTest = async (testName: string, testFn: () => Promise<boolean>) => {
    try {
      const result = await testFn();
      setTestResults((prev) => ({ ...prev, [testName]: result }));
      return result;
    } catch (error) {
      console.error(`Test ${testName} failed:`, error);
      setTestResults((prev) => ({ ...prev, [testName]: false }));
      return false;
    }
  };

  const runAllTests = async () => {
    console.log('Running wallet integration tests...');

    // Test 1: Wallet connection
    await runTest('wallet_connected', async () => {
      return wallet.isConnected && wallet.publicKey !== null;
    });

    // Test 2: Auth integration
    await runTest('auth_authenticated', async () => {
      return auth.isAuthenticated && auth.user !== null;
    });

    // Test 3: User ID consistency
    await runTest('user_id_consistency', async () => {
      return auth.user?.walletAddress === wallet.publicKey;
    });

    // Test 4: Balance fetching
    await runTest('balance_fetching', async () => {
      await wallet.refreshBalance();
      return wallet.balance !== null;
    });

    // Test 5: Solana Agent initialization
    await runTest('solana_agent_init', async () => {
      return solanaAgent.isInitialized && solanaAgent.agentKit !== null;
    });

    // Test 6: Agent balance consistency
    await runTest('agent_balance_consistency', async () => {
      const agentBalance = await solanaAgent.getBalance();
      return agentBalance === wallet.balance;
    });
  };

  const getStatusIcon = (status: boolean | undefined) => {
    if (status === undefined)
      return <AlertCircle className="h-4 w-4 text-gray-400" />;
    return status ? (
      <Check className="h-4 w-4 text-green-500" />
    ) : (
      <X className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (status: boolean | undefined) => {
    if (status === undefined)
      return <Badge variant="secondary">Not Tested</Badge>;
    return status ? (
      <Badge className="bg-green-500" variant="default">
        Pass
      </Badge>
    ) : (
      <Badge variant="destructive">Fail</Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🧪 Wallet Integration Test Suite
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <WalletAuthButton showAddress={true} />
            <Button
              disabled={!(wallet.isConnected && auth.isAuthenticated)}
              onClick={runAllTests}
              variant="outline"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Run All Tests
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Status */}
      <Card>
        <CardHeader>
          <CardTitle>Wallet Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              Connected:{' '}
              <Badge variant={wallet.isConnected ? 'default' : 'secondary'}>
                {wallet.isConnected ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div>
              Connecting:{' '}
              <Badge variant={wallet.isConnecting ? 'default' : 'secondary'}>
                {wallet.isConnecting ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div>
              Authenticating:{' '}
              <Badge
                variant={wallet.isAuthenticating ? 'default' : 'secondary'}
              >
                {wallet.isAuthenticating ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div>
              Health Score:{' '}
              <Badge
                variant={
                  wallet.connectionHealthScore > 60 ? 'default' : 'destructive'
                }
              >
                {wallet.connectionHealthScore}
              </Badge>
            </div>
          </div>

          {wallet.publicKey && (
            <div className="text-sm">
              <strong>Public Key:</strong>{' '}
              <code className="text-xs">{wallet.formatAddress(8)}</code>
            </div>
          )}

          {wallet.balance !== null && (
            <div className="text-sm">
              <strong>Balance:</strong> {wallet.balance.toFixed(4)} SOL
            </div>
          )}

          {wallet.error && (
            <div className="text-red-500 text-sm">
              <strong>Error:</strong> {wallet.error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auth Status */}
      <Card>
        <CardHeader>
          <CardTitle>Authentication Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              Authenticated:{' '}
              <Badge variant={auth.isAuthenticated ? 'default' : 'secondary'}>
                {auth.isAuthenticated ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div>
              Loading:{' '}
              <Badge variant={auth.isLoading ? 'default' : 'secondary'}>
                {auth.isLoading ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>

          {auth.user && (
            <div className="space-y-1 text-sm">
              <div>
                <strong>User ID:</strong>{' '}
                <code className="text-xs">{auth.user.walletAddress}</code>
              </div>
              {auth.user.role && (
                <div>
                  <strong>Role:</strong> {auth.user.role}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Solana Agent Status */}
      <Card>
        <CardHeader>
          <CardTitle>Solana Agent Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              Initialized:{' '}
              <Badge
                variant={solanaAgent.isInitialized ? 'default' : 'secondary'}
              >
                {solanaAgent.isInitialized ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div>
              Agents Available:{' '}
              <Badge variant="secondary">
                {solanaAgent.agents?.length || 0}
              </Badge>
            </div>
            <div>
              Selected Agent:{' '}
              <Badge
                variant={solanaAgent.selectedAgent ? 'default' : 'secondary'}
              >
                {solanaAgent.selectedAgent?.name || 'None'}
              </Badge>
            </div>
            <div>
              Pending Transactions:{' '}
              <Badge variant="secondary">
                {solanaAgent.pendingTransactions.length}
              </Badge>
            </div>
          </div>

          {solanaAgent.error && (
            <div className="text-red-500 text-sm">
              <strong>Error:</strong> {solanaAgent.error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { key: 'wallet_connected', label: 'Wallet Connection' },
              { key: 'auth_authenticated', label: 'Authentication' },
              { key: 'user_id_consistency', label: 'User ID Consistency' },
              { key: 'balance_fetching', label: 'Balance Fetching' },
              {
                key: 'solana_agent_init',
                label: 'Solana Agent Initialization',
              },
              {
                key: 'agent_balance_consistency',
                label: 'Agent Balance Consistency',
              },
            ].map(({ key, label }) => (
              <div
                className="flex items-center justify-between rounded border p-2"
                key={key}
              >
                <div className="flex items-center gap-2">
                  {getStatusIcon(testResults[key])}
                  <span className="text-sm">{label}</span>
                </div>
                {getStatusBadge(testResults[key])}
              </div>
            ))}
          </div>

          {Object.keys(testResults).length === 0 && (
            <div className="py-4 text-center text-muted-foreground text-sm">
              Connect your wallet and run tests to see results
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default WalletIntegrationTest;
