'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentProps } from 'react';
import { useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';

// Priority levels for prefetching
enum PrefetchPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

// Resource hints for browser
const resourceHints = {
  dns: 'dns-prefetch',
  preconnect: 'preconnect',
  prefetch: 'prefetch',
  prerender: 'prerender',
} as const;

// Smart prefetching based on user behavior
export function usePrefetch() {
  const pathname = usePathname();
  const prefetchedUrls = useRef(new Set<string>());

  useEffect(() => {
    // Analyze current route and prefetch likely next pages
    const prefetchStrategy = getPrefetchStrategy(pathname);

    prefetchStrategy.forEach((url) => {
      if (!prefetchedUrls.current.has(url)) {
        prefetchResource(url);
        prefetchedUrls.current.add(url);
      }
    });
  }, [pathname]);

  return { prefetchedUrls: prefetchedUrls.current };
}

// Get prefetch strategy based on current route
function getPrefetchStrategy(pathname: string): string[] {
  const strategies: Record<string, string[]> = {
    '/': ['/chat', '/agents', '/dashboard'],
    '/chat': ['/agents', '/workflows', '/dashboard'],
    '/agents': ['/chat', '/workflows', '/mcp'],
    '/workflows': ['/agents', '/chat', '/dashboard'],
    '/dashboard': ['/chat', '/agents', '/subscription'],
    '/subscription': ['/dashboard', '/referral-info'],
  };

  return strategies[pathname] || [];
}

// Prefetch a resource
function prefetchResource(
  url: string,
  priority: PrefetchPriority = PrefetchPriority.MEDIUM
) {
  if (typeof window === 'undefined') return;

  // Create link element for prefetching
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;

  // Set priority attribute
  if ('as' in link) {
    (link as any).as = 'document';
  }

  if ('importance' in link) {
    (link as any).importance = priority;
  }

  document.head.appendChild(link);
}

// Smart Link component with intersection observer prefetching
interface SmartLinkProps extends ComponentProps<typeof Link> {
  prefetchOnHover?: boolean;
  prefetchOnView?: boolean;
  prefetchDelay?: number;
}

export function SmartLink({
  children,
  href,
  prefetchOnHover = true,
  prefetchOnView = true,
  prefetchDelay = 2000,
  ...props
}: SmartLinkProps) {
  const [ref, inView] = useInView({
    triggerOnce: true,
    rootMargin: '50px',
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prefetched = useRef(false);

  useEffect(() => {
    if (prefetchOnView && inView && !prefetched.current) {
      // Prefetch after delay when in view
      timeoutRef.current = setTimeout(() => {
        if (!prefetched.current) {
          prefetchResource(href.toString(), PrefetchPriority.LOW);
          prefetched.current = true;
        }
      }, prefetchDelay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [inView, href, prefetchOnView, prefetchDelay]);

  const handleMouseEnter = () => {
    if (prefetchOnHover && !prefetched.current) {
      prefetchResource(href.toString(), PrefetchPriority.HIGH);
      prefetched.current = true;
    }
  };

  return (
    <Link
      href={href}
      onMouseEnter={handleMouseEnter}
      prefetch={false}
      ref={ref} // Disable Next.js default prefetch
      {...props}
    >
      {children}
    </Link>
  );
}

// Resource hints component for critical third-party domains
export function ResourceHints() {
  return (
    <>
      {/* DNS prefetch for third-party domains */}
      <link href="https://fonts.googleapis.com" rel="dns-prefetch" />
      <link href="https://fonts.gstatic.com" rel="dns-prefetch" />
      <link href="https://cdn.jsdelivr.net" rel="dns-prefetch" />

      {/* Preconnect to critical origins */}
      <link href="https://fonts.googleapis.com" rel="preconnect" />
      <link
        crossOrigin="anonymous"
        href="https://fonts.gstatic.com"
        rel="preconnect"
      />

      {/* Prefetch critical resources - Using Convex for auth/preferences */}
    </>
  );
}

// Adaptive loading based on connection speed
export function useAdaptiveLoading() {
  const connection = useNetworkInformation();

  const shouldPrefetch = () => {
    if (!connection) return true; // Default to prefetching

    // Don't prefetch on slow connections
    if (
      connection.effectiveType === 'slow-2g' ||
      connection.effectiveType === '2g'
    ) {
      return false;
    }

    // Don't prefetch if save data is enabled
    if (connection.saveData) {
      return false;
    }

    return true;
  };

  const getImageQuality = () => {
    if (!connection) return 'high';

    switch (connection.effectiveType) {
      case 'slow-2g':
      case '2g':
        return 'low';
      case '3g':
        return 'medium';
      case '4g':
      default:
        return 'high';
    }
  };

  return {
    shouldPrefetch: shouldPrefetch(),
    imageQuality: getImageQuality(),
    connectionType: connection?.effectiveType || 'unknown',
  };
}

// Hook to get network information
function useNetworkInformation() {
  const [connection, setConnection] = useState<any>(null);

  useEffect(() => {
    if (
      'connection' in navigator ||
      'mozConnection' in navigator ||
      'webkitConnection' in navigator
    ) {
      const nav = navigator as any;
      const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

      setConnection(conn);

      const handleChange = () => {
        setConnection(conn);
      };

      conn?.addEventListener('change', handleChange);

      return () => {
        conn?.removeEventListener('change', handleChange);
      };
    }
  }, []);

  return connection;
}

// Preload critical CSS - only in production where these files exist
export function PreloadStyles() {
  const isProduction = process.env.NODE_ENV === 'production';

  return (
    <>
      {isProduction && (
        <link as="style" href="/_next/static/css/app.css" rel="preload" />
      )}
      <link
        as="style"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        rel="preload"
      />
    </>
  );
}

// Preload critical scripts - only in production where these files exist
export function PreloadScripts() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    return null; // Turbopack handles script loading in dev mode
  }

  return (
    <>
      <link href="/_next/static/chunks/main.js" rel="modulepreload" />
      <link href="/_next/static/chunks/framework.js" rel="modulepreload" />
    </>
  );
}

import { useState } from 'react';
