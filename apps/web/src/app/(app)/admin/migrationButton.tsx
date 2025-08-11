'use client';

import { api } from '@convex/_generated/api';
import { useMutation } from 'convex/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function MigrationButton() {
  const [isRunning, setIsRunning] = useState(false);
  const cleanupUsers = useMutation(
    api.migrations.removeUpdatedAt.cleanupUsersTable
  );
  const fixBlacklistedTokens = useMutation(
    api.migrations.fixBlacklistedTokens.fixBlacklistedTokens
  );

  const runMigration = async () => {
    setIsRunning(true);
    try {
      // Run user migration
      const userResult = await cleanupUsers();
      if (userResult.success) {
        toast.success(`User migration: ${userResult.message}`);
      } else {
        toast.error(`User migration failed: ${userResult.message}`);
        userResult.errors?.forEach((err) => console.error(err));
      }

      // Run blacklisted tokens migration
      const tokenResult = await fixBlacklistedTokens();
      if (tokenResult.success) {
        toast.success(`Token migration: ${tokenResult.message}`);
      } else {
        toast.error(`Token migration failed: ${tokenResult.message}`);
        tokenResult.errors?.forEach((err) => console.error(err));
      }
    } catch (error) {
      toast.error('Migration failed: ' + (error as Error).message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Button disabled={isRunning} onClick={runMigration} variant="outline">
      {isRunning ? 'Running Migrations...' : 'Fix Schema Issues'}
    </Button>
  );
}
