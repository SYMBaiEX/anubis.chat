/**
 * Logger Utility
 * High-performance logging system using Pino with proper transports and formatting
 * Pino is ~2.3x faster than Winston and better suited for modern applications
 */

import type { Logger } from 'pino';
import pino from 'pino';

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// Pino configuration
const pinoConfig: pino.LoggerOptions = {
  name: 'isis-chat',
  level: isDevelopment ? 'debug' : isProduction ? 'info' : 'warn',
  base: {
    service: 'isis-chat',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
  },
  // Pino's default timestamp is faster than custom formatting
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    // Add severity for Google Cloud Logging compatibility
    level: (label, number) => {
      const severityMap = {
        10: 'DEBUG', // trace
        20: 'DEBUG', // debug
        30: 'INFO', // info
        40: 'WARNING', // warn
        50: 'ERROR', // error
        60: 'CRITICAL', // fatal
      } as const;
      return {
        severity: severityMap[number as keyof typeof severityMap] || 'INFO',
        level: number,
      };
    },
  },
  // Redact sensitive information
  redact: {
    paths: [
      'password',
      'secret',
      'token',
      'key',
      'authorization',
      'cookie',
      'session',
      'privateKey',
      'apiKey',
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.secret',
      '*.token',
      '*.key',
      '*.authorization',
    ],
    censor: '[REDACTED]',
  },
};

// Configure transport based on environment
let transport:
  | pino.TransportSingleOptions
  | pino.TransportMultiOptions
  | undefined;

if (isDevelopment) {
  // Development: Pretty printing to console
  transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname,service,environment,version',
      messageFormat: '{service} [{level}]: {msg}',
      errorProps: 'stack',
    },
  };
} else if (isProduction) {
  // Production: Multiple targets with file rotation
  transport = {
    targets: [
      // Console output (JSON format for log aggregation)
      {
        target: 'pino/file',
        level: 'info',
        options: {
          destination: 1, // stdout
        },
      },
      // Error log file
      {
        target: 'pino/file',
        level: 'error',
        options: {
          destination: 'logs/error.log',
          mkdir: true,
        },
      },
      // Combined log file
      {
        target: 'pino/file',
        level: 'info',
        options: {
          destination: 'logs/combined.log',
          mkdir: true,
        },
      },
    ],
  };
} else {
  // Test environment: minimal console output
  transport = {
    target: 'pino/file',
    level: 'warn',
    options: {
      destination: 2, // stderr
    },
  };
}

// Create the main logger instance
const logger: Logger = pino(
  pinoConfig,
  transport ? pino.transport(transport) : undefined
);

// Export logger interface with enhanced methods
export interface AppLogger {
  fatal(message: string, meta?: Record<string, any>): void;
  error(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  info(message: string, meta?: Record<string, any>): void;
  debug(message: string, meta?: Record<string, any>): void;
  trace(message: string, meta?: Record<string, any>): void;
}

// Enhanced logger wrapper with additional functionality
class EnhancedLogger implements AppLogger {
  private pino: Logger;

  constructor(pinoLogger: Logger) {
    this.pino = pinoLogger;
  }

  fatal(message: string, meta: Record<string, any> = {}): void {
    this.pino.fatal(this.sanitizeMeta(meta), message);
  }

  error(message: string, meta: Record<string, any> = {}): void {
    this.pino.error(this.sanitizeMeta(meta), message);
  }

  warn(message: string, meta: Record<string, any> = {}): void {
    this.pino.warn(this.sanitizeMeta(meta), message);
  }

  info(message: string, meta: Record<string, any> = {}): void {
    this.pino.info(this.sanitizeMeta(meta), message);
  }

  debug(message: string, meta: Record<string, any> = {}): void {
    this.pino.debug(this.sanitizeMeta(meta), message);
  }

  trace(message: string, meta: Record<string, any> = {}): void {
    this.pino.trace(this.sanitizeMeta(meta), message);
  }

  /**
   * Sanitize metadata to prevent logging sensitive information
   */
  private sanitizeMeta(meta: Record<string, any>): Record<string, any> {
    const sensitiveKeys = [
      'password',
      'secret',
      'token',
      'key',
      'authorization',
      'cookie',
      'session',
      'privateKey',
      'apiKey',
    ];

    const sanitized = { ...meta };

    // Recursively sanitize nested objects
    const sanitizeValue = (obj: any): any => {
      if (obj === null || obj === undefined) return obj;

      if (typeof obj === 'object' && !Array.isArray(obj)) {
        const sanitizedObj: Record<string, any> = {};
        for (const [key, value] of Object.entries(obj)) {
          const lowerKey = key.toLowerCase();
          if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
            sanitizedObj[key] = '[REDACTED]';
          } else {
            sanitizedObj[key] = sanitizeValue(value);
          }
        }
        return sanitizedObj;
      }

      if (Array.isArray(obj)) {
        return obj.map(sanitizeValue);
      }

      return obj;
    };

