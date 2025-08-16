'use client';

import { api } from '@convex/_generated/api';
import { useMutation, useQuery } from 'convex/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  Menu,
  Settings,
  User,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { UpgradeModal } from '@/components/auth/upgrade-modal';
import { ChatSidebar } from '@/components/layout/sidebar/chat-sidebar';
import {
  useAuthContext,
  useSubscriptionLimits,
  useSubscriptionStatus,
} from '@/components/providers/auth-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { Progress } from '@/components/ui/progress';
import { ThemeImage } from '@/components/ui/themeImage';
import { WalletConnectButton } from '@/components/wallet/wallet-connect-button';
import type { NavItem } from '@/constants/navigation';
import { getSidebarNav } from '@/constants/navigation';
import { useSidebar } from '@/contexts/SidebarContext';
import { useUpgradeModal } from '@/hooks/use-upgrade-modal';
import { formatTierLabel } from '@/lib/format-tier-label';
import { cn } from '@/lib/utils';
import {
  overlayVariants,
  sidebarMobileVariants,
  sidebarVariants,
} from '@/lib/animations/variants';

const bottomItems: Array<{
  label: string;
  href: string;
  requiresAuth?: boolean;
  icon: ReactElement;
}> = [
    {
      label: 'Account',
      href: '/account',
      requiresAuth: true,
      icon: <User className="h-4 w-4 flex-shrink-0" />,
    },
    {
      label: 'Subscription',
      href: '/subscription',
      requiresAuth: true,
      icon: <Crown className="h-4 w-4 flex-shrink-0" />,
    },
    {
      label: 'Settings',
      href: '/settings',
      requiresAuth: true,
      icon: <Settings className="h-4 w-4 flex-shrink-0" />,
    },
    {
      label: 'Wallet',
      href: '/wallet',
      requiresAuth: true,
      icon: <Wallet className="h-4 w-4 flex-shrink-0" />,
    },
  ];

