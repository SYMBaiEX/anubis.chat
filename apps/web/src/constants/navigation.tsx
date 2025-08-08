import {
  Bot,
  Home,
  LayoutDashboard,
  MessageSquare,
  Server,
  User,
} from 'lucide-react';
import type { ElementType } from 'react';

export interface NavItem {
  label: string;
  href: string;
  icon?: ElementType;
  requiresAuth?: boolean;
  hideWhenAuth?: boolean;
  inHeader?: boolean;
  inSidebar?: boolean;
  devOnly?: boolean;
}

const allItems: NavItem[] = [
  { label: 'Home', href: '/', icon: Home, hideWhenAuth: true, inHeader: true, inSidebar: true },
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    requiresAuth: true,
    inHeader: true,
    inSidebar: true,
  },
  {
    label: 'Chat',
    href: '/chat',
    icon: MessageSquare,
    requiresAuth: true,
    inHeader: true,
    inSidebar: true,
  },
  {
    label: 'Agents',
    href: '/agents/new',
    icon: Bot,
    requiresAuth: true,
    inHeader: true,
    inSidebar: true,
  },
  {
    label: 'MCP',
    href: '/mcp',
    icon: Server,
    requiresAuth: true,
    inHeader: true,
    inSidebar: true,
  },
  {
    label: 'Account',
    href: '/account',
    icon: User,
    requiresAuth: true,
    inHeader: true,
    inSidebar: true,
  },
  // Tailwind Test removed
];

export function getHeaderNav(
  isAuthenticated: boolean,
  isDev: boolean
): NavItem[] {
  // Show all pages in navigation; access is still protected by AuthGuard
  return allItems.filter(
    (item) =>
      (item.inHeader ?? true) &&
      (!item.devOnly || isDev) &&
      (!item.requiresAuth || isAuthenticated) &&
      (!item.hideWhenAuth || !isAuthenticated)
  );
}

export function getSidebarNav(
  isAuthenticated: boolean,
  isDev: boolean
): NavItem[] {
  // Show all pages in navigation; access is still protected by AuthGuard
  return allItems.filter(
    (item) =>
      (item.inSidebar ?? true) &&
      (!item.devOnly || isDev) &&
      (!item.requiresAuth || isAuthenticated) &&
      (!item.hideWhenAuth || !isAuthenticated)
  );
}
