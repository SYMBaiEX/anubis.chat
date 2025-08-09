'use client';

import { Shield, AlertCircle } from 'lucide-react';
import { useQuery } from 'convex/react';
import { useAuthContext } from '@/components/providers/auth-provider';
import { api } from '@convex/_generated/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface AdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requiredPermissions?: string[];
}

export function AdminGuard({ 
  children, 
  fallback, 
  requiredPermissions = [] 
}: AdminGuardProps) {
  const { isAuthenticated, user } = useAuthContext();
  const router = useRouter();
  
  // Check admin status using wallet address (the working method)
  const adminStatus = useQuery(
    api.adminAuth.checkAdminStatusByWallet,
    user?.walletAddress ? { walletAddress: user.walletAddress } : 'skip'
  );
  
  // Loading state
  if (adminStatus === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 animate-pulse text-muted-foreground" />
          <h2 className="mt-4 font-semibold text-xl">Checking Permissions...</h2>
          <p className="text-muted-foreground">Verifying admin access</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return fallback || (
      <div className="flex h-full items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="mx-auto h-12 w-12 text-orange-500" />
          <h2 className="mt-4 font-semibold text-xl">Authentication Required</h2>
          <p className="mt-2 text-muted-foreground">
            Please connect your wallet to access this page.
          </p>
          <Button 
            className="mt-4" 
            onClick={() => router.push('/auth')}
          >
            Connect Wallet
          </Button>
        </Card>
      </div>
    );
  }

  // Not an admin
  if (!adminStatus?.isAdmin) {
    return fallback || (
      <div className="flex h-full items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Shield className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 font-semibold text-xl">Admin Access Required</h2>
          <p className="mt-2 text-muted-foreground">
            You do not have permission to access this administrative area.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            If you believe this is an error, please contact a system administrator.
          </p>
          <Button 
            variant="outline"
            className="mt-4" 
            onClick={() => router.push('/dashboard')}
          >
            Return to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  // Check specific permissions if required
  if (requiredPermissions.length > 0 && adminStatus.adminInfo) {
    const hasRequiredPermissions = requiredPermissions.every(permission => 
      adminStatus.adminInfo?.permissions?.includes(permission) || 
      adminStatus.adminInfo?.role === 'super_admin'
    );

    if (!hasRequiredPermissions) {
      return fallback || (
        <div className="flex h-full items-center justify-center">
          <Card className="p-8 text-center max-w-md">
            <Shield className="mx-auto h-12 w-12 text-orange-500" />
            <h2 className="mt-4 font-semibold text-xl">Insufficient Permissions</h2>
            <p className="mt-2 text-muted-foreground">
              You do not have the required permissions to access this area.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Required: {requiredPermissions.join(', ')}
            </p>
            <Button 
              variant="outline"
              className="mt-4" 
              onClick={() => router.push('/admin')}
            >
              Back to Admin Dashboard
            </Button>
          </Card>
        </div>
      );
    }
  }

  // User is authenticated and has admin access
  return <>{children}</>;
}

// Specific guards for common admin sections
export function UserManagementGuard({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard requiredPermissions={['user_management']}>
      {children}
    </AdminGuard>
  );
}

export function SubscriptionManagementGuard({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard requiredPermissions={['subscription_management']}>
      {children}
    </AdminGuard>
  );
}

export function SystemSettingsGuard({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard requiredPermissions={['system_settings']}>
      {children}
    </AdminGuard>
  );
}

export function SuperAdminGuard({ children }: { children: React.ReactNode }) {
  const adminStatus = useQuery(api.adminAuth.checkCurrentUserAdminStatus);
  
  if (adminStatus?.adminInfo?.role !== 'super_admin') {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Shield className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 font-semibold text-xl">Super Admin Required</h2>
          <p className="mt-2 text-muted-foreground">
            This section requires super administrator privileges.
          </p>
        </Card>
      </div>
    );
  }
  
  return <AdminGuard>{children}</AdminGuard>;
}