'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { reportError, ErrorSeverity, type ErrorContext as ErrorContextType } from '@/lib/error-reporting';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('error-context');

// Error state interface
export interface ErrorInfo {
  id: string;
  error: Error;
  context?: ErrorContextType;
  severity: ErrorSeverity;
  timestamp: number;
  retryCount: number;
  recovered: boolean;
}

// Error state
interface ErrorState {
  errors: Map<string, ErrorInfo>;
  activeError: ErrorInfo | null;
  errorHistory: ErrorInfo[];
  isRecovering: boolean;
  globalErrorHandler: ((error: Error) => void) | null;
}

// Action types
type ErrorAction =
  | { type: 'ADD_ERROR'; payload: ErrorInfo }
  | { type: 'REMOVE_ERROR'; payload: string }
  | { type: 'SET_ACTIVE_ERROR'; payload: ErrorInfo | null }
  | { type: 'UPDATE_ERROR'; payload: { id: string; updates: Partial<ErrorInfo> } }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'SET_RECOVERING'; payload: boolean }
  | { type: 'ADD_TO_HISTORY'; payload: ErrorInfo }
  | { type: 'SET_GLOBAL_HANDLER'; payload: ((error: Error) => void) | null };

// Initial state
const initialState: ErrorState = {
  errors: new Map(),
  activeError: null,
  errorHistory: [],
  isRecovering: false,
  globalErrorHandler: null,
};

// Reducer
function errorReducer(state: ErrorState, action: ErrorAction): ErrorState {
  switch (action.type) {
    case 'ADD_ERROR': {
      const newErrors = new Map(state.errors);
      newErrors.set(action.payload.id, action.payload);
      return {
        ...state,
        errors: newErrors,
        activeError: action.payload,
      };
    }

    case 'REMOVE_ERROR': {
      const newErrors = new Map(state.errors);
      newErrors.delete(action.payload);
      return {
        ...state,
        errors: newErrors,
        activeError: state.activeError?.id === action.payload ? null : state.activeError,
      };
    }

    case 'SET_ACTIVE_ERROR':
      return {
        ...state,
        activeError: action.payload,
      };

    case 'UPDATE_ERROR': {
      const newErrors = new Map(state.errors);
      const existing = newErrors.get(action.payload.id);
      if (existing) {
        newErrors.set(action.payload.id, {
          ...existing,
          ...action.payload.updates,
        });
      }
      return {
        ...state,
        errors: newErrors,
      };
    }

    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: new Map(),
        activeError: null,
      };

    case 'SET_RECOVERING':
      return {
        ...state,
        isRecovering: action.payload,
      };

    case 'ADD_TO_HISTORY':
      return {
        ...state,
        errorHistory: [...state.errorHistory, action.payload].slice(-50), // Keep last 50 errors
      };

    case 'SET_GLOBAL_HANDLER':
      return {
        ...state,
        globalErrorHandler: action.payload,
      };

    default:
      return state;
  }
}

// Context value interface
interface ErrorContextValue {
  state: ErrorState;
  captureError: (error: Error, context?: ErrorContextType, severity?: ErrorSeverity) => string;
  dismissError: (id: string) => void;
  retryError: (id: string) => void;
  clearAllErrors: () => void;
  setGlobalErrorHandler: (handler: ((error: Error) => void) | null) => void;
  getError: (id: string) => ErrorInfo | undefined;
  hasErrors: () => boolean;
  getErrorCount: () => number;
  getErrorHistory: () => ErrorInfo[];
}

// Create context
const ErrorContext = createContext<ErrorContextValue | null>(null);

