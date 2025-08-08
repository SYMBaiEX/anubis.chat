'use client';

import {
  ChevronLeft,
  ChevronRight,
  Menu,
  Moon,
  Settings,
  Shield,
  Sparkles,
  Sun,
  Wallet,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Logo, LogoIcon } from '@/components/ui/logo';
import type { NavItem } from '@/constants/navigation';
import { getSidebarNav } from '@/constants/navigation';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

const bottomItems: Array<{
  label: string;
  href: string;
  requiresAuth?: boolean;
  icon: ReactElement;
}> = [
  {
    label: 'Settings',
    href: '/settings',
    requiresAuth: true,
    icon: <Settings className="h-5 w-5 flex-shrink-0" />,
  },
  {
    label: 'Security',
    href: '/security',
    requiresAuth: true,
    icon: <Shield className="h-5 w-5 flex-shrink-0" />,
  },
  {
    label: 'Wallet',
    href: '/wallet',
    requiresAuth: true,
    icon: <Wallet className="h-5 w-5 flex-shrink-0" />,
  },
];

export default function Sidebar() {
  const { isCollapsed, toggleCollapsed } = useSidebar();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { isAuthenticated } = useAuthContext();

  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const isDev = process.env.NODE_ENV === 'development';
  const filteredItems = getSidebarNav(isAuthenticated, isDev);

  const filteredBottomItems = bottomItems.filter(
    (item) => !item.requiresAuth || isAuthenticated
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        aria-label="Toggle menu"
        className="button-press fixed top-4 left-4 z-50 rounded-lg border border-border bg-card p-2 lg:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-full overflow-hidden border-sidebar-border border-r bg-sidebar-background transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col">
          <div
            aria-hidden="true"
            className="aurora aurora-gold absolute inset-0"
          />
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-sidebar-border border-b px-4">
            {isCollapsed ? (
              <LogoIcon size="md" className="mx-auto" />
            ) : (
              <Logo size="md" textVariant="gradient" text="ISIS.chat" />
            )}

            {/* Collapse Button - Desktop Only */}
            <button
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden rounded p-1 transition-colors hover:bg-sidebar-accent lg:block"
              onClick={toggleCollapsed}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-2">
              {filteredItems.map((item: NavItem) => {
                const isActive = pathname === item.href;

                return (
                  <li key={item.href}>
                    <Link
                      className={cn(
                        'button-press flex items-center gap-3 rounded-lg px-3 py-2 transition-all',
                        isActive
                          ? 'glow-primary bg-sidebar-primary text-sidebar-primary-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        isCollapsed && 'justify-center'
                      )}
                      href={item.href}
                    >
                      {item.icon && (
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                      )}
                      {!isCollapsed && (
                        <>
                          <span className="flex-1">{item.label}</span>
                          {item.devOnly && (
                            <span className="rounded-full bg-isis-accent px-2 py-0.5 text-white text-xs">
                              DEV
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Bottom Section */}
          <div className="space-y-2 border-sidebar-border border-t p-4">
            {/* Theme Toggle */}
            <button
              aria-label="Toggle theme"
              className={cn(
                'button-press flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent',
                isCollapsed && 'justify-center'
              )}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {mounted ? (
                theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )
              ) : (
                <div className="h-5 w-5" /> // Placeholder during SSR
              )}
              {!isCollapsed && mounted && (
                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              )}
            </button>

            {/* Bottom Navigation Items */}
            {filteredBottomItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  className={cn(
                    'button-press flex items-center gap-3 rounded-lg px-3 py-2 transition-all',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    isCollapsed && 'justify-center'
                  )}
                  href={item.href}
                  key={item.href}
                >
                  {item.icon}
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}

            {/* User Section */}
            {isAuthenticated && !isCollapsed && (
              <div className="border-sidebar-border border-t pt-2">
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-isis-primary to-isis-accent" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm">User</p>
                    <p className="truncate text-muted-foreground text-xs">
                      Connected
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Offset */}
      <div
        className={cn(
          'lg:transition-all lg:duration-300',
          isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        )}
      />
    </>
  );
}
