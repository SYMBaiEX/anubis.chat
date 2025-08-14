'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Shield, RefreshCw, Home, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('admin-error-boundary');

interface AdminErrorProps {
  error: Error & { digest?: string; statusCode?: number };
  reset: () => void;
}

export default function AdminError({ error, reset }: AdminErrorProps) {
  const [isReporting, setIsReporting] = useState(false);

  useEffect(() => {
    // Log error to error reporting service with admin context
    log.error('Admin route error', {
      error: error.message,
      stack: error.stack,
      digest: error.digest,
      statusCode: error.statusCode,
      route: '/admin',
      severity: 'high', // Admin errors are high priority
      timestamp: Date.now(),
    });

    // Auto-report critical admin errors
    if (error.statusCode === 403 || error.statusCode === 401) {
      reportSecurityIncident(error);
    }
  }, [error]);

  const reportSecurityIncident = async (error: Error & { statusCode?: number }) => {
    setIsReporting(true);
    try {
      // Report potential security incident
      await fetch('/api/security/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'admin_error',
          error: error.message,
          statusCode: error.statusCode,
          timestamp: Date.now(),
        }),
      });
    } catch (e) {
      log.error('Failed to report security incident', e);
    } finally {
      setIsReporting(false);
    }
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleLogout = () => {
    // Clear session and redirect to login
    window.location.href = '/api/auth/logout';
  };

  // Check error type
  const isAuthError = error.statusCode === 401 || error.message?.includes('unauthorized');
  const isPermissionError = error.statusCode === 403 || error.message?.includes('forbidden');
  const isServerError = error.statusCode && error.statusCode >= 500;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <Shield className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">
            {isAuthError ? 'Authentication Required' :
             isPermissionError ? 'Access Denied' :
             isServerError ? 'Server Error' :
             'Admin Panel Error'}
          </CardTitle>
          <CardDescription>
            {isAuthError ? 'Your session has expired or you need to authenticate.' :
             isPermissionError ? 'You do not have permission to access this admin resource.' :
             isServerError ? 'The server encountered an error. Our team has been notified.' :
             'An error occurred in the admin panel. This incident has been logged.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isReporting && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Security incident reported to administrators
              </AlertDescription>
            </Alert>
          )}

          {isPermissionError && (
            <Alert variant="destructive">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                This attempt has been logged for security purposes.
                If you believe you should have access, contact your administrator.
              </AlertDescription>
            </Alert>
          )}

          {process.env.NODE_ENV === 'development' && (
            <details className="rounded-md bg-muted p-3 text-sm">
              <summary className="cursor-pointer font-medium">
                Error Details
              </summary>
              <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
                Status: {error.statusCode || 'Unknown'}
                Message: {error.message}
                {error.stack && `\n\nStack:\n${error.stack}`}
              </pre>
            </details>
          )}
          
          <div className="flex flex-col gap-2">
            {!isAuthError && !isPermissionError && (
              <Button
                onClick={reset}
                variant="default"
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}
            
            {(isAuthError || isPermissionError) && (
              <Button
                onClick={handleLogout}
                variant="default"
                className="w-full"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign In Again
              </Button>
            )}
            
            <Button
              onClick={handleGoHome}
              variant="outline"
              className="w-full"
            >
              <Home className="mr-2 h-4 w-4" />
              Return to Homepage
            </Button>
          </div>
          
          <div className="text-center space-y-1">
            {error.digest && (
              <p className="text-xs text-muted-foreground">
                Incident ID: {error.digest}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              If you need assistance, contact your system administrator
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}