    return sanitizeValue(sanitized);
  }

  /**
   * Create a child logger with additional metadata
   */
  child(additionalMeta: Record<string, any>): EnhancedLogger {
    const childLogger = this.pino.child(this.sanitizeMeta(additionalMeta));
    return new EnhancedLogger(childLogger);
  }

  /**
   * Log API requests with standardized format
   * Overloaded to support both detailed and simple logging patterns
   */
  apiRequest(
    methodOrEndpoint: string,
    urlOrMeta?: string | Record<string, unknown>,
    statusCode?: number,
    duration?: number,
    meta: Record<string, unknown> = {}
  ): void {
    // Handle the simplified signature used throughout the codebase
    // e.g., log.apiRequest('GET /api/documents/[id]', { documentId, walletAddress })
    if (typeof urlOrMeta === 'object' && !statusCode && !duration) {
      // Simple signature: apiRequest(endpoint, metadata)
      const endpoint = methodOrEndpoint;
      const metadata = urlOrMeta;

      // Default to info level for simplified logging
      this.info(`API Request: ${endpoint}`, {
        endpoint,
        type: 'http',
        ...metadata,
      });
      return;
    }

    // Handle the original detailed signature
    // e.g., log.apiRequest('GET', '/api/documents/123', 200, 45, { walletAddress })
    const method = methodOrEndpoint;
    const url = urlOrMeta as string;
    const level =
      (statusCode || 200) >= 500
        ? 'error'
        : (statusCode || 200) >= 400
          ? 'warn'
          : 'info';

    this[level](`${method} ${url} ${statusCode || 200} - ${duration || 0}ms`, {
      method,
      url,
      statusCode: statusCode || 200,
      duration: duration || 0,
      type: 'http',
      ...meta,
    });
  }

  /**
   * Log database operations with standardized format
   * Supports both simple and detailed logging patterns
   */
  dbOperation(
    operationOrDetails: string,
    tableOrMeta?: string | Record<string, unknown>,
    duration?: number,
    meta: Record<string, unknown> = {}
  ): void {
    // Handle the simplified signature used throughout the codebase
    // e.g., log.dbOperation('chat_created', { chatId, walletAddress })
    if (typeof tableOrMeta === 'object' && duration === undefined) {
      // Simple signature: dbOperation(operation, metadata)
      const operation = operationOrDetails;
      const metadata = tableOrMeta;

      // Extract table from operation if possible (e.g., 'chat_created' -> 'chat')
      const table = operation.split('_')[0] || 'unknown';

      this.debug(`DB Operation: ${operation}`, {
        operation,
        table,
        type: 'database',
        ...metadata,
      });
      return;
    }

    // Handle the original detailed signature
    // e.g., log.dbOperation('INSERT', 'users', 45, { userId: '123' })
    const operation = operationOrDetails;
    const table = (tableOrMeta as string) || 'unknown';
    const durationMs = duration || 0;

    this.debug(`DB ${operation} on ${table} - ${durationMs}ms`, {
      operation,
      table,
      duration: durationMs,
      type: 'database',
      ...meta,
    });
  }

  /**
   * Log authentication events
   */
  auth(event: string, userId?: string, meta: Record<string, any> = {}): void {
    this.info(`Auth: ${event}`, {
      event,
      userId,
      type: 'authentication',
      ...meta,
    });
  }

  /**
   * Log security events
   */
  security(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    meta: Record<string, any> = {}
  ): void {
    const logLevel =
      severity === 'critical' || severity === 'high'
        ? 'error'
        : severity === 'medium'
          ? 'warn'
          : 'info';

    this[logLevel](`Security: ${event}`, {
      event,
      severity,
      type: 'security',
      ...meta,
    });
  }

  /**
   * Log performance metrics
   */
  performance(
    metric: string,
    value: number,
    unit: string,
    meta: Record<string, any> = {}
  ): void {
    this.info(`Performance: ${metric} = ${value}${unit}`, {
      metric,
      value,
      unit,
      type: 'performance',
      ...meta,
    });
  }
}

// Create and export the enhanced logger instance
export const log = new EnhancedLogger(logger);

// Compatibility exports for direct pino usage
export { logger as pinoLogger };
export default log;

// Helper function to create child loggers for specific modules
export const createModuleLogger = (moduleName: string): EnhancedLogger => {
  return log.child({ module: moduleName });
};

// Helper function for request logging middleware
export const createRequestLogger = (requestId: string): EnhancedLogger => {
  return log.child({ requestId });
};

// Export Pino types for TypeScript
export type { Logger } from 'pino';
