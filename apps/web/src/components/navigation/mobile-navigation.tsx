'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  MessageSquare,
  Bot,
  Wallet,
  Settings,
  Plus,
  Search,
  User,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  href: string;
  badge?: string | number;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

interface MobileNavigationProps {
  variant?: 'bottom' | 'floating' | 'drawer';
  className?: string;
  onNewChat?: () => void;
  unreadCount?: number;
}

const defaultNavItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home, href: '/' },
  { id: 'chat', label: 'Chat', icon: MessageSquare, href: '/chat' },
  { id: 'agents', label: 'Agents', icon: Bot, href: '/agents' },
  { id: 'wallet', label: 'Wallet', icon: Wallet, href: '/wallet' },
  { id: 'profile', label: 'Profile', icon: User, href: '/profile' },
];

export function MobileNavigation({
  variant = 'bottom',
  className,
  onNewChat,
  unreadCount = 0
}: MobileNavigationProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const navItems = defaultNavItems.map(item => ({
    ...item,
    badge: item.id === 'chat' && unreadCount > 0 ? unreadCount : item.badge,
  }));

  const handleNavigation = (href: string) => {
    router.push(href);
    setIsDrawerOpen(false);
  };

  if (variant === 'floating') {
    return (
      <div className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
        'bg-background/95 backdrop-blur-lg border rounded-full shadow-lg',
        'px-2 py-2',
        className
      )}>
        <div className="flex items-center gap-1">
          {navItems.slice(0, 4).map((item) => {
            const isActive = pathname === item.href;
            const ItemIcon = item.icon;
            return (
              <motion.div
                key={item.id}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  size="icon"
                  className={cn(
                    'relative h-10 w-10 rounded-full',
                    isActive && 'shadow-sm'
                  )}
                  onClick={() => handleNavigation(item.href)}
                >
                  <ItemIcon className="h-5 w-5" />
                  {item.badge && (
                    <Badge
                      variant={item.badgeVariant || 'destructive'}
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              </motion.div>
            );
          })}
          
          <div className="w-px h-6 bg-border mx-1" />
          
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={() => setIsDrawerOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (variant === 'drawer') {
    return (
      <>
        {/* Menu Button */}
        <Button
          variant="outline"
          size="icon"
          className={cn(
            'fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg',
            className
          )}
          onClick={() => setIsDrawerOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </Button>

        {/* Drawer */}
        <AnimatePresence>
          {isDrawerOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
                onClick={() => setIsDrawerOpen(false)}
              />

              {/* Drawer Content */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 20 }}
                className="fixed right-0 top-0 h-full w-80 bg-background border-l shadow-xl z-50"
              >
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">Menu</h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsDrawerOpen(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Navigation Items */}
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-2">
                      {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const ItemIcon = item.icon;
                        return (
                          <Button
                            key={item.id}
                            variant={isActive ? 'secondary' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => handleNavigation(item.href)}
                          >
                            <ItemIcon className="h-5 w-5 mr-3" />
                            {item.label}
                            {item.badge && (
                              <Badge
                                variant={item.badgeVariant || 'secondary'}
                                className="ml-auto"
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </Button>
                        );
                      })}
                    </div>

                    <div className="mt-6 pt-6 border-t">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleNavigation('/settings')}
                      >
                        <Settings className="h-5 w-5 mr-3" />
                        Settings
                      </Button>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  {onNewChat && (
                    <div className="p-4 border-t">
                      <Button
                        className="w-full"
                        onClick={() => {
                          onNewChat();
                          setIsDrawerOpen(false);
                        }}
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        New Chat
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Bottom variant (default)
  return (
    <div className={cn(
      'fixed bottom-0 left-0 right-0 z-50',
      'bg-background/95 backdrop-blur-lg border-t',
      'px-4 py-2 safe-bottom',
      className
    )}>
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const ItemIcon = item.icon;
          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.95 }}
              className={cn(
                'relative flex flex-col items-center gap-1 p-2 rounded-lg transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
                'hover:bg-muted/50'
              )}
              onClick={() => handleNavigation(item.href)}
            >
              <div className="relative">
                <ItemIcon className={cn(
                  'h-5 w-5 transition-colors',
                  isActive && 'text-primary'
                )} />
                {item.badge && (
                  <Badge
                    variant={item.badgeVariant || 'destructive'}
                    className="absolute -top-2 -right-2 h-4 min-w-[16px] p-0 flex items-center justify-center text-[10px]"
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
              <span className={cn(
                'text-[10px] font-medium',
                isActive && 'text-primary'
              )}>
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Quick Action Button */}
      {onNewChat && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-16 right-4"
        >
          <Button
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg"
            onClick={onNewChat}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}

// Re-export the hook from the dedicated hooks file
export { useHideOnScroll } from '@/hooks/use-hide-on-scroll';

export default MobileNavigation;