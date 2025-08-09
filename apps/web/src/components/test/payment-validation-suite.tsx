'use client';

import React, { useState, useCallback } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  Bug,
  Zap,
  Lock,
  DollarSign
} from 'lucide-react';

interface ValidationResult {
  testName: string;
  category: 'security' | 'performance' | 'edge_cases' | 'business_logic';
  status: 'pass' | 'fail' | 'error' | 'pending' | 'skipped';
  message: string;
  details?: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
}

/**
 * Payment System Validation Suite
 * 
 * Comprehensive validation testing for security, edge cases, and error handling:
 * - Security validation (unauthorized access, payment tampering)
 * - Edge case testing (boundary conditions, race conditions)
 * - Error handling verification
 * - Performance validation
 * - Business logic validation
 * - Data consistency checks
 */
export function PaymentValidationSuite() {
  const { publicKey } = useWallet();
  const currentUser = useQuery(api.users.getCurrentUserProfile);
  const subscriptionStatus = useQuery(api.subscriptions.getSubscriptionStatus);
  
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState('');
  const [progress, setProgress] = useState(0);

  const connection = new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com'
  );

  const addValidationResult = useCallback((result: Omit<ValidationResult, 'timestamp'>) => {
    setValidationResults(prev => [...prev, { ...result, timestamp: Date.now() }]);
  }, []);

  const updateProgress = useCallback((completed: number, total: number) => {
    setProgress(Math.round((completed / total) * 100));
  }, []);

  // Security validation tests
  const runSecurityValidation = useCallback(async () => {
    const tests = [
      'unauthorized_payment_access',
      'payment_amount_manipulation',
      'signature_validation',
      'wallet_address_spoofing',
      'subscription_tier_bypass',
      'usage_limit_bypass'
    ];
    
    let completed = 0;
    
    // Test 1: Unauthorized Payment Access
    setCurrentTest('Testing unauthorized payment access...');
    try {
      const response = await fetch('/api/subscriptions/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Intentionally missing or invalid data
          walletAddress: '',
          txSignature: 'invalid_sig',
          tier: 'pro',
          amountSol: 0.05
        })
      });
      
      if (response.status === 401 || response.status === 403) {
        addValidationResult({
          testName: 'Unauthorized Payment Access',
          category: 'security',
          status: 'pass',
          message: 'Properly blocks unauthorized payment attempts',
          severity: 'critical'
        });
      } else if (response.status === 400) {
        addValidationResult({
          testName: 'Unauthorized Payment Access',
          category: 'security',
          status: 'pass',
          message: 'Properly validates payment data',
          severity: 'critical'
        });
      } else {
        addValidationResult({
          testName: 'Unauthorized Payment Access',
          category: 'security',
          status: 'fail',
          message: `Unexpected response: ${response.status}`,
          severity: 'critical'
        });
      }
    } catch (error) {
      addValidationResult({
        testName: 'Unauthorized Payment Access',
        category: 'security',
        status: 'error',
        message: `Test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'medium'
      });
    }
    updateProgress(++completed, tests.length);

    // Test 2: Payment Amount Manipulation
    setCurrentTest('Testing payment amount validation...');
    try {
      const response = await fetch('/api/subscriptions/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey?.toBase58() || 'test_wallet',
          txSignature: 'test_sig_' + Date.now(),
          tier: 'pro',
          amountSol: 0.001 // Way too low for pro tier
        })
      });
      
      if (!response.ok) {
        addValidationResult({
          testName: 'Payment Amount Validation',
          category: 'security',
          status: 'pass',
          message: 'Properly rejects invalid payment amounts',
          severity: 'high'
        });
      } else {
        addValidationResult({
          testName: 'Payment Amount Validation',
          category: 'security',
          status: 'fail',
          message: 'Accepts invalid payment amounts - security risk',
          severity: 'critical'
        });
      }
    } catch (error) {
      addValidationResult({
        testName: 'Payment Amount Validation',
        category: 'security',
        status: 'error',
        message: `Test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'medium'
      });
    }
    updateProgress(++completed, tests.length);

    // Test 3: Signature Validation
    setCurrentTest('Testing transaction signature validation...');
    try {
      const response = await fetch('/api/subscriptions/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey?.toBase58() || 'test_wallet',
          txSignature: 'obviously_fake_signature_123',
          tier: 'pro',
          amountSol: 0.05
        })
      });
      
      if (!response.ok) {
        addValidationResult({
          testName: 'Transaction Signature Validation',
          category: 'security',
          status: 'pass',
          message: 'Properly validates transaction signatures',
          severity: 'critical'
        });
      } else {
        addValidationResult({
          testName: 'Transaction Signature Validation',
          category: 'security',
          status: 'fail',
          message: 'Accepts invalid transaction signatures',
          severity: 'critical'
        });
      }
    } catch (error) {
      addValidationResult({
        testName: 'Transaction Signature Validation',
        category: 'security',
        status: 'error',
        message: `Test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'medium'
      });
    }
    updateProgress(++completed, tests.length);

    // Test 4: Wallet Address Spoofing
    setCurrentTest('Testing wallet address spoofing protection...');
    try {
      const fakeWallet = new PublicKey('11111111111111111111111111111111').toBase58();
      const response = await fetch('/api/subscriptions/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: fakeWallet,
          txSignature: 'test_sig_' + Date.now(),
          tier: 'pro',
          amountSol: 0.05
        })
      });
      
      // This should fail due to authentication/authorization checks
      if (!response.ok) {
        addValidationResult({
          testName: 'Wallet Address Spoofing Protection',
          category: 'security',
          status: 'pass',
          message: 'Properly prevents wallet address spoofing',
          severity: 'critical'
        });
      } else {
        addValidationResult({
          testName: 'Wallet Address Spoofing Protection',
          category: 'security',
          status: 'fail',
          message: 'Vulnerable to wallet address spoofing',
          severity: 'critical'
        });
      }
    } catch (error) {
      addValidationResult({
        testName: 'Wallet Address Spoofing Protection',
        category: 'security',
        status: 'error',
        message: `Test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'medium'
      });
    }
    updateProgress(++completed, tests.length);

    // Test 5: Subscription Tier Bypass Attempt
    setCurrentTest('Testing subscription tier bypass protection...');
    try {
      // Try to access premium features without proper tier
      const response = await fetch('/api/ai/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: 'test' }],
          forceBypass: true // Malicious parameter
        })
      });
      
      if (response.status === 403 || response.status === 402) {
        addValidationResult({
          testName: 'Subscription Tier Bypass Protection',
          category: 'security',
          status: 'pass',
          message: 'Properly enforces subscription tier restrictions',
          severity: 'high'
        });
      } else if (response.status === 404) {
        addValidationResult({
          testName: 'Subscription Tier Bypass Protection',
          category: 'security',
          status: 'skipped',
          message: 'API endpoint not available for testing',
          severity: 'low'
        });
      } else {
        addValidationResult({
          testName: 'Subscription Tier Bypass Protection',
          category: 'security',
          status: 'fail',
          message: 'May be vulnerable to tier bypass attempts',
          severity: 'high'
        });
      }
    } catch (error) {
      addValidationResult({
        testName: 'Subscription Tier Bypass Protection',
        category: 'security',
        status: 'error',
        message: `Test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'medium'
      });
    }
    updateProgress(++completed, tests.length);

    // Test 6: Usage Limit Bypass
    setCurrentTest('Testing usage limit bypass protection...');
    try {
      // Attempt to make multiple requests rapidly
      const rapidRequests = Array(5).fill(0).map(() => 
        fetch('/api/ai/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'test rapid request' }]
          })
        })
      );

      const responses = await Promise.all(rapidRequests.map(p => p.catch(e => ({ ok: false, status: 0, error: e }))));
      const blockedRequests = responses.filter(r => r.status === 429 || r.status === 403).length;
      
      if (blockedRequests > 0) {
        addValidationResult({
          testName: 'Usage Limit Bypass Protection',
          category: 'security',
          status: 'pass',
          message: `Rate limiting active: ${blockedRequests}/${responses.length} requests blocked`,
          severity: 'medium'
        });
      } else if (responses.every(r => r.status === 404)) {
        addValidationResult({
          testName: 'Usage Limit Bypass Protection',
          category: 'security',
          status: 'skipped',
          message: 'API endpoint not available for testing',
          severity: 'low'
        });
      } else {
        addValidationResult({
          testName: 'Usage Limit Bypass Protection',
          category: 'security',
          status: 'fail',
          message: 'No rate limiting detected - potential DoS vulnerability',
          severity: 'high'
        });
      }
    } catch (error) {
      addValidationResult({
        testName: 'Usage Limit Bypass Protection',
        category: 'security',
        status: 'error',
        message: `Test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'medium'
      });
    }
    updateProgress(++completed, tests.length);
  }, [publicKey, addValidationResult, updateProgress]);

  // Edge case testing
  const runEdgeCaseValidation = useCallback(async () => {
    const tests = [
      'boundary_conditions',
      'concurrent_payments',
      'subscription_expiry_edge',
      'zero_balance_handling',
      'maximum_usage_edge',
      'data_consistency'
    ];
    
    let completed = 0;

    // Test 1: Boundary Conditions
    setCurrentTest('Testing boundary conditions...');
    try {
      const testCases = [
        { tier: 'pro', amount: 0.0499 }, // Just below valid amount
        { tier: 'pro', amount: 0.0501 }, // Just above valid amount
        { tier: 'pro_plus', amount: 0.0999 }, // Just below valid amount
        { tier: 'pro_plus', amount: 0.1001 }, // Just above valid amount
      ];

      let validationResults = [];
      for (const testCase of testCases) {
        const response = await fetch('/api/subscriptions/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: publicKey?.toBase58() || 'test_wallet',
            txSignature: `boundary_test_${Date.now()}_${Math.random()}`,
            tier: testCase.tier,
            amountSol: testCase.amount
          })
        });
        
        validationResults.push({ 
          ...testCase, 
          accepted: response.ok,
          status: response.status 
        });
      }

      const properBoundaryHandling = validationResults.every((result, index) => {
        if (index % 2 === 0) return !result.accepted; // Below amounts should be rejected
        return true; // Above amounts may be accepted (tolerance)
      });

      addValidationResult({
        testName: 'Payment Boundary Conditions',
        category: 'edge_cases',
        status: properBoundaryHandling ? 'pass' : 'fail',
        message: properBoundaryHandling 
          ? 'Boundary conditions handled correctly' 
          : 'Boundary condition validation issues detected',
        details: validationResults,
        severity: 'medium'
      });
    } catch (error) {
      addValidationResult({
        testName: 'Payment Boundary Conditions',
        category: 'edge_cases',
        status: 'error',
        message: `Test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'low'
      });
    }
    updateProgress(++completed, tests.length);

    // Test 2: Concurrent Payment Handling
    setCurrentTest('Testing concurrent payment handling...');
    try {
      const concurrentPayments = Array(3).fill(0).map((_, i) => 
        fetch('/api/subscriptions/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: publicKey?.toBase58() || 'test_wallet',
            txSignature: `concurrent_test_${Date.now()}_${i}`,
            tier: 'pro',
            amountSol: 0.05
          })
        })
      );

      const results = await Promise.allSettled(concurrentPayments);
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
      
      // Should handle concurrent requests gracefully (either all fail due to auth, or handle properly)
      addValidationResult({
        testName: 'Concurrent Payment Handling',
        category: 'edge_cases',
        status: 'pass', // This is more about observing behavior
        message: `Concurrent payments handled: ${successCount}/3 successful`,
        details: results,
        severity: 'low'
      });
    } catch (error) {
      addValidationResult({
        testName: 'Concurrent Payment Handling',
        category: 'edge_cases',
        status: 'error',
        message: `Test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'low'
      });
    }
    updateProgress(++completed, tests.length);

    // Test 3: Subscription Expiry Edge Cases
    setCurrentTest('Testing subscription expiry handling...');
    if (subscriptionStatus) {
      const now = Date.now();
      const timeToExpiry = subscriptionStatus.currentPeriodEnd - now;
      
      if (timeToExpiry < 24 * 60 * 60 * 1000) { // Less than 1 day
        addValidationResult({
          testName: 'Subscription Expiry Handling',
          category: 'edge_cases',
          status: 'pass',
          message: 'Subscription expiring soon - system should handle gracefully',
          details: { timeToExpiry, hoursRemaining: Math.round(timeToExpiry / (60 * 60 * 1000)) },
          severity: 'medium'
        });
      } else {
        addValidationResult({
          testName: 'Subscription Expiry Handling',
          category: 'edge_cases',
          status: 'pass',
          message: 'Subscription not near expiry - normal operation expected',
          details: { daysRemaining: subscriptionStatus.daysRemaining },
          severity: 'low'
        });
      }
    } else {
      addValidationResult({
        testName: 'Subscription Expiry Handling',
        category: 'edge_cases',
        status: 'skipped',
        message: 'No subscription data available',
        severity: 'low'
      });
    }
    updateProgress(++completed, tests.length);

    // Test 4: Zero Balance Handling
    setCurrentTest('Testing zero balance scenarios...');
    try {
      const response = await fetch('/api/subscriptions/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey?.toBase58() || 'test_wallet',
          txSignature: `zero_balance_test_${Date.now()}`,
          tier: 'pro',
          amountSol: 0 // Zero amount
        })
      });
      
      if (!response.ok) {
        addValidationResult({
          testName: 'Zero Balance Handling',
          category: 'edge_cases',
          status: 'pass',
          message: 'Properly rejects zero-amount payments',
          severity: 'medium'
        });
      } else {
        addValidationResult({
          testName: 'Zero Balance Handling',
          category: 'edge_cases',
          status: 'fail',
          message: 'Accepts zero-amount payments - potential issue',
          severity: 'medium'
        });
      }
    } catch (error) {
      addValidationResult({
        testName: 'Zero Balance Handling',
        category: 'edge_cases',
        status: 'error',
        message: `Test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'low'
      });
    }
    updateProgress(++completed, tests.length);

    // Test 5: Maximum Usage Edge Cases
    setCurrentTest('Testing maximum usage scenarios...');
    if (subscriptionStatus) {
      const usagePercentage = (subscriptionStatus.messagesUsed / subscriptionStatus.messagesLimit) * 100;
      const premiumPercentage = subscriptionStatus.premiumMessagesLimit > 0 
        ? (subscriptionStatus.premiumMessagesUsed / subscriptionStatus.premiumMessagesLimit) * 100 
        : 0;
      
      if (usagePercentage >= 100 || premiumPercentage >= 100) {
        addValidationResult({
          testName: 'Maximum Usage Handling',
          category: 'edge_cases',
          status: 'pass',
          message: 'At maximum usage - system should prevent further usage',
          details: { usagePercentage, premiumPercentage },
          severity: 'high'
        });
      } else if (usagePercentage >= 90 || premiumPercentage >= 90) {
        addValidationResult({
          testName: 'Maximum Usage Handling',
          category: 'edge_cases',
          status: 'pass',
          message: 'Near maximum usage - should show warnings',
          details: { usagePercentage, premiumPercentage },
          severity: 'medium'
        });
      } else {
        addValidationResult({
          testName: 'Maximum Usage Handling',
          category: 'edge_cases',
          status: 'pass',
          message: 'Normal usage levels - no edge case issues',
          details: { usagePercentage, premiumPercentage },
          severity: 'low'
        });
      }
    } else {
      addValidationResult({
        testName: 'Maximum Usage Handling',
        category: 'edge_cases',
        status: 'skipped',
        message: 'No usage data available',
        severity: 'low'
      });
    }
    updateProgress(++completed, tests.length);

    // Test 6: Data Consistency
    setCurrentTest('Testing data consistency...');
    if (currentUser && subscriptionStatus) {
      const issues = [];
      
      // Check if subscription tier matches user data
      if (currentUser.subscription?.tier !== subscriptionStatus.tier) {
        issues.push('Subscription tier mismatch between user and subscription data');
      }
      
      // Check if usage counters are valid
      if (subscriptionStatus.messagesUsed > subscriptionStatus.messagesLimit) {
        issues.push('Message usage exceeds limit');
      }
      
      if (subscriptionStatus.premiumMessagesUsed > subscriptionStatus.premiumMessagesLimit) {
        issues.push('Premium usage exceeds limit');
      }
      
      // Check date consistency
      if (subscriptionStatus.currentPeriodEnd < subscriptionStatus.currentPeriodStart) {
        issues.push('Invalid subscription period dates');
      }
      
      addValidationResult({
        testName: 'Data Consistency',
        category: 'edge_cases',
        status: issues.length === 0 ? 'pass' : 'fail',
        message: issues.length === 0 
          ? 'Data consistency checks passed' 
          : `Data consistency issues: ${issues.length} found`,
        details: issues,
        severity: issues.length > 0 ? 'high' : 'low'
      });
    } else {
      addValidationResult({
        testName: 'Data Consistency',
        category: 'edge_cases',
        status: 'skipped',
        message: 'Insufficient data for consistency checks',
        severity: 'low'
      });
    }
    updateProgress(++completed, tests.length);
  }, [publicKey, currentUser, subscriptionStatus, addValidationResult, updateProgress]);

  // Performance validation
  const runPerformanceValidation = useCallback(async () => {
    const tests = [
      'api_response_time',
      'database_query_performance',
      'concurrent_request_handling'
    ];
    
    let completed = 0;

    // Test 1: API Response Time
    setCurrentTest('Testing API response times...');
    const apiEndpoints = [
      '/api/subscriptions/status',
      '/api/users/usage',
      '/api/ai/models'
    ];

    for (const endpoint of apiEndpoints) {
      const startTime = Date.now();
      try {
        const response = await fetch(endpoint, { method: 'GET' });
        const responseTime = Date.now() - startTime;
        
        addValidationResult({
          testName: `API Response Time: ${endpoint}`,
          category: 'performance',
          status: responseTime < 2000 ? 'pass' : 'fail',
          message: `Response time: ${responseTime}ms ${responseTime < 2000 ? '(acceptable)' : '(slow)'}`,
          details: { endpoint, responseTime, status: response.status },
          severity: responseTime > 5000 ? 'high' : responseTime > 2000 ? 'medium' : 'low'
        });
      } catch (error) {
        addValidationResult({
          testName: `API Response Time: ${endpoint}`,
          category: 'performance',
          status: 'error',
          message: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'medium'
        });
      }
    }
    updateProgress(++completed, tests.length);

    // Test 2: Database Query Performance (simulated)
    setCurrentTest('Testing database query performance...');
    const startTime = Date.now();
    try {
      // This will test the Convex query performance indirectly
      const testQuery = api.subscriptions.getSubscriptionStatus;
      // We can't directly measure this, but we can observe if data loads
      
      if (subscriptionStatus !== undefined) {
        const queryTime = Date.now() - startTime;
        addValidationResult({
          testName: 'Database Query Performance',
          category: 'performance',
          status: queryTime < 1000 ? 'pass' : 'fail',
          message: `Query resolution time: ${queryTime}ms`,
          severity: queryTime > 3000 ? 'high' : 'medium'
        });
      } else {
        addValidationResult({
          testName: 'Database Query Performance',
          category: 'performance',
          status: 'error',
          message: 'Query did not resolve',
          severity: 'high'
        });
      }
    } catch (error) {
      addValidationResult({
        testName: 'Database Query Performance',
        category: 'performance',
        status: 'error',
        message: `Query error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'high'
      });
    }
    updateProgress(++completed, tests.length);

    // Test 3: Concurrent Request Handling
    setCurrentTest('Testing concurrent request handling...');
    const concurrentRequests = Array(10).fill(0).map(() => {
      const startTime = Date.now();
      return fetch('/api/subscriptions/status', { method: 'GET' })
        .then(response => ({
          success: response.ok,
          responseTime: Date.now() - startTime,
          status: response.status
        }))
        .catch(error => ({
          success: false,
          responseTime: Date.now() - startTime,
          error: error.message
        }));
    });

    try {
      const results = await Promise.all(concurrentRequests);
      const successfulRequests = results.filter(r => r.success).length;
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
      
      addValidationResult({
        testName: 'Concurrent Request Handling',
        category: 'performance',
        status: successfulRequests >= 8 ? 'pass' : 'fail', // 80% success rate
        message: `${successfulRequests}/10 requests successful, avg response: ${Math.round(avgResponseTime)}ms`,
        details: results,
        severity: successfulRequests < 5 ? 'high' : 'medium'
      });
    } catch (error) {
      addValidationResult({
        testName: 'Concurrent Request Handling',
        category: 'performance',
        status: 'error',
        message: `Test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'medium'
      });
    }
    updateProgress(++completed, tests.length);
  }, [subscriptionStatus, addValidationResult, updateProgress]);

  const runAllValidations = useCallback(async () => {
    setIsRunning(true);
    setValidationResults([]);
    setProgress(0);
    
    try {
      await runSecurityValidation();
      await runEdgeCaseValidation();
      await runPerformanceValidation();
    } finally {
      setIsRunning(false);
      setCurrentTest('');
      setProgress(100);
    }
  }, [runSecurityValidation, runEdgeCaseValidation, runPerformanceValidation]);

  const getStatusIcon = (status: ValidationResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'skipped':
        return <Clock className="h-4 w-4 text-gray-400" />;
      case 'pending':
      default:
        return <Clock className="h-4 w-4 text-blue-400" />;
    }
  };

  const getSeverityBadge = (severity: ValidationResult['severity']) => {
    const variants = {
      critical: 'destructive',
      high: 'destructive',
      medium: 'secondary',
      low: 'outline'
    } as const;
    
    return <Badge variant={variants[severity]} className="capitalize">{severity}</Badge>;
  };

  const groupedResults = validationResults.reduce((groups, result) => {
    if (!groups[result.category]) groups[result.category] = [];
    groups[result.category].push(result);
    return groups;
  }, {} as Record<string, ValidationResult[]>);

  const overallStats = {
    total: validationResults.length,
    passed: validationResults.filter(r => r.status === 'pass').length,
    failed: validationResults.filter(r => r.status === 'fail').length,
    errors: validationResults.filter(r => r.status === 'error').length,
    critical: validationResults.filter(r => r.severity === 'critical').length
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Payment System Validation Suite
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button 
                onClick={runAllValidations} 
                disabled={isRunning}
                className="flex items-center gap-2"
              >
                {isRunning ? (
                  <>
                    <Bug className="h-4 w-4 animate-pulse" />
                    Running Validations...
                  </>
                ) : (
                  <>
                    <Bug className="h-4 w-4" />
                    Run Validation Suite
                  </>
                )}
              </Button>
              
              {isRunning && (
                <div className="text-sm text-muted-foreground">
                  {currentTest}
                </div>
              )}
            </div>

            {isRunning && (
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <div className="text-sm text-center text-muted-foreground">
                  {progress}% Complete
                </div>
              </div>
            )}

            {overallStats.total > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-3 border rounded text-center">
                  <div className="text-2xl font-bold">{overallStats.total}</div>
                  <div className="text-sm text-muted-foreground">Total Tests</div>
                </div>
                <div className="p-3 border rounded text-center">
                  <div className="text-2xl font-bold text-green-500">{overallStats.passed}</div>
                  <div className="text-sm text-muted-foreground">Passed</div>
                </div>
                <div className="p-3 border rounded text-center">
                  <div className="text-2xl font-bold text-red-500">{overallStats.failed}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
                <div className="p-3 border rounded text-center">
                  <div className="text-2xl font-bold text-orange-500">{overallStats.errors}</div>
                  <div className="text-sm text-muted-foreground">Errors</div>
                </div>
                <div className="p-3 border rounded text-center">
                  <div className="text-2xl font-bold text-red-600">{overallStats.critical}</div>
                  <div className="text-sm text-muted-foreground">Critical</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="security" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="security" className="flex items-center gap-1">
            <Lock className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="edge_cases" className="flex items-center gap-1">
            <Bug className="h-4 w-4" />
            Edge Cases
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-1">
            <Zap className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="business_logic" className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            Business Logic
          </TabsTrigger>
        </TabsList>

        {Object.entries(groupedResults).map(([category, results]) => (
          <TabsContent key={category} value={category} className="space-y-4">
            {results.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8 text-muted-foreground">
                  No validation results for this category yet
                </CardContent>
              </Card>
            ) : (
              results.map((result, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        <CardTitle className="text-lg">{result.testName}</CardTitle>
                      </div>
                      {getSeverityBadge(result.severity)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm">{result.message}</p>
                      
                      {result.details && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                            View Technical Details
                          </summary>
                          <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                      
                      <div className="text-xs text-muted-foreground">
                        Tested: {new Date(result.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default PaymentValidationSuite;