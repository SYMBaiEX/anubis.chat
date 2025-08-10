'use client';

import { AdminDebug } from '@/components/debug/admin-debug';

export default function AdminDebugPage() {
  return (
    <div className="p-6">
      <h1 className="mb-6 font-bold text-2xl">Admin Debug Page</h1>
      <p className="mb-4 text-muted-foreground">
        This page helps debug admin access issues. It shows authentication
        status, wallet addresses, and admin configuration.
      </p>
      <AdminDebug />
    </div>
  );
}
