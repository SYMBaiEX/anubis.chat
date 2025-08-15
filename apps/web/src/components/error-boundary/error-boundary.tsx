'use client';

import { AlertCircle, Home, RefreshCw } from 'lucide-react';
import React, { type ErrorInfo, type ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorBoundaryFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: readonly unknown[];
  resetOnPropsChange?: boolean;
  isolate?: boolean;
  level?: 'page' | 'section' | 'component';
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

export interface ErrorBoundaryFallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  resetError: () => void;
  errorCount: number;
  level: 'page' | 'section' | 'component';
  showDetails?: boolean;
}

class ErrorBoundary extends React.Component<Props, State> {
  private resetTimeoutId: NodeJS.Timeout | null = null;
  private previousResetKeys: readonly unknown[] = [];

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
    this.previousResetKeys = props.resetKeys || [];
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props;
    const { errorCount } = this.state;

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
    }

    // Call custom error handler
    onError?.(error, errorInfo);

    // Update state with error details
    this.setState({
      errorInfo,
      errorCount: errorCount + 1,
    });

    // Report to error tracking service (e.g., Sentry)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: this.props.level === 'page',
      });
    }

    // Auto-reset after 3 errors to prevent infinite loops
    if (errorCount >= 2) {
      this.scheduleReset(10_000); // Reset after 10 seconds
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Reset on prop changes if enabled
    if (
      hasError &&
      resetOnPropsChange &&
      prevProps.children !== this.props.children
    ) {
      this.resetError();
    }

    // Reset on resetKeys change
    if (hasError && resetKeys && this.previousResetKeys !== resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== this.previousResetKeys[index]
      );
      if (hasResetKeyChanged) {
        this.resetError();
      }
    }
    this.previousResetKeys = resetKeys || [];
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  scheduleReset = (delay: number) => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
    this.resetTimeoutId = setTimeout(() => {
      this.resetError();
    }, delay);
  };

  resetError = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    });
  };

  render() {
    const { hasError, error, errorInfo, errorCount } = this.state;
    const {
      children,
      fallback: Fallback,
      level = 'component',
      showDetails = process.env.NODE_ENV === 'development',
    } = this.props;

    if (hasError && error) {
      if (Fallback) {
        return (
          <Fallback
            error={error}
            errorCount={errorCount}
            errorInfo={errorInfo}
            level={level}
            resetError={this.resetError}
            showDetails={showDetails}
          />
        );
      }

      return (
        <DefaultErrorFallback
          error={error}
          errorCount={errorCount}
          errorInfo={errorInfo}
          level={level}
          resetError={this.resetError}
          showDetails={showDetails}
        />
      );
    }

    return children;
  }
}

export function DefaultErrorFallback({
  error,
  errorInfo,
  resetError,
  errorCount,
  level,
  showDetails,
}: ErrorBoundaryFallbackProps) {
  const isPageLevel = level === 'page';
  const isSectionLevel = level === 'section';

  return (
    <div
      className={`flex ${isPageLevel ? 'min-h-screen' : isSectionLevel ? 'min-h-[400px]' : 'min-h-[200px]'} items-center justify-center p-4`}
    >
      <div className="w-full max-w-md space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {isPageLevel
              ? 'Page Error'
              : isSectionLevel
                ? 'Section Error'
                : 'Component Error'}
          </AlertTitle>
          <AlertDescription>
            {error.message || 'An unexpected error occurred'}
            {errorCount > 1 && (
              <span className="mt-1 block text-xs">
                This error has occurred {errorCount} times
              </span>
            )}
          </AlertDescription>
        </Alert>

        {showDetails && errorInfo && (
          <details className="rounded-lg border bg-muted/50 p-4">
            <summary className="cursor-pointer font-medium">
              Error Details
            </summary>
            <pre className="mt-2 overflow-auto text-xs">
              {error.stack}
              {'\n\nComponent Stack:'}
              {errorInfo.componentStack}
            </pre>
          </details>
        )}

        <div className="flex gap-2">
          <Button onClick={resetError} size="sm" variant="default">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          {isPageLevel && (
            <Button
              onClick={() => (window.location.href = '/')}
              size="sm"
              variant="outline"
            >
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          )}
        </div>

        {errorCount >= 3 && (
          <p className="text-muted-foreground text-xs">
            Auto-refreshing in 10 seconds...
          </p>
        )}
      </div>
    </div>
  );
}

export default ErrorBoundary;

// Convenience wrapper for async components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
