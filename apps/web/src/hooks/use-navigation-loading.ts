'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Enhanced hook for tracking navigation loading states
 * Works with Next.js App Router and provides smooth loading indicators
 */
export function useNavigationLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    let loadingTimeout: NodeJS.Timeout;

    const startLoading = () => {
      setIsLoading(true);
      setProgress(0);

      // Simulate progressive loading
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 200);

      // Auto-complete after maximum delay
      loadingTimeout = setTimeout(() => {
        setProgress(100);
        setTimeout(() => {
          setIsLoading(false);
          setProgress(0);
        }, 200);
      }, 3000);
    };

    const completeLoading = () => {
      clearInterval(progressInterval);
      clearTimeout(loadingTimeout);
      
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 300);
    };

    // Listen for navigation start events
    const handleNavigationStart = () => {
      startLoading();
    };

    // Listen for route changes (navigation complete)
    completeLoading();

    return () => {
      clearInterval(progressInterval);
      clearTimeout(loadingTimeout);
    };
  }, [pathname]);

  // Intercept link clicks and form submissions for loading states
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (link && link.href && !link.href.startsWith('#') && !link.target) {
        const url = new URL(link.href);
        const currentUrl = new URL(window.location.href);
        
        // Only show loading for different routes
        if (url.pathname !== currentUrl.pathname) {
          setIsLoading(true);
          setProgress(0);
        }
      }
    };

    const handleSubmit = (event: SubmitEvent) => {
      const form = event.target as HTMLFormElement;
      if (form && form.method === 'get') {
        setIsLoading(true);
        setProgress(0);
      }
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('submit', handleSubmit);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('submit', handleSubmit);
    };
  }, []);

  return {
    isLoading,
    progress,
  };
}

/**
 * Simplified hook for basic loading state
 */
export function useRouteLoading() {
  const { isLoading } = useNavigationLoading();
  return isLoading;
}
