'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingStates } from '@/components/data/loading-states';
import { useAuth } from '@/hooks/useAuth';
import type { AuthGuardProps } from '@/lib/types/components';

/**
 * AuthGuard component - Protects routes that require authentication
 * Redirects unauthenticated users to wallet connection
 */
export function AuthGuard({
  children,
  fallback,
  redirectTo = '/auth/connect',
  requireAuth = true,
  className,
}: AuthGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && requireAuth && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isLoading, isAuthenticated, requireAuth, redirectTo, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className={className}>
        {fallback ?? (
          <div className="flex min-h-screen items-center justify-center">
            <LoadingStates
              size="lg"
              text="Checking authentication..."
              variant="spinner"
            />
          </div>
        )}
      </div>
    );
  }

  // If auth is required but user is not authenticated, show fallback or redirect
  if (requireAuth && !isAuthenticated) {
    return (
      <div className={className}>
        {fallback ?? (
          <div className="flex min-h-screen items-center justify-center">
            <div className="space-y-4 text-center">
              <h2 className="font-semibold text-2xl text-gray-900 dark:text-gray-100">
                Authentication Required
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Please connect your wallet to continue.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // If auth is not required or user is authenticated, show children
  return <div className={className}>{children}</div>;
}

export default AuthGuard;
