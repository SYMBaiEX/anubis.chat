'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { createModuleLogger } from '@/lib/utils/logger';

// Initialize logger
const log = createModuleLogger('error-boundary');

interface Props {
  children: ReactNode;
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
      log.warn('Solana extension error filtered (non-critical)', {
        error: error.message,
        stack: error.stack?.slice(0, 500), // Truncate stack trace
        type: 'solana_extension_error',
      });
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
      log.error('Uncaught error in application', {
        error,
        errorInfo: {
          componentStack: errorInfo.componentStack?.slice(0, 1000), // Truncate
          errorBoundary: 'ErrorBoundary',
        },
        type: 'uncaught_error',
      });
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="font-bold text-2xl text-red-600">
              Something went wrong
            </h2>
            <p className="mt-2 text-gray-600">
              Please refresh the page or contact support if the problem
              persists.
            </p>
            <button
              className="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>
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
      log.warn('Solana extension promise rejection filtered', {
        error: error?.message || 'Unknown error',
        stack: error?.stack?.slice(0, 500),
        type: 'solana_extension_promise_rejection',
      });
      event.preventDefault(); // Prevent logging to console
      return;
    }

    log.error('Unhandled promise rejection', {
      error,
      type: 'unhandled_promise_rejection',
    });
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
      log.warn('Solana extension error filtered', {
        error: error?.message || 'Unknown error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: 'solana_extension_window_error',
      });
      event.preventDefault(); // Prevent logging to console
      return;
    }
  });
}
