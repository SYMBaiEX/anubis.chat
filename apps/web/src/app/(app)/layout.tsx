'use client';

import ActivityFooter from '@/components/activity-footer';
import { AuthGuard } from '@/components/auth/auth-guard';
import Sidebar from '@/components/sidebar';

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthGuard>
      <div className="flex h-[calc(100vh-2.5rem)]">
        <Sidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
      {/* Persistent authenticated activity footer */}
      <ActivityFooter />
    </AuthGuard>
  );
}
