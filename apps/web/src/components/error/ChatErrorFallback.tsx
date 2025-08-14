'use client';

import { useState } from 'react';
import { MessageSquare, RefreshCw, AlertTriangle, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ErrorRecovery } from './ErrorRecovery';
import { useErrorContext } from './ErrorContext';
import { ErrorSeverity } from '@/lib/error-reporting';

interface ChatErrorFallbackProps {
  error: Error & { 
    code?: string;
    statusCode?: number;
    conversationId?: string;
  };
  resetError: () => void;
  minimal?: boolean;
}

export function ChatErrorFallback({ 
  error, 
  resetError,
  minimal = false 
}: ChatErrorFallbackProps) {
  const [copied, setCopied] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const { captureError } = useErrorContext();

  // Capture error for reporting
  useState(() => {
    captureError(error, {
      route: '/chat',
      action: 'chat_error',
      metadata: {
        conversationId: error.conversationId,
        code: error.code,
        statusCode: error.statusCode,
      },
    }, ErrorSeverity.MEDIUM);
  });

  const handleCopyError = async () => {
    const errorText = `Error: ${error.message}\nCode: ${error.code || 'N/A'}\nConversation: ${error.conversationId || 'N/A'}`;
    await navigator.clipboard.writeText(errorText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNewChat = () => {
    window.location.href = '/chat';
  };

  // Minimal fallback for inline errors
  if (minimal) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Chat temporarily unavailable</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={resetError}
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Check error type for specific messaging
  const isStreamError = error.message?.includes('stream') || error.code === 'STREAM_ERROR';
  const isModelError = error.code === 'MODEL_ERROR' || error.message?.includes('model');
  const isRateLimitError = error.statusCode === 429 || error.code === 'RATE_LIMIT';

  return (
    <div className="flex min-h-[500px] items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
            <MessageSquare className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle>
            {isStreamError ? 'Message Stream Interrupted' :
             isModelError ? 'AI Model Error' :
             isRateLimitError ? 'Too Many Messages' :
             'Chat Error'}
          </CardTitle>
          <CardDescription>
            {isStreamError ? 'The message stream was interrupted. Your conversation is safe.' :
             isModelError ? 'The AI model encountered an issue. Try a different model or retry.' :
             isRateLimitError ? 'You\'ve reached the message limit. Please wait a moment.' :
             'Something went wrong with the chat. Your conversation data is preserved.'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {showRecovery ? (
            <ErrorRecovery
              error={error}
              retry={resetError}
              onRecoveryComplete={() => setShowRecovery(false)}
            />
          ) : (
            <>
              {isRateLimitError && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Rate limit will reset in a few minutes. Consider upgrading for higher limits.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => setShowRecovery(true)}
                  variant="default"
                  className="w-full"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Smart Recovery
                </Button>
                
                <Button
                  onClick={resetError}
                  variant="outline"
                  className="w-full"
                >
                  Quick Retry
                </Button>
                
                <Button
                  onClick={handleNewChat}
                  variant="ghost"
                  className="w-full"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Start Fresh Chat
                </Button>
              </div>

              {error.conversationId && (
                <div className="rounded-md bg-muted p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Conversation ID: {error.conversationId.slice(0, 8)}...
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCopyError}
                    >
                      {copied ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {process.env.NODE_ENV === 'development' && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted-foreground">
                    Debug Info
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
                    {JSON.stringify({
                      message: error.message,
                      code: error.code,
                      statusCode: error.statusCode,
                      stack: error.stack?.split('\n').slice(0, 3).join('\n'),
                    }, null, 2)}
                  </pre>
                </details>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}