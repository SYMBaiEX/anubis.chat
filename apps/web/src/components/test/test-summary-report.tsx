'use client';

import { api } from '@convex/_generated/api';
import { useWallet } from '@solana/wallet-adapter-react';
import { useQuery } from 'convex/react';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  FileText,
  RefreshCw,
  Shield,
  XCircle,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useSubscription } from '@/hooks/use-subscription';

interface TestSummary {
  category: string;
  total: number;
  passed: number;
  failed: number;
  errors: number;
  skipped: number;
  critical_issues: number;
  last_run: number;
}

interface SystemMetrics {
  uptime: number;
  response_time_avg: number;
  error_rate: number;
  active_users: number;
  total_transactions: number;
  failed_transactions: number;
}

/**
 * Test Summary Report
 *
 * Provides a comprehensive summary of all test results and system metrics.
 * Useful for getting a quick overview of system health and test coverage.
 */
export function TestSummaryReport() {
  const { publicKey, connected } = useWallet();
  const auth = useAuthContext();
  const { subscription } = useSubscription();
  const currentUser = useQuery(api.users.getCurrentUserProfile);

  const [testSummaries, setTestSummaries] = useState<TestSummary[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(
    null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<number | null>(null);

  // Simulate test summaries (in a real app, this would come from a test runner)
  const generateTestSummary = () => {
    setIsGenerating(true);

    // Simulate API call delay
    setTimeout(() => {
      const mockSummaries: TestSummary[] = [
        {
          category: 'Authentication',
          total: 6,
          passed: 5,
          failed: 1,
          errors: 0,
          skipped: 0,
          critical_issues: 1,
          last_run: Date.now(),
        },
        {
          category: 'Subscription Management',
          total: 8,
          passed: 7,
          failed: 0,
          errors: 1,
          skipped: 0,
          critical_issues: 0,
          last_run: Date.now(),
        },
        {
          category: 'Payment Processing',
          total: 10,
          passed: 8,
          failed: 2,
          errors: 0,
          skipped: 0,
          critical_issues: 1,
          last_run: Date.now(),
        },
        {
          category: 'Security Validation',
          total: 12,
          passed: 10,
          failed: 1,
          errors: 1,
          skipped: 0,
          critical_issues: 2,
          last_run: Date.now(),
        },
        {
          category: 'Edge Cases',
          total: 8,
          passed: 6,
          failed: 1,
          errors: 0,
          skipped: 1,
          critical_issues: 0,
          last_run: Date.now(),
        },
        {
          category: 'Performance',
          total: 6,
          passed: 4,
          failed: 2,
          errors: 0,
          skipped: 0,
          critical_issues: 1,
          last_run: Date.now(),
        },
      ];

      const mockMetrics: SystemMetrics = {
        uptime: 99.5,
        response_time_avg: 180,
        error_rate: 0.2,
        active_users: 42,
        total_transactions: 1250,
        failed_transactions: 8,
      };

      setTestSummaries(mockSummaries);
      setSystemMetrics(mockMetrics);
      setLastGenerated(Date.now());
      setIsGenerating(false);
    }, 2000);
  };

  // Auto-generate on mount
  useEffect(() => {
    generateTestSummary();
  }, []);

  const getTotalStats = () => {
    if (testSummaries.length === 0) return null;

    return testSummaries.reduce(
      (acc, summary) => ({
        total: acc.total + summary.total,
        passed: acc.passed + summary.passed,
        failed: acc.failed + summary.failed,
        errors: acc.errors + summary.errors,
        critical: acc.critical + summary.critical_issues,
      }),
      { total: 0, passed: 0, failed: 0, errors: 0, critical: 0 }
    );
  };

  const getSuccessRate = (summary: TestSummary) => {
    if (summary.total === 0) return 0;
    return Math.round((summary.passed / summary.total) * 100);
  };

  const getOverallHealth = () => {
    const stats = getTotalStats();
    if (!stats) return 'unknown';

    if (stats.critical > 0) return 'critical';
    if (stats.failed > stats.total * 0.1) return 'warning';
    if (stats.errors > 0) return 'warning';
    return 'healthy';
  };

  const exportReport = () => {
    const report = {
      generated_at: new Date().toISOString(),
      system_info: {
        user: currentUser?.walletAddress,
        subscription_tier: subscription?.tier,
        wallet_connected: connected,
        authenticated: auth.isAuthenticated,
      },
      test_summaries: testSummaries,
      system_metrics: systemMetrics,
      overall_stats: getTotalStats(),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-test-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const totalStats = getTotalStats();
  const overallHealth = getOverallHealth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Test Summary Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-muted-foreground text-sm">
              {lastGenerated &&
                `Last generated: ${new Date(lastGenerated).toLocaleString()}`}
            </div>
            <div className="flex gap-2">
              <Button
                disabled={isGenerating}
                onClick={generateTestSummary}
                size="sm"
                variant="outline"
              >
                {isGenerating ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh
              </Button>
              <Button
                disabled={!totalStats}
                onClick={exportReport}
                size="sm"
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Overall System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex items-center gap-4">
            <div className="flex items-center gap-2">
              {overallHealth === 'healthy' && (
                <CheckCircle className="h-8 w-8 text-green-500" />
              )}
              {overallHealth === 'warning' && (
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              )}
              {overallHealth === 'critical' && (
                <XCircle className="h-8 w-8 text-red-500" />
              )}
              {overallHealth === 'unknown' && (
                <Clock className="h-8 w-8 text-gray-400" />
              )}
              <div>
                <div className="font-semibold text-lg capitalize">
                  {overallHealth}
                </div>
                <div className="text-muted-foreground text-sm">
                  {totalStats &&
                    `${totalStats.passed}/${totalStats.total} tests passing`}
                </div>
              </div>
            </div>

            {totalStats && (
              <div className="flex-1">
                <Progress
                  className="w-full"
                  value={(totalStats.passed / totalStats.total) * 100}
                />
              </div>
            )}
          </div>

          {totalStats && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              <div className="text-center">
                <div className="font-bold text-2xl">{totalStats.total}</div>
                <div className="text-muted-foreground text-sm">Total Tests</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-2xl text-green-500">
                  {totalStats.passed}
                </div>
                <div className="text-muted-foreground text-sm">Passed</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-2xl text-red-500">
                  {totalStats.failed}
                </div>
                <div className="text-muted-foreground text-sm">Failed</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-2xl text-orange-500">
                  {totalStats.errors}
                </div>
                <div className="text-muted-foreground text-sm">Errors</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-2xl text-red-600">
                  {totalStats.critical}
                </div>
                <div className="text-muted-foreground text-sm">Critical</div>
              </div>
            </div>
          )}

          {totalStats && totalStats.critical > 0 && (
            <Alert className="mt-4 border-red-500">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Critical issues detected!</strong> {totalStats.critical}{' '}
                critical security or functionality issues require immediate
                attention.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Test Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Test Category Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {testSummaries.map((summary) => (
              <div className="rounded border p-4" key={summary.category}>
                <div className="mb-2 flex items-center justify-between">
                  <div className="font-semibold">{summary.category}</div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        getSuccessRate(summary) === 100
                          ? 'default'
                          : getSuccessRate(summary) >= 80
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {getSuccessRate(summary)}% Success
                    </Badge>
                    {summary.critical_issues > 0 && (
                      <Badge variant="destructive">
                        {summary.critical_issues} Critical
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="mb-3 grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total:</span>{' '}
                    {summary.total}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Passed:</span>{' '}
                    {summary.passed}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Failed:</span>{' '}
                    {summary.failed}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Errors:</span>{' '}
                    {summary.errors}
                  </div>
                </div>

                <Progress className="w-full" value={getSuccessRate(summary)} />

                <div className="mt-2 text-muted-foreground text-xs">
                  Last run: {new Date(summary.last_run).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Metrics */}
      {systemMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              System Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <div className="rounded border p-4 text-center">
                <div className="font-bold text-2xl text-green-500">
                  {systemMetrics.uptime}%
                </div>
                <div className="text-muted-foreground text-sm">
                  System Uptime
                </div>
              </div>

              <div className="rounded border p-4 text-center">
                <div className="font-bold text-2xl">
                  {systemMetrics.response_time_avg}ms
                </div>
                <div className="text-muted-foreground text-sm">
                  Avg Response Time
                </div>
              </div>

              <div className="rounded border p-4 text-center">
                <div className="font-bold text-2xl text-orange-500">
                  {systemMetrics.error_rate}%
                </div>
                <div className="text-muted-foreground text-sm">Error Rate</div>
              </div>

              <div className="rounded border p-4 text-center">
                <div className="font-bold text-2xl">
                  {systemMetrics.active_users}
                </div>
                <div className="text-muted-foreground text-sm">
                  Active Users
                </div>
              </div>

              <div className="rounded border p-4 text-center">
                <div className="font-bold text-2xl">
                  {systemMetrics.total_transactions}
                </div>
                <div className="text-muted-foreground text-sm">
                  Total Transactions
                </div>
              </div>

              <div className="rounded border p-4 text-center">
                <div className="font-bold text-2xl text-red-500">
                  {systemMetrics.failed_transactions}
                </div>
                <div className="text-muted-foreground text-sm">
                  Failed Transactions
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {totalStats?.critical > 0 && (
              <Alert className="border-red-500">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>High Priority:</strong> Address {totalStats.critical}{' '}
                  critical security issues immediately.
                </AlertDescription>
              </Alert>
            )}

            {totalStats && totalStats.failed > totalStats.total * 0.1 && (
              <Alert className="border-yellow-500">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Medium Priority:</strong> High failure rate detected (
                  {Math.round((totalStats.failed / totalStats.total) * 100)}%).
                  Review failing tests.
                </AlertDescription>
              </Alert>
            )}

            {systemMetrics && systemMetrics.response_time_avg > 200 && (
              <Alert className="border-yellow-500">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Performance:</strong> Average response time (
                  {systemMetrics.response_time_avg}ms) exceeds target. Consider
                  optimization.
                </AlertDescription>
              </Alert>
            )}

            {overallHealth === 'healthy' && (
              <Alert className="border-green-500">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>System Status:</strong> All systems operating
                  normally. Continue regular testing.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TestSummaryReport;
