import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('error-reporting');

// Error context interface
export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  route?: string;
  action?: string;
  metadata?: Record<string, any>;
  environment?: string;
  release?: string;
  userAgent?: string;
  timestamp?: number;
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Error report interface
export interface ErrorReport {
  message: string;
  stack?: string;
  type?: string;
  severity: ErrorSeverity;
  context: ErrorContext;
  fingerprint?: string;
  tags?: string[];
  breadcrumbs?: Breadcrumb[];
}

// Breadcrumb for tracking user actions
export interface Breadcrumb {
  timestamp: number;
  type: 'navigation' | 'action' | 'error' | 'console' | 'http';
  category?: string;
  message?: string;
  data?: Record<string, any>;
  level?: 'debug' | 'info' | 'warning' | 'error';
}

// Error reporting configuration
interface ErrorReportingConfig {
  enabled: boolean;
  endpoint?: string;
  apiKey?: string;
  environment: string;
  release?: string;
  sampleRate: number;
  beforeSend?: (report: ErrorReport) => ErrorReport | null;
  ignoreErrors?: RegExp[];
  allowedDomains?: string[];
}

class ErrorReportingService {
  private config: ErrorReportingConfig;
  private queue: ErrorReport[] = [];
  private breadcrumbs: Breadcrumb[] = [];
  private maxBreadcrumbs = 50;
  private maxQueueSize = 100;
  private flushInterval: NodeJS.Timeout | null = null;
  private isOnline = true;

  constructor(config: Partial<ErrorReportingConfig> = {}) {
    this.config = {
      enabled: process.env.NEXT_PUBLIC_ERROR_REPORTING_ENABLED === 'true',
      endpoint: process.env.NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT,
      apiKey: process.env.NEXT_PUBLIC_ERROR_REPORTING_API_KEY,
      environment: process.env.NODE_ENV || 'development',
      release: process.env.NEXT_PUBLIC_APP_VERSION,
      sampleRate: 1.0,
      ignoreErrors: [
        /ResizeObserver loop limit exceeded/,
        /Non-Error promise rejection captured/,
        /Network request failed/,
        /solanaActionsContentScript/,
        /MutationObserver/,
      ],
      ...config,
    };

    if (this.config.enabled && typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private initialize() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flush();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Set up periodic flush
    this.flushInterval = setInterval(() => {
      if (this.isOnline) {
        this.flush();
      }
    }, 30000); // Flush every 30 seconds

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });

    log.info('Error reporting initialized', {
      environment: this.config.environment,
      release: this.config.release,
    });
  }

  // Report an error
  async reportError(
    error: Error | string,
    context?: Partial<ErrorContext>,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
  ): Promise<void> {
    if (!this.config.enabled) return;

    // Sample rate check
    if (Math.random() > this.config.sampleRate) return;

    const errorObj = typeof error === 'string' ? new Error(error) : error;

    // Check if error should be ignored
    if (this.shouldIgnoreError(errorObj)) return;

    const report: ErrorReport = {
      message: errorObj.message,
      stack: errorObj.stack,
      type: errorObj.name,
      severity,
      context: {
        ...this.getDefaultContext(),
        ...context,
      },
      fingerprint: this.generateFingerprint(errorObj),
      tags: this.extractTags(errorObj, context),
      breadcrumbs: [...this.breadcrumbs],
    };

    // Apply beforeSend hook
    const processedReport = this.config.beforeSend
      ? this.config.beforeSend(report)
      : report;

    if (!processedReport) return;

    // Add to queue
    this.addToQueue(processedReport);

    // Log locally
    log.error('Error reported', {
      message: processedReport.message,
      severity: processedReport.severity,
      fingerprint: processedReport.fingerprint,
    });

    // Flush immediately for critical errors
    if (severity === ErrorSeverity.CRITICAL) {
      await this.flush();
    }
  }

  // Add breadcrumb
  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
    const crumb: Breadcrumb = {
      ...breadcrumb,
      timestamp: Date.now(),
    };

    this.breadcrumbs.push(crumb);

    // Trim breadcrumbs if exceeding max
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }
  }

  // Check if error should be ignored
  private shouldIgnoreError(error: Error): boolean {
    if (!this.config.ignoreErrors) return false;

    return this.config.ignoreErrors.some(pattern =>
      pattern.test(error.message) || pattern.test(error.stack || '')
    );
  }

  // Generate error fingerprint for grouping
  private generateFingerprint(error: Error): string {
    const key = `${error.name}-${error.message}`;
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  // Extract tags from error and context
  private extractTags(error: Error, context?: Partial<ErrorContext>): string[] {
    const tags: string[] = [];

    // Add error type
    tags.push(`type:${error.name}`);

    // Add route if available
    if (context?.route) {
      tags.push(`route:${context.route}`);
    }

    // Add action if available
    if (context?.action) {
      tags.push(`action:${context.action}`);
    }

    // Add environment
    tags.push(`env:${this.config.environment}`);

    return tags;
  }

  // Get default context
  private getDefaultContext(): ErrorContext {
    if (typeof window === 'undefined') {
      return {
        environment: this.config.environment,
        release: this.config.release,
        timestamp: Date.now(),
      };
    }

    return {
      environment: this.config.environment,
      release: this.config.release,
      userAgent: navigator.userAgent,
      route: window.location.pathname,
      timestamp: Date.now(),
    };
  }

  // Add report to queue
  private addToQueue(report: ErrorReport): void {
    this.queue.push(report);

    // Trim queue if exceeding max size
    if (this.queue.length > this.maxQueueSize) {
      this.queue = this.queue.slice(-this.maxQueueSize);
    }
  }

  // Flush error queue to reporting service
  async flush(): Promise<void> {
    if (!this.config.enabled || !this.config.endpoint || this.queue.length === 0) {
      return;
    }

    const reports = [...this.queue];
    this.queue = [];

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'X-API-Key': this.config.apiKey }),
        },
        body: JSON.stringify({
          reports,
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send error reports: ${response.statusText}`);
      }

      log.info(`Flushed ${reports.length} error reports`);
    } catch (error) {
      log.error('Failed to flush error reports', error);
      // Re-add reports to queue for retry
      this.queue.unshift(...reports);
    }
  }

  // Clean up
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
  }
}

// Create singleton instance
let errorReportingInstance: ErrorReportingService | null = null;

export function getErrorReporting(): ErrorReportingService {
  if (!errorReportingInstance) {
    errorReportingInstance = new ErrorReportingService();
  }
  return errorReportingInstance;
}

// Convenience functions
export async function reportError(
  error: Error | string,
  context?: Partial<ErrorContext>,
  severity?: ErrorSeverity
): Promise<void> {
  return getErrorReporting().reportError(error, context, severity);
}

export function addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
  getErrorReporting().addBreadcrumb(breadcrumb);
}

// React error boundary helper
export function logErrorToService(error: Error, errorInfo: React.ErrorInfo): void {
  reportError(error, {
    action: 'react_error_boundary',
    metadata: {
      componentStack: errorInfo.componentStack,
    },
  }, ErrorSeverity.HIGH);
}

// Convex error helper
export function reportConvexError(error: Error & { code?: string }, operation: string): void {
  reportError(error, {
    action: `convex_${operation}`,
    metadata: {
      code: (error as any).code,
      operation,
    },
  }, ErrorSeverity.MEDIUM);
}

// API error helper
export function reportAPIError(
  error: Error,
  endpoint: string,
  method: string,
  statusCode?: number
): void {
  reportError(error, {
    action: 'api_error',
    metadata: {
      endpoint,
      method,
      statusCode,
    },
  }, statusCode && statusCode >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM);
}

// Performance error helper
export function reportPerformanceIssue(
  metric: string,
  value: number,
  threshold: number
): void {
  reportError(
    `Performance issue: ${metric} (${value}ms) exceeded threshold (${threshold}ms)`,
    {
      action: 'performance_issue',
      metadata: {
        metric,
        value,
        threshold,
      },
    },
    ErrorSeverity.LOW
  );
}