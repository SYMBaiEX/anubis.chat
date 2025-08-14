'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, RefreshCw, WifiOff, Server, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('error-recovery');

interface ErrorRecoveryProps {
  error: Error & { 
    code?: string;
    statusCode?: number;
    retry?: () => Promise<void>;
  };
  retry: () => void;
  onRecoveryComplete?: () => void;
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
}

interface RecoveryStrategy {
  type: 'immediate' | 'exponential' | 'linear' | 'custom';
  attempts: number;
  delay: number;
  canRetry: boolean;
  message: string;
}

export function ErrorRecovery({
  error,
  retry,
  onRecoveryComplete,
  maxRetries = 5,
  baseDelay = 1000,
  maxDelay = 30000,
}: ErrorRecoveryProps) {
  const [retrying, setRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [nextRetryIn, setNextRetryIn] = useState<number | null>(null);
  const [recoveryProgress, setRecoveryProgress] = useState(0);
  const [strategy, setStrategy] = useState<RecoveryStrategy>(
    determineRecoveryStrategy(error)
  );

  // Determine recovery strategy based on error type
  function determineRecoveryStrategy(error: Error & { code?: string; statusCode?: number }): RecoveryStrategy {
    // Network errors - exponential backoff
    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      return {
        type: 'exponential',
        attempts: 5,
        delay: baseDelay,
        canRetry: true,
        message: 'Network error detected. Will retry with exponential backoff.',
      };
    }

    // Rate limiting - linear backoff with longer delays
    if (error.statusCode === 429 || error.code === 'RATE_LIMIT_EXCEEDED') {
      return {
        type: 'linear',
        attempts: 3,
        delay: 5000,
        canRetry: true,
        message: 'Rate limit exceeded. Waiting before retry.',
      };
    }

    // Server errors - exponential backoff
    if (error.statusCode && error.statusCode >= 500) {
      return {
        type: 'exponential',
        attempts: 4,
        delay: baseDelay * 2,
        canRetry: true,
        message: 'Server error. Retrying with increased delays.',
      };
    }

    // Auth errors - immediate single retry
    if (error.statusCode === 401) {
      return {
        type: 'immediate',
        attempts: 1,
        delay: 0,
        canRetry: true,
        message: 'Authentication error. Attempting to refresh session.',
      };
    }

    // Permission errors - no retry
    if (error.statusCode === 403) {
      return {
        type: 'custom',
        attempts: 0,
        delay: 0,
        canRetry: false,
        message: 'Permission denied. Cannot automatically retry.',
      };
    }

    // Default strategy
    return {
      type: 'exponential',
      attempts: 3,
      delay: baseDelay,
      canRetry: true,
      message: 'Attempting automatic recovery.',
    };
  }

  // Calculate next delay based on strategy
  const calculateDelay = useCallback((attempt: number): number => {
    switch (strategy.type) {
      case 'immediate':
        return 0;
      case 'linear':
        return Math.min(strategy.delay * attempt, maxDelay);
      case 'exponential':
        return Math.min(strategy.delay * Math.pow(2, attempt), maxDelay);
      default:
        return strategy.delay;
    }
  }, [strategy, maxDelay]);

  // Countdown timer for next retry
  useEffect(() => {
    if (nextRetryIn === null || nextRetryIn <= 0) return;

    const timer = setInterval(() => {
      setNextRetryIn(prev => {
        if (prev === null || prev <= 1) {
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [nextRetryIn]);

  // Handle retry with recovery strategy
  const handleRetry = useCallback(async () => {
    if (!strategy.canRetry || retryCount >= strategy.attempts) {
      log.warn('Max retry attempts reached', { retryCount, maxAttempts: strategy.attempts });
      return;
    }

    setRetrying(true);
    setRecoveryProgress(0);

    const delay = calculateDelay(retryCount);
    
    if (delay > 0) {
      setNextRetryIn(Math.ceil(delay / 1000));
      
      // Simulate progress during delay
      const progressInterval = setInterval(() => {
        setRecoveryProgress(prev => Math.min(prev + (100 / (delay / 100)), 100));
      }, 100);

      await new Promise(resolve => setTimeout(resolve, delay));
      clearInterval(progressInterval);
    }

    try {
      log.info('Attempting recovery', {
        attempt: retryCount + 1,
        strategy: strategy.type,
        delay,
      });

      // If error has custom retry function, use it
      if (error.retry) {
        await error.retry();
      } else {
        retry();
      }

      // Success - call recovery complete callback
      if (onRecoveryComplete) {
        onRecoveryComplete();
      }

      log.info('Recovery successful', { attempt: retryCount + 1 });
    } catch (retryError) {
      log.error('Recovery attempt failed', {
        attempt: retryCount + 1,
        error: retryError,
      });

      setRetryCount(prev => prev + 1);
      
      // Update strategy if needed
      if (retryError instanceof Error) {
        const newStrategy = determineRecoveryStrategy(retryError as any);
        if (newStrategy.type !== strategy.type) {
          setStrategy(newStrategy);
        }
      }
    } finally {
      setRetrying(false);
      setRecoveryProgress(0);
      setNextRetryIn(null);
    }
  }, [retryCount, strategy, error, retry, onRecoveryComplete, calculateDelay]);

  // Auto-retry for certain error types
  useEffect(() => {
    if (strategy.type === 'immediate' && retryCount === 0) {
      handleRetry();
    }
  }, [strategy.type, retryCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const getErrorIcon = () => {
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      return <WifiOff className="h-5 w-5" />;
    }
    if (error.statusCode && error.statusCode >= 500) {
      return <Server className="h-5 w-5" />;
    }
    if (error.statusCode === 429) {
      return <Clock className="h-5 w-5" />;
    }
    return <AlertTriangle className="h-5 w-5" />;
  };

  const canRetry = strategy.canRetry && retryCount < strategy.attempts;

  return (
    <div className="space-y-4">
      <Alert variant={canRetry ? 'default' : 'destructive'}>
        <div className="flex items-start gap-2">
          {getErrorIcon()}
          <div className="flex-1">
            <AlertDescription className="font-medium">
              {strategy.message}
            </AlertDescription>
            {retryCount > 0 && (
              <p className="mt-1 text-sm text-muted-foreground">
                Attempt {retryCount} of {strategy.attempts}
              </p>
            )}
          </div>
        </div>
      </Alert>

      {retrying && recoveryProgress > 0 && (
        <div className="space-y-2">
          <Progress value={recoveryProgress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            {nextRetryIn ? `Retrying in ${nextRetryIn}s...` : 'Retrying...'}
          </p>
        </div>
      )}

      {!retrying && (
        <div className="flex gap-2">
          {canRetry && (
            <Button
              onClick={handleRetry}
              disabled={retrying}
              variant="default"
              className="flex-1"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {retryCount === 0 ? 'Try Recovery' : 'Retry Again'}
            </Button>
          )}
          
          <Button
            onClick={retry}
            variant="outline"
            className="flex-1"
            disabled={retrying}
          >
            Manual Retry
          </Button>
        </div>
      )}

      {!canRetry && retryCount >= strategy.attempts && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Automatic recovery failed after {retryCount} attempts.
            Please try manual retry or contact support.
          </AlertDescription>
        </Alert>
      )}

      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-muted-foreground">
            Recovery Details
          </summary>
          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
            <p>Strategy: {strategy.type}</p>
            <p>Max Attempts: {strategy.attempts}</p>
            <p>Base Delay: {strategy.delay}ms</p>
            <p>Current Attempt: {retryCount}</p>
            <p>Error Code: {error.code || 'N/A'}</p>
            <p>Status Code: {error.statusCode || 'N/A'}</p>
          </div>
        </details>
      )}
    </div>
  );
}

// Hook for using error recovery in components
export function useErrorRecovery() {
  const [error, setError] = useState<Error | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);

  const startRecovery = useCallback((error: Error, onRecover: () => void) => {
    setError(error);
    setIsRecovering(true);
    
    log.info('Starting error recovery', { error: error.message });
    
    // Return cleanup function
    return () => {
      setError(null);
      setIsRecovering(false);
      onRecover();
    };
  }, []);

  return {
    error,
    isRecovering,
    startRecovery,
    clearError: () => setError(null),
  };
}