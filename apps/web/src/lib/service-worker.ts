/**
 * Service Worker Registration and Management for ISIS Chat
 * Handles PWA functionality with error-resistant registration
 */

export interface ServiceWorkerConfig {
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

/**
 * Register the ISIS Chat service worker with error handling
 */
export async function registerServiceWorker(config: ServiceWorkerConfig = {}) {
  // Only run in browser environment
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('Service Worker not supported in this environment');
    return;
  }

  try {
    // Unregister any existing service workers to prevent conflicts
    const existingRegistrations =
      await navigator.serviceWorker.getRegistrations();

    for (const registration of existingRegistrations) {
      // Only unregister if it's not our current service worker
      if (
        registration.scope !== `${window.location.origin}/` ||
        !registration.active?.scriptURL.includes('/sw.js')
      ) {
        console.log(
          'Unregistering conflicting service worker:',
          registration.scope
        );
        await registration.unregister();
      }
    }

    // Register our service worker
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'imports',
    });

    console.log(
      'ISIS Chat Service Worker registered successfully:',
      registration
    );

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const installingWorker = registration.installing;

      if (installingWorker) {
        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New content is available
              console.log('New content is available!');
              config.onUpdate?.(registration);
            } else {
              // Content is cached for first time
              console.log('Content is cached for offline use.');
              config.onSuccess?.(registration);
            }
          }
        });
      }
    });

    config.onSuccess?.(registration);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    config.onError?.(error as Error);
    throw error;
  }
}

/**
 * Unregister all service workers
 */
export async function unregisterServiceWorkers() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();

    for (const registration of registrations) {
      console.log('Unregistering service worker:', registration.scope);
      await registration.unregister();
    }

    console.log('All service workers unregistered');
  } catch (error) {
    console.error('Failed to unregister service workers:', error);
  }
}

/**
 * Clear all caches
 */
export async function clearCaches() {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return;
  }

  try {
    const cacheNames = await caches.keys();

    for (const cacheName of cacheNames) {
      console.log('Clearing cache:', cacheName);
      await caches.delete(cacheName);
    }

    console.log('All caches cleared');
  } catch (error) {
    console.error('Failed to clear caches:', error);
  }
}

/**
 * Send a message to the service worker
 */
export function sendMessageToServiceWorker(message: any) {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message);
  }
}

/**
 * Development helper to reset PWA state
 */
export async function resetPWAState() {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('resetPWAState should only be used in development');
    return;
  }

  try {
    await Promise.all([unregisterServiceWorkers(), clearCaches()]);

    console.log('PWA state reset complete - refreshing page...');

    // Reload the page to ensure clean state
    window.location.reload();
  } catch (error) {
    console.error('Failed to reset PWA state:', error);
  }
}
