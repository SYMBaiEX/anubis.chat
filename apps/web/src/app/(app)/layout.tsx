'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import Sidebar from '@/components/sidebar';
import ActivityFooter from '@/components/activity-footer';

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthGuard>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto pb-14">{children}</main>
      </div>
      {/* Persistent authenticated activity footer */}
      <ActivityFooter />
    </AuthGuard>
  );
}