// Provider component
export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(errorReducer, initialState);

  // Capture error
  const captureError = useCallback((
    error: Error,
    context?: ErrorContextType,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
  ): string => {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const errorInfo: ErrorInfo = {
      id: errorId,
      error,
      context,
      severity,
      timestamp: Date.now(),
      retryCount: 0,
      recovered: false,
    };

    // Add to state
    dispatch({ type: 'ADD_ERROR', payload: errorInfo });

    // Report to service
    reportError(error, context, severity);

    // Log locally
    log.error('Error captured', {
      id: errorId,
      message: error.message,
      severity,
      context,
    });

    // Call global handler if set
    if (state.globalErrorHandler) {
      state.globalErrorHandler(error);
    }

    return errorId;
  }, [state.globalErrorHandler]);

  // Dismiss error
  const dismissError = useCallback((id: string) => {
    const error = state.errors.get(id);
    if (error) {
      // Add to history before removing
      dispatch({ type: 'ADD_TO_HISTORY', payload: error });
      dispatch({ type: 'REMOVE_ERROR', payload: id });
      
      log.info('Error dismissed', { id });
    }
  }, [state.errors]);

  // Retry error
  const retryError = useCallback((id: string) => {
    const error = state.errors.get(id);
    if (error) {
      dispatch({
        type: 'UPDATE_ERROR',
        payload: {
          id,
          updates: {
            retryCount: error.retryCount + 1,
          },
        },
      });

      log.info('Error retry attempted', {
        id,
        retryCount: error.retryCount + 1,
      });
    }
  }, [state.errors]);

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    // Add all current errors to history
    state.errors.forEach(error => {
      dispatch({ type: 'ADD_TO_HISTORY', payload: error });
    });
    
    dispatch({ type: 'CLEAR_ERRORS' });
    log.info('All errors cleared');
  }, [state.errors]);

  // Set global error handler
  const setGlobalErrorHandler = useCallback((handler: ((error: Error) => void) | null) => {
    dispatch({ type: 'SET_GLOBAL_HANDLER', payload: handler });
  }, []);

  // Get error by ID
  const getError = useCallback((id: string): ErrorInfo | undefined => {
    return state.errors.get(id);
  }, [state.errors]);

  // Check if has errors
  const hasErrors = useCallback((): boolean => {
    return state.errors.size > 0;
  }, [state.errors]);

  // Get error count
  const getErrorCount = useCallback((): number => {
    return state.errors.size;
  }, [state.errors]);

  // Get error history
  const getErrorHistory = useCallback((): ErrorInfo[] => {
    return state.errorHistory;
  }, [state.errorHistory]);

  // Set up global error handler
  useEffect(() => {
    const handleUnhandledError = (event: ErrorEvent) => {
      captureError(
        new Error(event.message),
        {
          route: window.location.pathname,
          action: 'unhandled_error',
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        },
        ErrorSeverity.HIGH
      );
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      captureError(
        new Error(event.reason?.message || 'Unhandled promise rejection'),
        {
          route: window.location.pathname,
          action: 'unhandled_rejection',
          metadata: {
            reason: event.reason,
          },
        },
        ErrorSeverity.HIGH
      );
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('error', handleUnhandledError);
      window.addEventListener('unhandledrejection', handleUnhandledRejection);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('error', handleUnhandledError);
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      }
    };
  }, [captureError]);

  const value: ErrorContextValue = {
    state,
    captureError,
    dismissError,
    retryError,
    clearAllErrors,
    setGlobalErrorHandler,
    getError,
    hasErrors,
    getErrorCount,
    getErrorHistory,
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
}

// Hook to use error context
export function useErrorContext() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorContext must be used within an ErrorProvider');
  }
  return context;
}

// Error boundary integration hook
export function useErrorBoundary() {
  const { captureError } = useErrorContext();

  const resetErrorBoundary = useCallback(() => {
    // Reset logic can be customized
    window.location.reload();
  }, []);

  const showBoundary = useCallback((error: Error) => {
    captureError(error, undefined, ErrorSeverity.HIGH);
    throw error; // Re-throw to trigger error boundary
  }, [captureError]);

  return {
    resetErrorBoundary,
    showBoundary,
  };
}

// Error notification component
export function ErrorNotification() {
  const { state, dismissError } = useErrorContext();
  
  if (!state.activeError) return null;

  const { id, error, severity } = state.activeError;

  return (
    <div className={`fixed bottom-4 right-4 max-w-sm p-4 rounded-lg shadow-lg z-50 ${
      severity === ErrorSeverity.CRITICAL ? 'bg-destructive text-destructive-foreground' :
      severity === ErrorSeverity.HIGH ? 'bg-orange-500 text-white' :
      'bg-yellow-500 text-white'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-semibold">Error Occurred</p>
          <p className="text-sm mt-1">{error.message}</p>
        </div>
        <button
          onClick={() => dismissError(id)}
          className="ml-4 text-white/80 hover:text-white"
        >
          ×
        </button>
      </div>
    </div>
  );
}