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

  private formatMessage(
    level: LogLevel,
    module: string,
    message: string,
    context?: Omit<LogContext, 'module'>
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] [${module}] ${message}${contextStr}`;
  }

  private shouldLog(level: LogLevel): boolean {
    // In production, only log info and above
    if (!this.isDevelopment && level === 'debug') {
      return false;
    }
    return true;
  }

  debug(module: string, message: string, context?: Omit<LogContext, 'module'>) {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', module, message, context));
    }
  }

  info(module: string, message: string, context?: Omit<LogContext, 'module'>) {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', module, message, context));
    }
  }

  warn(module: string, message: string, context?: Omit<LogContext, 'module'>) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', module, message, context));
    }
  }

  error(
    module: string,
    message: string,
    error?: any,
    context?: Omit<LogContext, 'module'>
  ) {
    if (this.shouldLog('error')) {
      const errorDetails = error
        ? {
            message: error.message || String(error),
            stack: error.stack,
            ...context,
          }
        : context;
      console.error(this.formatMessage('error', module, message, errorDetails));
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
