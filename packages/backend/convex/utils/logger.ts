/**
 * Centralized logging utility for Convex backend
 * Provides consistent logging with proper context and levels
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  module: string;
  action?: string;
  userId?: string;
  messageId?: string;
  chatId?: string;
  [key: string]: any;
}

class Logger {
  private readonly isDevelopment = process.env.NODE_ENV !== 'production';

  private shouldLog(level: LogLevel): boolean {
    // In production, only log info and above
    if (!this.isDevelopment && level === 'debug') {
      return false;
    }
    return true;
  }

  debug(
    _module: string,
    _message: string,
    _context?: Omit<LogContext, 'module'>
  ) {
    if (this.shouldLog('debug')) {
    }
  }

  info(
    _module: string,
    _message: string,
    _context?: Omit<LogContext, 'module'>
  ) {
    if (this.shouldLog('info')) {
    }
  }

  warn(
    _module: string,
    _message: string,
    _context?: Omit<LogContext, 'module'>
  ) {
    if (this.shouldLog('warn')) {
    }
  }

  error(
    _module: string,
    _message: string,
    error?: any,
    context?: Omit<LogContext, 'module'>
  ) {
    if (this.shouldLog('error')) {
      const _errorDetails = error
        ? {
            message: error.message || String(error),
            stack: error.stack,
            ...context,
          }
        : context;
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions for specific modules
export const createModuleLogger = (moduleName: string) => ({
  debug: (message: string, context?: Omit<LogContext, 'module'>) =>
    logger.debug(moduleName, message, context),
  info: (message: string, context?: Omit<LogContext, 'module'>) =>
    logger.info(moduleName, message, context),
  warn: (message: string, context?: Omit<LogContext, 'module'>) =>
    logger.warn(moduleName, message, context),
  error: (message: string, error?: any, context?: Omit<LogContext, 'module'>) =>
    logger.error(moduleName, message, error, context),
});
