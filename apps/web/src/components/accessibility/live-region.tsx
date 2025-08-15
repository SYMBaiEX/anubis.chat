'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface LiveRegionProps {
  message?: string;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
  className?: string;
}

/**
 * Live region for screen reader announcements
 * Updates are automatically announced to screen readers
 */
export function LiveRegion({
  message,
  politeness = 'polite',
  atomic = true,
  relevant = 'additions',
  className,
}: LiveRegionProps) {
  return (
    <div
      aria-atomic={atomic}
      aria-live={politeness}
      aria-relevant={relevant}
      className={cn('sr-only', className)}
      role="status"
    >
      {message}
    </div>
  );
}

/**
 * Hook for managing live region announcements
 */
export function useLiveAnnouncements() {
  const announcementRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const announce = (
    message: string,
    options: {
      politeness?: 'polite' | 'assertive';
      clearAfter?: number;
    } = {}
  ) => {
    const { politeness = 'polite', clearAfter = 0 } = options;

    if (!announcementRef.current) {
      return;
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set the announcement
    announcementRef.current.setAttribute('aria-live', politeness);
    announcementRef.current.textContent = message;

    // Clear after specified time if requested
    if (clearAfter > 0) {
      timeoutRef.current = setTimeout(() => {
        if (announcementRef.current) {
          announcementRef.current.textContent = '';
        }
      }, clearAfter);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    announcementRef,
    announce,
  };
}

/**
 * Visual and auditory loading indicator
 */
interface LoadingAnnouncementProps {
  isLoading: boolean;
  loadingMessage?: string;
  completeMessage?: string;
  errorMessage?: string;
  status?: 'loading' | 'complete' | 'error';
}

export function LoadingAnnouncement({
  isLoading,
  loadingMessage = 'Loading...',
  completeMessage = 'Loading complete',
  errorMessage = 'Loading failed',
  status,
}: LoadingAnnouncementProps) {
  const { announcementRef, announce } = useLiveAnnouncements();

  useEffect(() => {
    if (isLoading) {
      announce(loadingMessage, { politeness: 'polite' });
    } else if (status === 'complete') {
      announce(completeMessage, { politeness: 'polite', clearAfter: 3000 });
    } else if (status === 'error') {
      announce(errorMessage, { politeness: 'assertive' });
    }
  }, [
    isLoading,
    status,
    loadingMessage,
    completeMessage,
    errorMessage,
    announce,
  ]);

  return <div aria-atomic="true" className="sr-only" ref={announcementRef} />;
}
