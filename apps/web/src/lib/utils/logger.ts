/**
 * Logger Utility
 * High-performance logging system with browser/server compatibility
 */

import type { Logger } from 'pino';
import pino from 'pino';

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';
const isBrowser = typeof window !== 'undefined';

// Pino configuration
const pinoConfig: pino.LoggerOptions = {
  name: 'anubis-chat',
  level: isDevelopment ? 'debug' : isProduction ? 'info' : 'warn',
  base: {
    service: 'anubis-chat',
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
  // Browser configuration - use console instead of transports
  browser: {
    serialize: true,
    write: isDevelopment
      ? {
          debug: (o: any) => console.debug(o),
          info: (o: any) => console.info(o),
          warn: (o: any) => console.warn(o),
          error: (o: any) => console.error(o),
          fatal: (o: any) => console.error(o),
          trace: (o: any) => console.trace(o),
        }
      : {
          debug: () => {},
          info: () => {},
          warn: (o: any) => console.warn(o),
          error: (o: any) => console.error(o),
          fatal: (o: any) => console.error(o),
          trace: () => {},
        },
  },
};

// Create logger without transport for browser compatibility
// Transports with workers don't work well with Next.js/Turbopack
const logger: Logger =
  isBrowser || isDevelopment
    ? pino(pinoConfig)
    : pino(pinoConfig, pino.destination({ sync: false }));

// Export logger interface with enhanced methods
export interface AppLogger {
  fatal(message: string, meta?: Record<string, any>): void;
  error(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  info(message: string, meta?: Record<string, any>): void;
  debug(message: string, meta?: Record<string, any>): void;
  trace(message: string, meta?: Record<string, any>): void;
  apiRequest(event: string, meta?: Record<string, any>): void;
  dbOperation(event: string, meta?: Record<string, any>): void;
  auth(
    message: string,
    walletAddress?: string,
    meta?: Record<string, any>
  ): void;
}

// Enhanced logger wrapper with additional functionality
class EnhancedLogger implements AppLogger {
  private pino: Logger;

  constructor(pinoLogger: Logger) {
    this.pino = pinoLogger;
  }

  fatal(message: string, meta?: Record<string, any>): void {
    if (meta) {
      this.pino.fatal(meta, message);
    } else {
      this.pino.fatal(message);
    }
  }

  error(message: string, meta?: Record<string, any>): void {
    if (meta) {
      this.pino.error(meta, message);
    } else {
      this.pino.error(message);
    }
  }

  warn(message: string, meta?: Record<string, any>): void {
    if (meta) {
      this.pino.warn(meta, message);
    } else {
      this.pino.warn(message);
    }
  }

  info(message: string, meta?: Record<string, any>): void {
    if (meta) {
      this.pino.info(meta, message);
    } else {
      this.pino.info(message);
    }
  }

  debug(message: string, meta?: Record<string, any>): void {
    if (meta) {
      this.pino.debug(meta, message);
    } else {
      this.pino.debug(message);
    }
  }

  trace(message: string, meta?: Record<string, any>): void {
    if (meta) {
      this.pino.trace(meta, message);
    } else {
      this.pino.trace(message);
    }
  }

  apiRequest(event: string, meta?: Record<string, any>): void {
    this.pino.info(
      {
        logType: 'api_request',
        event,
        ...(meta || {}),
      },
      event
    );
  }

  dbOperation(event: string, meta?: Record<string, any>): void {
    this.pino.debug(
      {
        logType: 'db_operation',
        event,
        ...(meta || {}),
      },
      event
    );
  }

  auth(
    message: string,
    walletAddress?: string,
    meta?: Record<string, any>
  ): void {
    this.pino.info(
      {
        logType: 'auth',
        walletAddress,
        ...(meta || {}),
      },
      message
    );
  }
}

// Create enhanced logger instance
const appLogger = new EnhancedLogger(logger);

// Helper function to create module-specific loggers
export function createModuleLogger(module: string): AppLogger {
  const childLogger = logger.child({ module });
  return new EnhancedLogger(childLogger);
}

// Export default logger
export default appLogger;

// Re-export pino for direct use if needed
export { pino };

// Usage examples:
// import logger from '@/lib/utils/logger';
// logger.info('Application started');
// logger.error('An error occurred', { error, userId: '123' });
//
// Module-specific logger:
// const log = createModuleLogger('auth');
// log.debug('User authentication attempt', { username });
