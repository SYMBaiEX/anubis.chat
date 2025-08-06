'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

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

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600">Something went wrong</h2>
            <p className="mt-2 text-gray-600">
              Please refresh the page or contact support if the problem persists.
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