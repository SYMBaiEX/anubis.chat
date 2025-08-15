'use client';

import { useEffect } from 'react';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('GlobalErrorHandler');

export function GlobalErrorHandler() {
  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      log.error('Unhandled promise rejection', {
        reason: event.reason,
        promise: event.promise,
      });

      // Prevent the default error handling
      event.preventDefault();

      // Log to monitoring service if available
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'exception', {
          description: `Unhandled rejection: ${event.reason}`,
          fatal: false,
        });
      }
    };

    // Handle global errors
    const handleError = (event: ErrorEvent) => {
      log.error('Global error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      });

      // Log to monitoring service if available
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'exception', {
          description: event.message,
          fatal: false,
        });
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener(
        'unhandledrejection',
        handleUnhandledRejection
      );
      window.removeEventListener('error', handleError);
    };
  }, []);

  return null;
}
