'use client';

import { MessageSquare } from 'lucide-react';
import { Component, type ReactNode, Suspense } from 'react';
import { EmptyState } from '@/components/data/empty-states';
import { LoadingStates } from '@/components/data/loading-states';
import {
  useAdaptiveMessageList,
  VIRTUAL_SCROLL_THRESHOLD,
} from '@/hooks/use-adaptive-message-list';
import { errorMonitor } from '@/lib/monitoring/errorMonitor';
import type { MessageListProps } from '@/lib/types/components';
import type { FontSize } from '@/lib/utils/fontSizes';

interface MessageListSuspenseProps extends MessageListProps {
  isTyping?: boolean;
  fontSize?: FontSize;
}

/**
 * Loading fallback component with skeleton states
 */
function MessageListSkeleton() {
  return (
    <div className="flex h-full items-center justify-center">
      <LoadingStates
        size="lg"
        text="Loading conversation..."
        variant="spinner"
      />
    </div>
  );
}

/**
 * Custom Error Boundary class component
 */
class MessageListErrorBoundary extends Component<
  { children: ReactNode; onReset?: () => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode; onReset?: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Report to error monitoring system
    errorMonitor.captureError(error, {
      category: 'javascript',
      severity: 'high',
      component: 'MessageList',
      context: {
        componentStack: errorInfo.componentStack,
        errorBoundary: 'MessageListErrorBoundary',
      },
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full items-center justify-center p-4">
          <EmptyState
            action={{ label: 'Try Again', onClick: this.handleReset }}
            description={
              this.state.error?.message ||
              'An error occurred while loading the conversation'
            }
            icon={<MessageSquare className="h-12 w-12 text-destructive" />}
            title="Failed to Load Messages"
          />
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * MessageListSuspense - Wraps MessageList with React 18+ Suspense and Error Boundaries
 * Provides proper loading states and error recovery for message streams
 * Automatically switches to virtual scrolling when messages exceed threshold
 */
export function MessageListSuspense(props: MessageListSuspenseProps) {
  const AdaptiveMessageList = useAdaptiveMessageList();

  // Log when switching to virtual scrolling (development only)
  if (process.env.NODE_ENV === 'development' && props.messages) {
    const messageCount = props.messages.length;
    if (messageCount > VIRTUAL_SCROLL_THRESHOLD) {
    }
  }

  return (
    <MessageListErrorBoundary
      onReset={() => {
        // Reset any cached queries or state that might be causing issues
        window.location.reload();
      }}
    >
      <Suspense fallback={<MessageListSkeleton />}>
        <AdaptiveMessageList {...props} />
      </Suspense>
    </MessageListErrorBoundary>
  );
}

export default MessageListSuspense;
