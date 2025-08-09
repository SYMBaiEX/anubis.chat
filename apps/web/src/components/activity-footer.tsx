'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ModeToggle } from '@/components/mode-toggle';
import { cn } from '@/lib/utils';
import { useAuthContext } from '@/components/providers/auth-provider';
import { useSubscriptionLimits, useSubscriptionStatus } from '@/components/providers/auth-provider';
import {
  Activity,
  BarChart2,
  Cable,
  CheckCircle2,
  Layers,
  MessageSquarePlus,
  Settings,
  ShieldCheck,
  Sparkles,
  User2,
} from 'lucide-react';

/**
 * ActivityFooter — persistent, themed footer attached to the viewport bottom.
 * Visible only when authenticated (rendered within authenticated layouts).
 */
export default function ActivityFooter() {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthContext();
  const subscription = useSubscriptionStatus();
  const limits = useSubscriptionLimits();

  // Online status (navigator-based, simple and robust)
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // NOTE: Avoid showing wallet/public identifiers in footer to reduce exposure
  const hasUser = Boolean(user && (user.walletAddress || user.id));

  if (!isAuthenticated) return null;

  return (
    <footer
      role="contentinfo"
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/70',
      )}
    >
      <TooltipProvider>
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 px-3 py-2 text-sm md:px-4">
          {/* Left cluster: connection + account (no PII) */}
          <LeftCluster isOnline={isOnline} hasUser={hasUser} tier={subscription?.tier} />

          {/* Middle cluster: platform stats */}
          <StatsSection limits={{
            messagesRemaining: limits?.messagesRemaining,
            premiumMessagesRemaining: limits?.premiumMessagesRemaining,
            daysUntilReset: limits?.daysUntilReset,
          }} />

          {/* Right cluster: quick actions */}
          <ActionsSection
            pathname={pathname}
          />
        </div>
      </TooltipProvider>
    </footer>
  );
}

export function StatItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <div className="flex items-center gap-1">
        {icon}
        <span aria-label={label}>{label}</span>
      </div>
      <span className="font-medium text-foreground" aria-live="polite">
        {value}
      </span>
    </div>
  );
}

export function NavIcon({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          asChild
          variant={active ? 'secondary' : 'ghost'}
          size="sm"
          className={cn('h-8 w-8 p-0')}
          type="button"
          aria-label={label}
        >
          <Link href={href}>{icon}</Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

export function LeftCluster({
  isOnline,
  hasUser,
  tier,
}: {
  isOnline: boolean;
  hasUser: boolean;
  tier?: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        aria-live="polite"
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs',
          isOnline ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'
        )}
      >
        <span aria-hidden="true" className={cn('h-2 w-2 rounded-full', isOnline ? 'bg-emerald-500' : 'bg-red-500')} />
        {isOnline ? 'Online' : 'Offline'}
      </span>

      <Separator className="hidden h-4 md:block" orientation="vertical" />

      {hasUser ? (
        <div className="hidden items-center gap-2 md:flex">
          <Button asChild size="sm" variant="ghost" aria-label="Account">
            <Link href="/app/account" className="inline-flex items-center gap-2">
              <User2 className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Account</span>
            </Link>
          </Button>
          {tier ? (
            <Badge variant="outline" className="ml-1">
              {tier.replace('_', ' ').toUpperCase()}
            </Badge>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function StatsSection({
  limits,
}: {
  limits: {
    messagesRemaining?: number | undefined;
    premiumMessagesRemaining?: number | undefined;
    daysUntilReset?: number | undefined;
  };
}) {
  return (
    <div className="hidden items-center gap-4 md:flex">
      <StatItem
        icon={<Sparkles className="h-3.5 w-3.5" aria-hidden="true" />}
        label="Messages"
        value={typeof limits.messagesRemaining === 'number' ? `${limits.messagesRemaining}` : 'N/A'}
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <StatItem
              label="Premium Messages"
              value={typeof limits.premiumMessagesRemaining === 'number' ? `${limits.premiumMessagesRemaining}` : 'N/A'}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">Remaining messages on premium models this billing period</TooltipContent>
      </Tooltip>
      <StatItem
        icon={<ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />}
        label="Days Until Reset"
        value={typeof limits.daysUntilReset === 'number' ? `${limits.daysUntilReset}d` : 'N/A'}
      />
    </div>
  );
}

export function ActionsSection({ pathname }: { pathname: string | null }) {
  return (
    <div className="flex items-center gap-1 md:gap-2">
      <NavIcon href="/app/dashboard" icon={<Activity className="h-4 w-4" />} label="Dashboard" active={pathname?.startsWith('/app/dashboard')} />
      <NavIcon href="/app/chat" icon={<MessageSquarePlus className="h-4 w-4" />} label="Chat" active={pathname?.startsWith('/app/chat')} />
      <NavIcon href="/app/agents" icon={<Layers className="h-4 w-4" />} label="Agents" active={pathname?.startsWith('/app/agents')} />
      <NavIcon href="/app/workflows" icon={<BarChart2 className="h-4 w-4" />} label="Workflows" active={pathname?.startsWith('/app/workflows')} />
      <NavIcon href="/app/subscription" icon={<CheckCircle2 className="h-4 w-4" />} label="Subscription" active={pathname?.startsWith('/app/subscription')} />
      <NavIcon href="/app/settings" icon={<Settings className="h-4 w-4" />} label="Settings" active={pathname?.startsWith('/app/settings')} />

      <Separator className="mx-1 hidden h-4 md:block" orientation="vertical" />
      <div className="flex items-center">
        <ModeToggle />
      </div>
    </div>
  );
}


