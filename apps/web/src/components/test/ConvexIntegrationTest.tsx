/**
 * Integration test component for Convex functionality
 * Demonstrates error scenarios and testing patterns
 */

'use client';

import React, { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import {
  isFailure,
  isSuccess,
  type Result,
  useUser,
  useCreateChat,
} from '@/hooks/convex';

interface IntegrationTestProps {
  walletAddress: string;
}

export function ConvexIntegrationTest({ walletAddress }: IntegrationTestProps) {
  const [testResults, setTestResults] = useState<
    Record<string, 'pending' | 'success' | 'error'>
  >({});
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Convex hooks for testing
  const userQuery = useUser(walletAddress);
  const { mutate: createChat } = useCreateChat();

  // =============================================================================
  // Test Helpers
  // =============================================================================

  const addLog = (message: string) => {
    setTestLogs((prev) => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const updateTestResult = (testName: string, result: 'success' | 'error') => {
    setTestResults((prev) => ({ ...prev, [testName]: result }));
  };

  // =============================================================================
  // Individual Tests
  // =============================================================================

  const testUserQuery = async () => {
    addLog('Testing user query...');

    try {
      if (userQuery.isLoading) {
        addLog('User query is loading (expected)');
        updateTestResult('userQuery', 'success');
        return;
      }

      if (userQuery.error) {
        addLog(`User query error: ${userQuery.error.message}`);
        updateTestResult('userQuery', 'error');
        return;
      }

      addLog('User query completed successfully');
      updateTestResult('userQuery', 'success');
    } catch (error) {
      addLog(`User query test failed: ${error}`);
      updateTestResult('userQuery', 'error');
    }
  };

  const testChatCreation = async () => {
    addLog('Testing chat creation...');

    try {
      const result = await createChat({
        title: `Test Chat ${Date.now()}`,
        ownerId: walletAddress,
        model: 'gpt-4o',
        temperature: 0.7,
      });

      if (isSuccess(result)) {
        addLog('Chat creation test passed');
        updateTestResult('chatCreation', 'success');
      } else {
        addLog(`Chat creation test failed: ${result.error.message}`);
        updateTestResult('chatCreation', 'error');
      }
    } catch (error) {
      addLog(`Chat creation test failed: ${error}`);
      updateTestResult('chatCreation', 'error');
    }
  };

  const testErrorHandling = async () => {
    addLog('Testing error handling...');

    try {
      // Intentionally create invalid data to test error handling
      const result = await createChat({
        title: '', // Empty title should cause validation error
        ownerId: 'invalid-wallet', // Invalid wallet address
        model: 'invalid-model', // Invalid model
      });

      if (isFailure(result)) {
        addLog('Error handling test passed: Received expected error');
        updateTestResult('errorHandling', 'success');
      } else {
        addLog('Error handling test failed: Expected validation error');
        updateTestResult('errorHandling', 'error');
      }
    } catch (error) {
      addLog(`Error handling test passed: Caught exception ${error}`);
      updateTestResult('errorHandling', 'success');
    }
  };

  // =============================================================================
  // Test Suite Runner
  // =============================================================================

  const runAllTests = async () => {
    setIsRunningTests(true);
    setTestResults({});
    setTestLogs([]);

    addLog('Starting Convex integration tests...');

    const tests = [
      { name: 'userQuery', fn: testUserQuery },
      { name: 'chatCreation', fn: testChatCreation },
      { name: 'errorHandling', fn: testErrorHandling },
    ];

    for (const test of tests) {
      setTestResults((prev) => ({ ...prev, [test.name]: 'pending' }));
      await test.fn();
      // Add small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    addLog('All tests completed!');
    setIsRunningTests(false);
  };

  // =============================================================================
  // Render Helpers
  // =============================================================================

  const getTestStatusBadge = (
    status: 'pending' | 'success' | 'error' | undefined
  ) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Running...</Badge>;
      case 'success':
        return (
          <Badge className="bg-green-500" variant="default">
            Pass
          </Badge>
        );
      case 'error':
        return <Badge variant="destructive">Fail</Badge>;
      default:
        return <Badge variant="outline">Not Run</Badge>;
    }
  };

  const getOverallProgress = () => {
    const total = Object.keys(testResults).length;
    const completed = Object.values(testResults).filter(
      (r) => r !== 'pending'
    ).length;
    return total > 0 ? (completed / total) * 100 : 0;
  };

  const getPassRate = () => {
    const total = Object.values(testResults).filter(
      (r) => r !== 'pending'
    ).length;
    const passed = Object.values(testResults).filter(
      (r) => r === 'success'
    ).length;
    return total > 0 ? (passed / total) * 100 : 0;
  };

  // =============================================================================
  // Main Render
  // =============================================================================

  return (
    <div className="space-y-6">
      {/* Test Control */}
      <Card>
        <CardHeader>
          <CardTitle>Convex Integration Tests</CardTitle>
          <CardDescription>
            Comprehensive testing of Convex integration layer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="w-full"
            disabled={isRunningTests}
            onClick={runAllTests}
          >
            {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
          </Button>

          {Object.keys(testResults).length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{Math.round(getOverallProgress())}%</span>
              </div>
              <Progress value={getOverallProgress()} />

              <div className="flex justify-between text-sm">
                <span>Pass Rate</span>
                <span
                  className={
                    getPassRate() === 100 ? 'text-green-600' : 'text-red-600'
                  }
                >
                  {Math.round(getPassRate())}%
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {['userQuery', 'chatCreation', 'errorHandling'].map((testName) => (
              <div
                className="flex items-center justify-between rounded border p-2"
                key={testName}
              >
                <span className="font-medium">{testName}</span>
                {getTestStatusBadge(testResults[testName])}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Test Logs */}
      {testLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto rounded-md bg-muted/30 p-3">
              <pre className="whitespace-pre-wrap text-xs">
                {testLogs.join('\n')}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}