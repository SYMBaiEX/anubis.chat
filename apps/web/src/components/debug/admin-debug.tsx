'use client';

import { useQuery, useMutation } from 'convex/react';
import { useAuthContext } from '@/components/providers/auth-provider';
import { api } from '@convex/_generated/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export function AdminDebug() {
  const { isAuthenticated, user } = useAuthContext();
  
  // Use the original admin auth
  const adminStatus = useQuery(api.adminAuth.checkAdminStatus);
  
  // Get all admins for debugging
  const allAdmins = useQuery(api.adminAuth.getAdmins);
  
  // Mutations
  const initializeAdmins = useMutation(api.adminAuth.initializeAdminsFromEnv);

  const handleInitializeAdmins = async () => {
    try {
      const result = await initializeAdmins();
      toast.success(`Admin system initialized: ${result.totalAdmins} admins created`);
    } catch (error) {
      toast.error('Failed to initialize admin system: ' + (error as Error).message);
    }
  };

  return (
    <Card className="p-6 space-y-4">
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
          <code className="block p-2 bg-muted rounded text-sm">
            {user?.walletAddress || 'No wallet address'}
          </code>
        </div>

        <div>
          <label className="font-medium text-sm">Admin Status Response:</label>
          <code className="block p-2 bg-muted rounded text-sm">
            {JSON.stringify(adminStatus, null, 2)}
          </code>
        </div>

        <div>
          <label className="font-medium text-sm">All Admins in Database:</label>
          <code className="block p-2 bg-muted rounded text-sm">
            {allAdmins ? JSON.stringify(allAdmins, null, 2) : 'Loading or error...'}
          </code>
        </div>

        <div>
          <label className="font-medium text-sm">Environment Admin Wallets:</label>
          <code className="block p-2 bg-muted rounded text-sm">
            {process.env.NEXT_PUBLIC_ADMIN_WALLETS}
          </code>
        </div>

        <div className="pt-4">
          <Button onClick={handleInitializeAdmins}>
            Initialize Admin System
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            This will create admin entries for the wallets in ADMIN_WALLETS environment variable.
          </p>
        </div>
      </div>
    </Card>
  );
}