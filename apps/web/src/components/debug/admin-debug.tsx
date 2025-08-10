'use client';

import { api } from '@convex/_generated/api';
import { useMutation, useQuery } from 'convex/react';
import { toast } from 'sonner';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function AdminDebug() {
  const { isAuthenticated, user } = useAuthContext();

  // Use the original admin auth
  const adminStatus = useQuery(api.adminAuth.checkCurrentUserAdminStatus);

  // Get all admins for debugging
  const allAdmins = useQuery(api.adminAuth.getAllAdmins);

  // Mutations
  const syncAdminsFromEnv = useMutation(api.adminAuth.syncAdminWallets);

  const handleInitializeAdmins = async () => {
    try {
      const result = await syncAdminsFromEnv();
      toast.success(
        `Admin system initialized: ${result.totalAdminWallets} admin wallets synced`
      );
    } catch (error) {
      toast.error(
        'Failed to initialize admin system: ' + (error as Error).message
      );
    }
  };

  return (
    <Card className="space-y-4 p-6">
      <h3 className="font-semibold text-lg">Admin Debug Information</h3>

      <div className="space-y-3">
        <div>
          <label className="font-medium text-sm">Authentication Status:</label>
          <Badge variant={isAuthenticated ? 'default' : 'secondary'}>
            {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
          </Badge>
        </div>

        <div>
          <label className="font-medium text-sm">User Wallet:</label>
          <code className="block rounded bg-muted p-2 text-sm">
            {user?.walletAddress || 'No wallet address'}
          </code>
        </div>

        <div>
          <label className="font-medium text-sm">Admin Status Response:</label>
          <code className="block rounded bg-muted p-2 text-sm">
            {JSON.stringify(adminStatus, null, 2)}
          </code>
        </div>

        <div>
          <label className="font-medium text-sm">All Admins in Database:</label>
          <code className="block rounded bg-muted p-2 text-sm">
            {allAdmins
              ? JSON.stringify(allAdmins, null, 2)
              : 'Loading or error...'}
          </code>
        </div>

        <div>
          <label className="font-medium text-sm">
            Environment Admin Wallets:
          </label>
          <code className="block rounded bg-muted p-2 text-sm">
            {process.env.NEXT_PUBLIC_ADMIN_WALLETS}
          </code>
        </div>

        <div className="pt-4">
          <Button onClick={handleInitializeAdmins}>
            Initialize Admin System
          </Button>
          <p className="mt-2 text-muted-foreground text-sm">
            This will create admin entries for the wallets in ADMIN_WALLETS
            environment variable.
          </p>
        </div>
      </div>
    </Card>
  );
}
