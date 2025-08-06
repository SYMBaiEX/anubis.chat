'use client';

import { useEffect } from 'react';
import { registerServiceWorker, resetPWAState } from '@/lib/service-worker';

export default function ServiceWorkerManager() {
  useEffect(() => {
    // Register service worker on mount
    registerServiceWorker({
      onUpdate: (registration) => {
        console.log(
          'New version available! Consider prompting user to reload.'
        );
        // Optionally show update notification to user
      },
      onSuccess: (registration) => {
        console.log('ISIS Chat PWA ready for offline use');
      },
      onError: (error) => {
        console.error('Service Worker registration failed:', error);
      },
    });

    // Development helper - expose reset function globally
    if (process.env.NODE_ENV === 'development') {
      (window as any).resetPWA = resetPWAState;
      console.log('Development mode: Use window.resetPWA() to reset PWA state');
    }
  }, []);

  return null; // This component doesn't render anything
}
