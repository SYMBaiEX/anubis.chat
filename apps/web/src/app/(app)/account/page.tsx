'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Card } from '@/components/ui/card';
import { UserProfile } from '@/components/auth/user-profile';

export default function AccountPage() {
  const { user } = useAuthContext();

  return (
    <AuthGuard>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Account</h1>
          <p className="text-muted-foreground">View and update your profile</p>
        </div>

        <Card className="p-6">
          {user ? (
            <UserProfile user={user} />
          ) : (
            <div className="text-sm text-muted-foreground">No user loaded.</div>
          )}
        </Card>
      </div>
    </AuthGuard>
  );
}


