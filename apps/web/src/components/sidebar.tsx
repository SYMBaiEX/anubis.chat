'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/contexts/SidebarContext';
import { ChevronLeft, ChevronRight, Menu, X, Sparkles, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuthContext } from '@/components/providers/auth-provider';
import { getSidebarNav } from '@/constants/navigation';
import type { NavItem } from '@/constants/navigation';

import { Settings, Shield, Wallet } from 'lucide-react';

import type { ReactElement } from 'react';
const bottomItems: Array<{ label: string; href: string; requiresAuth?: boolean; icon: ReactElement }>= [
  { label: 'Settings', href: '/settings', requiresAuth: true, icon: <Settings className="h-5 w-5 flex-shrink-0" /> },
  { label: 'Security', href: '/security', requiresAuth: true, icon: <Shield className="h-5 w-5 flex-shrink-0" /> },
  { label: 'Wallet', href: '/wallet', requiresAuth: true, icon: <Wallet className="h-5 w-5 flex-shrink-0" /> },
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
    item => !item.requiresAuth || isAuthenticated
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border lg:hidden button-press"
        aria-label="Toggle menu"
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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full bg-sidebar-background border-r border-sidebar-border transition-all duration-300 z-40 overflow-hidden',
          isCollapsed ? 'w-16' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="absolute inset-0 aurora aurora-gold" aria-hidden="true" />
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
            <Link
              href="/"
              className={cn(
                'flex items-center gap-2 font-bold text-xl',
                isCollapsed && 'justify-center'
              )}
            >
              <div className="relative">
                <Sparkles className="h-8 w-8 text-isis-primary" />
                <div className="absolute inset-0 h-8 w-8 text-isis-primary blur-lg opacity-50" />
              </div>
              {!isCollapsed && (
                <span className="text-gradient">ISIS</span>
              )}
            </Link>
            
            {/* Collapse Button - Desktop Only */}
            <button
              onClick={toggleCollapsed}
              className="hidden lg:block p-1 rounded hover:bg-sidebar-accent transition-colors"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 transition-all button-press',
                        isActive
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground glow-primary'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        isCollapsed && 'justify-center'
                      )}
                    >
                      {item.icon && <item.icon className="h-5 w-5 flex-shrink-0" />}
                      {!isCollapsed && (
                        <>
                          <span className="flex-1">{item.label}</span>
                          {item.devOnly && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-isis-accent text-white">
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
          <div className="border-t border-sidebar-border p-4 space-y-2">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={cn(
                'w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground hover:bg-sidebar-accent transition-all button-press',
                isCollapsed && 'justify-center'
              )}
              aria-label="Toggle theme"
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
                <span>
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </span>
              )}
            </button>

            {/* Bottom Navigation Items */}
            {filteredBottomItems.map((item) => {
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 transition-all button-press',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    isCollapsed && 'justify-center'
                  )}
                >
                  {item.icon}
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}

            {/* User Section */}
            {isAuthenticated && !isCollapsed && (
              <div className="pt-2 border-t border-sidebar-border">
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-isis-primary to-isis-accent" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">User</p>
                    <p className="text-xs text-muted-foreground truncate">
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