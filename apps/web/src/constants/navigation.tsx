import type { ElementType } from 'react';
import { Home, LayoutDashboard, MessageSquare } from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon?: ElementType;
  requiresAuth?: boolean;
  inHeader?: boolean;
  inSidebar?: boolean;
  devOnly?: boolean;
}

const allItems: NavItem[] = [
  { label: 'Home', href: '/', icon: Home, inHeader: true, inSidebar: true },
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, requiresAuth: true, inHeader: true, inSidebar: true },
  { label: 'Chat', href: '/chat', icon: MessageSquare, requiresAuth: true, inHeader: true, inSidebar: true },
  { label: 'Tailwind Test', href: '/test-tailwind', icon: MessageSquare, inHeader: true, inSidebar: true, devOnly: true },
];

export function getHeaderNav(isAuthenticated: boolean, isDev: boolean): NavItem[] {
  // Show all pages in navigation; access is still protected by AuthGuard
  return allItems.filter((item) =>
    (item.inHeader ?? true)
    && (!item.devOnly || isDev)
  );
}

export function getSidebarNav(isAuthenticated: boolean, isDev: boolean): NavItem[] {
  // Show all pages in navigation; access is still protected by AuthGuard
  return allItems.filter((item) =>
    (item.inSidebar ?? true)
    && (!item.devOnly || isDev)
  );
}