export default function Sidebar() {
  const { isCollapsed, toggleCollapsed } = useSidebar();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [_mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, user } = useAuthContext();
  const subscription = useSubscriptionStatus();
  const limits = useSubscriptionLimits();
  const { isOpen, openModal, closeModal, suggestedTier } = useUpgradeModal();
  const _updateUserPreferences = useMutation(
    api.userPreferences.updateUserPreferences
  );
  const usagePercent =
    subscription && subscription.messagesLimit > 0
      ? (subscription.messagesUsed / subscription.messagesLimit) * 100
      : 0;

  // Check admin status using wallet address (the working method)
  const adminStatus = useQuery(
    api.adminAuth.checkAdminStatusByWallet,
    user?.walletAddress ? { walletAddress: user.walletAddress } : 'skip'
  );

  // Set mounted state and handle desktop detection
  useEffect(() => {
    setMounted(true);

    // Check if we're on desktop
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024); // lg breakpoint
    };

    checkDesktop();
    window.addEventListener('resize', checkDesktop);

    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, []);

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
  const isAdmin = adminStatus?.isAdmin;
  const filteredItems = getSidebarNav(isAuthenticated, isDev, isAdmin);

  const filteredBottomItems = bottomItems.filter(
    (item) => !item.requiresAuth || isAuthenticated
  );

  // Use shared formatter from lib

  return (
    <>
      {/* Mobile Menu Button (moved to right) */}
      <motion.button
        aria-label="Toggle menu"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className={cn(
          'button-press fixed top-3 right-3 z-50 rounded-md border backdrop-blur lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation transition-colors duration-200 p-2',
          isMobileOpen
            ? 'bg-red-500/10 border-red-500/20 text-red-600 shadow-lg'
            : 'bg-card border-border shadow-sm'
        )}
      >
        <AnimatePresence mode="wait">
          {isMobileOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="h-4 w-4" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Menu className="h-4 w-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-md lg:hidden"
            onClick={() => setIsMobileOpen(false)}
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{
              opacity: 1,
              backdropFilter: 'blur(8px)',
              transition: { duration: 0.3, ease: 'easeOut' }
            }}
            exit={{
              opacity: 0,
              backdropFilter: 'blur(0px)',
              transition: { duration: 0.2, ease: 'easeIn' }
            }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={cn(
          'fixed top-0 left-0 z-40 h-[calc(100vh-2.5rem)] overflow-hidden border-border border-r bg-card backdrop-blur supports-[backdrop-filter]:bg-card/95 touch-manipulation',
          // Mobile: CSS transition, Desktop: Framer Motion handles it
          'transition-transform duration-300 ease-out lg:transition-none',
          // Mobile visibility
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: always visible
          'lg:translate-x-0'
        )}
        variants={sidebarVariants}
        animate={isCollapsed ? 'collapsed' : 'expanded'}
        initial={false}
      >
        <div className="flex h-full flex-col">
          <div
            aria-hidden="true"
            className="aurora aurora-primary absolute inset-0"
          />
          {/* Logo with subtle glowing mark */}
          <div className="flex h-12 items-center justify-between border-border/80 border-b bg-card/90 px-3">
            {isCollapsed ? (
              <div className="relative mx-auto inline-flex items-center justify-center">
                <span
                  aria-hidden
                  className="-inset-1 pointer-events-none absolute rounded-full blur-sm"
                  style={{
                    background:
                      'radial-gradient(closest-side, rgba(16,185,129,0.10), transparent 70%)',
                  }}
                />
                <motion.span
                  animate={{ scale: [1, 1.02, 1], opacity: [0.16, 0.22, 0.16] }}
                  aria-hidden
                  className="-inset-0.5 pointer-events-none absolute rounded-full"
                  style={{
                    background:
                      'radial-gradient(closest-side, rgba(16,185,129,0.08), transparent 60%)',
                  }}
                  transition={{
                    duration: 6,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'easeInOut',
                  }}
                />
                <ThemeImage
                  alt="Anubis mark"
                  className="relative drop-shadow-[0_0_4px_rgba(16,185,129,0.06)]"
                  darkSrc="/assets/logoNoText.png"
                  height={28}
                  lightSrc="/assets/logoNoText.png"
                  width={28}
                />
              </div>
            ) : (
              <Link
                aria-label="Dashboard"
                className="inline-flex items-center gap-2"
                href="/dashboard"
                onClick={() => setIsMobileOpen(false)}
              >
                <span className="relative inline-flex items-center justify-center">
                  <span
                    aria-hidden
                    className="-inset-1 pointer-events-none absolute rounded-full blur-sm"
                    style={{
                      background:
                        'radial-gradient(closest-side, rgba(16,185,129,0.10), transparent 70%)',
                    }}
                  />
                  <motion.span
                    animate={{
                      scale: [1, 1.02, 1],
                      opacity: [0.16, 0.22, 0.16],
                    }}
                    aria-hidden
                    className="-inset-0.5 pointer-events-none absolute rounded-full"
                    style={{
                      background:
                        'radial-gradient(closest-side, rgba(16,185,129,0.08), transparent 60%)',
                    }}
                    transition={{
                      duration: 6,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: 'easeInOut',
                    }}
                  />
                  <ThemeImage
                    alt="Anubis mark"
                    className="relative drop-shadow-[0_0_4px_rgba(16,185,129,0.06)]"
                    darkSrc="/assets/logoNoText.png"
                    height={42}
                    lightSrc="/assets/logoNoText.png"
                    width={42}
                  />
                </span>
                <Logo
                  animation="shimmer"
                  asLink={false}
                  href="/dashboard"
                  size="lg"
                  text="anubis.chat"
                  textVariant="gradient"
                />
              </Link>
            )}

            {/* Collapse Button - Desktop Only */}
            <button
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden rounded p-0.5 transition-colors hover:bg-sidebar-accent lg:block"
              onClick={toggleCollapsed}
              type="button"
            >
              {isCollapsed ? (
                <ChevronRight className="h-3 w-3" />
              ) : (
                <ChevronLeft className="h-3 w-3" />
              )}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto py-2">
            {/* Global Chat History between wallet and routes - only show when expanded */}
            {!isCollapsed && (
              <div className="px-2 pb-8">
                <div className="rounded-md border border-sidebar-border/60 bg-card/40 backdrop-blur">
                  <ChatSidebar />
                </div>
              </div>
            )}
            <ul className="space-y-1 px-2">
              {filteredItems.map((item: NavItem, index: number) => {
                const isActive = pathname === item.href;

                return (
                  <motion.li
                    key={item.href}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 25
                    }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    >
                      <Link
                        className={cn(
                          'button-press flex items-center gap-3 rounded-md px-3 py-3 sm:py-2.5 text-sm ring-1 ring-transparent transition-all',
                          'min-h-[44px] sm:min-h-auto touch-manipulation', // Better mobile touch targets
                          isActive
                            ? 'glow-primary bg-sidebar-primary text-sidebar-primary-foreground ring-primary/30'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:ring-sidebar-ring/20',
                          isCollapsed && 'justify-center'
                        )}
                        href={item.href}
                        onClick={() => setIsMobileOpen(false)}
                      >
                        {item.icon && (
                          <item.icon
                            className={cn(
                              'h-5 w-5 flex-shrink-0 transition-colors',
                              isActive
                                ? 'text-sidebar-primary-foreground'
                                : 'text-sidebar-primary'
                            )}
                          />
                        )}
                        {!isCollapsed && (
                          <>
                            <span className="flex-1 text-sm">{item.label}</span>
                            {item.devOnly && (
                              <span className="rounded-full bg-anubis-accent px-1.5 py-0 text-[9px] text-primary-foreground">
                                DEV
                              </span>
                            )}
                          </>
                        )}
                      </Link>
                    </motion.div>
                  </motion.li>
                );
              })}
            </ul>
          </nav>

          {/* Bottom Section */}
          <div className="space-y-1 border-sidebar-border/80 border-t bg-sidebar-background/60 p-2">
            {/* Wallet Connection */}
            <div className={cn('mb-2', isCollapsed && 'flex justify-center')}>
              <WalletConnectButton collapsed={isCollapsed} />
            </div>

            {/* Upgrade Button - Show for Free and Pro users */}
            {isAuthenticated &&
              subscription &&
              subscription.tier !== 'pro_plus' &&
              subscription.tier !== 'admin' && (
                <Button
                  className={cn('w-full gap-1 text-xs', isCollapsed && 'px-1')}
                  onClick={() =>
                    openModal({
                      tier: subscription.tier === 'pro' ? 'pro_plus' : 'pro',
                      trigger: 'manual',
                    })
                  }
                  size="sm"
                  variant="default"
                >
                  <Zap className="h-4 w-4" />
                  {!isCollapsed && 'Upgrade Account'}
                </Button>
              )}

            {/* Bottom Navigation Items */}
            {filteredBottomItems.map((item, index) => {
              const isActive = pathname === item.href;

              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 25
                  }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    className={cn(
                      'button-press flex items-center gap-2 rounded-md px-2 py-2 sm:py-1.5 text-xs ring-1 ring-transparent transition-all',
                      'min-h-[36px] sm:min-h-auto touch-manipulation', // Better mobile touch targets
                      isActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground ring-primary/30'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:ring-sidebar-ring/20',
                      isCollapsed && 'justify-center'
                    )}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    {item.icon}
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                </motion.div>
              );
            })}

            {/* User Section with Subscription Info */}
            {isAuthenticated && (
              <motion.div
                className="border-sidebar-border border-t pt-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 25 }}
              >
                {!isCollapsed && subscription && (
                  <div className="px-2 py-1">
                    {/* Subscription status */}
                    <div className="mb-1 flex items-center justify-between">
                      <Badge
                        className="h-5 gap-0.5 px-1.5 py-0 text-[10px]"
                        variant={
                          subscription.tier === 'free' ? 'secondary' : 'default'
                        }
                      >
                        <Crown className="h-3 w-3" />
                        {formatTierLabel(subscription.tier)}
                      </Badge>
                      {subscription.tier !== 'free' && (
                        <span className="text-[10px] text-muted-foreground">
                          {limits?.daysUntilReset ?? 0}d left
                        </span>
                      )}
                    </div>

                    {/* Usage indicator */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">
                          Messages
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {subscription.messagesUsed}/
                          {subscription.messagesLimit}
                        </span>
                      </div>
                      <Progress className="h-0.5" value={usagePercent} />
                    </div>

                    {/* User info */}
                    <div className="mt-2 flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage alt="Profile" src={user?.avatar} />
                        <AvatarFallback>
                          {(user?.displayName?.[0] || 'U').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-[11px]">
                          {user?.displayName || 'User'}
                        </p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          Connected
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Collapsed view - just show subscription tier */}
                {isCollapsed && subscription && (
                  <div className="flex justify-center px-1 py-1">
                    <div className="flex flex-col items-center gap-0.5">
                      <Crown
                        className={`h-3 w-3 ${subscription.tier === 'free'
                          ? 'text-muted-foreground'
                          : subscription.tier === 'pro'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-purple-600 dark:text-purple-400'
                          }`}
                      />
                      {(() => {
                        const barClass =
                          usagePercent >= 90
                            ? 'bg-red-500'
                            : usagePercent >= 75
                              ? 'bg-yellow-500'
                              : 'bg-green-500';
                        return (
                          <div
                            className={`h-0.5 w-3 rounded-full ${barClass}`}
                          />
                        );
                      })()}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content Offset - Only for desktop */}
      <motion.div
        className="hidden lg:block"
        animate={{
          marginLeft: isCollapsed ? 56 : 224,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
      />

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={isOpen}
        onClose={closeModal}
        suggestedTier={suggestedTier}
        trigger="manual"
      />
    </>
  );
}
