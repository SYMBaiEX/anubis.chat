'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, MessageSquare, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('chat-error-boundary');

interface ChatErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ChatError({ error, reset }: ChatErrorProps) {
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    // Log error to error reporting service
    log.error('Chat route error', {
      error: error.message,
      stack: error.stack,
      digest: error.digest,
      route: '/chat',
      retryCount,
      timestamp: Date.now(),
    });
  }, [error, retryCount]);

  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      reset();
    }
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleNewChat = () => {
    window.location.href = '/chat';
  };

  // Check if it's a connection error
  const isConnectionError = error.message?.toLowerCase().includes('fetch') || 
                           error.message?.toLowerCase().includes('network') ||
                           error.message?.toLowerCase().includes('convex');

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <MessageSquare className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">
            {isConnectionError ? 'Connection Error' : 'Chat Error'}
          </CardTitle>
          <CardDescription>
            {isConnectionError 
              ? 'Unable to connect to the chat service. Please check your connection and try again.'
              : 'An error occurred while loading your chat. Your conversation is safe and can be accessed again.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {retryCount >= maxRetries && (
            <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 p-3 text-sm text-amber-900 dark:text-amber-200">
              <p className="font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Maximum retry attempts reached
              </p>
              <p className="mt-1 text-xs">
                The chat service may be experiencing issues. Please try again later or contact support.
              </p>
            </div>
          )}

          {process.env.NODE_ENV === 'development' && (
            <details className="rounded-md bg-muted p-3 text-sm">
              <summary className="cursor-pointer font-medium">
                Error Details
              </summary>
              <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
                {error.message}
                {error.stack && `\n\nStack:\n${error.stack}`}
              </pre>
            </details>
          )}
          
          <div className="flex flex-col gap-2">
            {retryCount < maxRetries && (
              <Button
                onClick={handleRetry}
                variant="default"
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again ({maxRetries - retryCount} attempts left)
              </Button>
            )}
            <Button
              onClick={handleNewChat}
              variant="outline"
              className="w-full"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Start New Chat
            </Button>
            <Button
              onClick={handleGoHome}
              variant="ghost"
              className="w-full"
            >
              <Home className="mr-2 h-4 w-4" />
              Go to Homepage
            </Button>
          </div>
          
          {error.digest && (
            <p className="text-center text-xs text-muted-foreground">
              Error ID: {error.digest}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}