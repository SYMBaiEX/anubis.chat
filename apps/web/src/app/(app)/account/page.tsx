'use client';

import { UserProfile } from '@/components/auth/user-profile';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Card } from '@/components/ui/card';

export default function AccountPage() {
  const { user } = useAuthContext();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-semibold text-2xl">Account</h1>
        <p className="text-muted-foreground">View and update your profile</p>
      </div>

      <Card className="p-6">
        {user ? (
          <UserProfile user={user} />
        ) : (
          <div className="text-muted-foreground text-sm">No user loaded.</div>
        )}
      </Card>
    </div>
  );
}
