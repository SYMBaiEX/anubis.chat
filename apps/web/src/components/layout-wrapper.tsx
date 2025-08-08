'use client';

import Header from '@/components/header';
import Sidebar from '@/components/sidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content - Grid approach for better responsive layout */}
      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col transition-all duration-300',
          // Use margin-left to shift content when sidebar state changes
          isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        )}
      >
        <Header />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
