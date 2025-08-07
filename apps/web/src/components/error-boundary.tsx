'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Filter out known Solana extension errors that don't affect functionality
    const isSolanaExtensionError =
      error.message?.includes('MutationObserver') ||
      error.message?.includes('solanaActionsContentScript') ||
      error.stack?.includes('solanaActionsContentScript');

    if (isSolanaExtensionError) {
      // Log but don't trigger error boundary for Solana extension issues
      console.warn('Solana extension error (non-critical):', error);
      return { hasError: false };
    }

    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Filter out Solana extension errors
    const isSolanaExtensionError =
      error.message?.includes('MutationObserver') ||
      error.message?.includes('solanaActionsContentScript');

    if (!isSolanaExtensionError) {
      console.error('Uncaught error:', error, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-destructive">Something went wrong</CardTitle>
              <CardDescription>
                An unexpected error occurred. This has been logged and will be investigated.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="p-3 bg-muted rounded-md text-sm">
                  <pre className="whitespace-pre-wrap text-destructive">
                    {this.state.error.message}
                  </pre>
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={this.handleReset} variant="outline" className="flex-1">
                  Try Again
                </Button>
                <Button onClick={this.handleReload} className="flex-1">
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Global error handler for unhandled promise rejections and errors
if (typeof window !== 'undefined') {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;

    // Filter out Solana extension errors
    if (
      error?.message?.includes('MutationObserver') ||
      error?.message?.includes('solanaActionsContentScript') ||
      error?.stack?.includes('solanaActionsContentScript')
    ) {
      console.warn('Solana extension promise rejection (non-critical):', error);
      event.preventDefault(); // Prevent logging to console
      return;
    }

    console.error('Unhandled promise rejection:', error);
  });

  // Handle general errors
  window.addEventListener('error', (event) => {
    const error = event.error;

    // Filter out Solana extension errors
    if (
      error?.message?.includes('MutationObserver') ||
      error?.message?.includes('solanaActionsContentScript') ||
      event.filename?.includes('solanaActionsContentScript')
    ) {
      console.warn('Solana extension error (non-critical):', error);
      event.preventDefault(); // Prevent logging to console
      return;
    }
  });
}

// Hook version for functional components
export function withErrorBoundary<T extends Record<string, unknown>>(
  Component: React.ComponentType<T>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: T) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}