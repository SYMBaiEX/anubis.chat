'use client';

import { api } from '@convex/_generated/api';
import { useQuery } from 'convex/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  Bot,
  Calendar,
  ChartBar,
  Coins,
  Crown,
  MessageSquare,
  Rocket,
  Shield,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  useAuthContext,
  useSubscriptionStatus,
} from '@/components/providers/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EditableUsername } from '@/components/ui/editable-username';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { SubscriptionStatus } from '@/hooks/use-subscription';
import { cn } from '@/lib/utils';

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 12,
    },
  },
};

// Stat Card Component - Compact with animations
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
  progress,
  trend,
  delay = 0,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  progress?: number;
  trend?: 'up' | 'down' | 'neutral';
  delay?: number;
}) {
  return (
    <motion.div
      animate="visible"
      custom={delay}
      initial="hidden"
      variants={itemVariants}
    >
      <Card className="group relative overflow-hidden border-primary/10 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-md">
        <motion.div
          className={cn(
            'absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100',
            'bg-gradient-to-br',
            gradient
          )}
          initial={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          whileHover={{ opacity: 0.03 }}
        />

        <CardContent className="relative p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="flex items-center gap-1 font-medium text-muted-foreground text-xs">
                {title}
                {trend && (
                  <motion.span
                    animate={{ scale: 1 }}
                    initial={{ scale: 0 }}
                    transition={{ delay: delay + 0.3 }}
                  >
                    {trend === 'up' && (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    )}
                    {trend === 'down' && (
                      <TrendingUp className="h-3 w-3 rotate-180 text-red-500" />
                    )}
                  </motion.span>
                )}
              </p>
              <p className="mt-1 font-bold text-xl">{value}</p>
              {subtitle && (
                <p className="mt-0.5 text-muted-foreground text-xs">
                  {subtitle}
                </p>
              )}
            </div>
            <motion.div
              className={cn(
                'rounded-lg p-2',
                'bg-gradient-to-br',
                gradient,
                'opacity-10'
              )}
              whileHover={{ scale: 1.1 }}
            >
              <Icon className="h-4 w-4 text-foreground" />
            </motion.div>
          </div>
          {progress !== undefined && (
            <motion.div
              animate={{ scaleX: 1 }}
              className="mt-2"
              initial={{ scaleX: 0 }}
              transition={{ delay: delay + 0.5, duration: 0.6 }}
            >
              <Progress className="h-1" value={progress} />
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Activity Feed Item
function ActivityItem({
  icon: Icon,
  title,
  description,
  time,
  type,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  time: string;
  type: 'success' | 'warning' | 'info' | 'error';
}) {
  const typeStyles = {
    success: 'bg-green-500/10 text-green-500 border-green-500/20',
    warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    error: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  return (
    <motion.div
      animate={{ opacity: 1, x: 0 }}
      className="flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-all hover:bg-accent/5"
      initial={{ opacity: 0, x: -20 }}
      whileHover={{ x: 4 }}
    >
      <div className={cn('rounded-lg border p-2', typeStyles[type])}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-sm">{title}</p>
        <p className="truncate text-muted-foreground text-xs">{description}</p>
      </div>
      <span className="whitespace-nowrap text-muted-foreground text-xs">
        {time}
      </span>
    </motion.div>
  );
}

// Quick Action Button
function QuickAction({
  icon: Icon,
  label,
  href,
  gradient,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  gradient: string;
  onClick?: () => void;
}) {
  const content = (
    <motion.div
      className={cn(
        'relative overflow-hidden rounded-xl p-4',
        'bg-gradient-to-br',
        gradient,
        'group cursor-pointer'
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <Icon className="mb-2 h-6 w-6 text-white" />
      <p className="font-medium text-sm text-white">{label}</p>
    </motion.div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return <div onClick={onClick}>{content}</div>;
}

export default function EnhancedDashboardPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const subscription = useSubscriptionStatus();
  const [selectedPeriod, setSelectedPeriod] = useState<
    'day' | 'week' | 'month'
  >('week');
  const [isLoading, setIsLoading] = useState(true);

  // Queries
  const creditsSummary = useQuery(
    api.subscriptions.getMessageCreditsSummary,
    {}
  );
  const purchases = useQuery(
    api.subscriptions.getMessageCreditPurchases,
    user ? { limit: 10 } : 'skip'
  );
  const referralStats = useQuery(api.referrals.getUserReferralStats);

  // Get recent chats and messages for activity feed
  const recentChats = useQuery(api.chats.list, { limit: 5 });
  const recentMessages = useQuery(
    api.messages.getRecentActivity,
    user ? { limit: 10 } : 'skip'
  );

  // Simulate loading for smooth entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);

  // Calculate stats
  const totalMessages =
    (subscription?.messagesUsed || 0) +
    (subscription?.premiumMessagesUsed || 0);
  const totalLimit =
    (subscription?.messagesLimit || 0) +
    (subscription?.premiumMessagesLimit || 0);
  const usagePercentage =
    totalLimit > 0 ? (totalMessages / totalLimit) * 100 : 0;

  // Format time ago
  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  // Build real-time activity feed
  const recentActivity = useMemo(() => {
    const activities: Array<{
      icon: React.ComponentType<{ className?: string }>;
      title: string;
      description: string;
      time: string;
      timestamp: number;
      type: 'success' | 'warning' | 'info' | 'error';
    }> = [];

    // Add recent chats
    if (recentChats) {
      recentChats.forEach((chat) => {
        activities.push({
          icon: MessageSquare,
          title: 'Chat Session',
          description: chat.title || 'New conversation started',
          time: formatTimeAgo(chat._creationTime),
          timestamp: chat._creationTime,
          type: 'info' as const,
        });
      });
    }

    // Add recent purchases
    if (purchases && purchases.length > 0) {
      purchases.slice(0, 3).forEach((purchase) => {
        activities.push({
          icon: Coins,
          title: 'Credits Purchased',
          description: `${purchase.premiumCredits} premium credits added`,
          time: formatTimeAgo(purchase.createdAt),
          timestamp: purchase.createdAt,
          type: 'success' as const,
        });
      });
    }

    // Add referral activity (using recentPayouts)
    if (
      referralStats?.recentPayouts &&
      referralStats.recentPayouts.length > 0
    ) {
      referralStats.recentPayouts.slice(0, 2).forEach((payout) => {
        activities.push({
          icon: Users,
          title: 'Referral Commission',
          description: `Earned ${payout.amount} SOL (${(payout.rate * 100).toFixed(1)}% rate)`,
          time: formatTimeAgo(payout.date),
          timestamp: payout.date,
          type: 'success' as const,
        });
      });
    }

    // Add model usage
    if (recentMessages && recentMessages.length > 0) {
      const modelUsage: Record<string, number> = {};
      recentMessages.forEach((msg) => {
        const model = msg.metadata?.model;
        if (model && !modelUsage[model]) {
          modelUsage[model] = msg._creationTime;
        }
      });

      Object.entries(modelUsage)
        .slice(0, 2)
        .forEach(([model, timestamp]) => {
          activities.push({
            icon: Bot,
            title: 'AI Model Used',
            description: `${model} model accessed`,
            time: formatTimeAgo(timestamp),
            timestamp,
            type: 'info' as const,
          });
        });
    }

    // Sort by timestamp and return top 5
    return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
  }, [recentChats, purchases, referralStats, recentMessages]);

  const formatTier = (tier?: string): string => {
    const tierMap: Record<string, string> = {
      pro_plus: 'Pro+',
      pro: 'Pro',
      free: 'Free',
      admin: 'Admin',
    };
    return tierMap[tier || 'free'] || 'Free';
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-b from-background via-background/95 to-primary/5"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        key="dashboard"
      >
        {/* Compact Hero Header */}
        <div className="relative overflow-hidden">
          <motion.div
            animate={{ opacity: 1 }}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
          >
            <div className="aurora-primary opacity-20" />
          </motion.div>

          <div className="relative px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center"
                initial={{ opacity: 0, y: -10 }}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="animate-gradient-x bg-gradient-to-r from-primary via-accent to-primary bg-clip-text font-bold text-3xl text-transparent sm:text-4xl">
                      Welcome back{user?.displayName ? ',' : ''}
                    </h1>
                    {user && (
                      <EditableUsername
                        className="font-bold text-3xl sm:text-4xl"
                        currentUsername={user.displayName}
                        placeholder="Set Username"
                      />
                    )}
                  </div>
                  <p className="mt-1 text-muted-foreground text-sm">
                    Your AI kingdom awaits
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="px-2 py-0.5 text-xs" variant="outline">
                    <Crown className="mr-1 h-3 w-3" />
                    {formatTier(subscription?.tier)}
                  </Badge>
                  {subscription?.tier === 'free' && (
                    <Button
                      className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                      onClick={() => router.push('/subscription')}
                      size="sm"
                    >
                      <Rocket className="mr-1 h-3 w-3" />
                      Upgrade
                    </Button>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <motion.div
            animate="visible"
            className="space-y-4"
            initial="hidden"
            variants={containerVariants}
          >
            {/* Stats Grid */}
            <motion.div
              animate="visible"
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
              initial="hidden"
              variants={containerVariants}
            >
              <StatCard
                delay={0}
                gradient="from-primary/20 to-emerald-500/20"
                icon={MessageSquare}
                progress={usagePercentage}
                subtitle={`${totalLimit - totalMessages} remaining`}
                title="Total Messages"
                trend="up"
                value={totalMessages}
              />
              <StatCard
                delay={0.1}
                gradient="from-accent/20 to-purple-500/20"
                icon={Zap}
                progress={
                  creditsSummary?.totalPremiumPurchased
                    ? (creditsSummary.premiumRemaining /
                        creditsSummary.totalPremiumPurchased) *
                      100
                    : 0
                }
                subtitle={`of ${creditsSummary?.totalPremiumPurchased || 0} total`}
                title="Premium Credits"
                value={creditsSummary?.premiumRemaining || 0}
              />
              <StatCard
                delay={0.2}
                gradient="from-amber-500/20 to-orange-500/20"
                icon={Calendar}
                progress={
                  subscription?.tier !== 'free'
                    ? ((subscription?.daysRemaining || 0) / 30) * 100
                    : 100
                }
                subtitle={
                  subscription?.tier === 'free' ? 'Unlimited' : 'Until renewal'
                }
                title="Days Remaining"
                trend="neutral"
                value={subscription?.daysRemaining || 0}
              />
              <StatCard
                delay={0.3}
                gradient="from-green-500/20 to-emerald-500/20"
                icon={Users}
                subtitle={`${referralStats?.totalReferrals || 0} total referrals`}
                title="Referral Earnings"
                trend={referralStats?.totalReferrals ? 'up' : 'neutral'}
                value={`${referralStats?.totalEarnings || 0} SOL`}
              />
            </motion.div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Activity Feed */}
              <motion.div className="lg:col-span-2" variants={itemVariants}>
                <Card className="border-primary/10">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Activity className="h-4 w-4 text-primary" />
                        Recent Activity
                      </CardTitle>
                      <Button
                        className="h-7 text-xs"
                        onClick={() => router.push('/chat')}
                        size="sm"
                        variant="ghost"
                      >
                        View All
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <AnimatePresence>
                      {recentActivity.length > 0 ? (
                        recentActivity.map((activity, index) => (
                          <motion.div
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            initial={{ opacity: 0, x: -20 }}
                            key={`${activity.title}-${activity.timestamp}`}
                            transition={{ delay: index * 0.1 }}
                          >
                            <ActivityItem {...activity} />
                          </motion.div>
                        ))
                      ) : (
                        <motion.div
                          animate={{ opacity: 1 }}
                          className="py-8 text-center text-muted-foreground"
                          initial={{ opacity: 0 }}
                        >
                          <Activity className="mx-auto mb-2 h-8 w-8 opacity-50" />
                          <p className="text-sm">No recent activity</p>
                          <p className="mt-1 text-xs">
                            Start a chat to see activity here
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Actions */}
              <motion.div variants={itemVariants}>
                <Card className="border-primary/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <QuickAction
                        gradient="from-primary to-emerald-500"
                        href="/chat"
                        icon={MessageSquare}
                        label="New Chat"
                      />
                      <QuickAction
                        gradient="from-accent to-purple-500"
                        href="/agents/"
                        icon={Bot}
                        label="Create Agent"
                      />
                      <QuickAction
                        gradient="from-amber-500 to-orange-500"
                        href="/subscription"
                        icon={Wallet}
                        label="Buy Credits"
                      />
                      <QuickAction
                        gradient="from-green-500 to-emerald-500"
                        href="/referrals"
                        icon={Users}
                        label="Referrals"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Usage Analytics */}
            <motion.div variants={itemVariants}>
              <Card className="border-primary/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <ChartBar className="h-5 w-5 text-primary" />
                      Usage Analytics
                    </CardTitle>
                    <Tabs
                      onValueChange={(v) => setSelectedPeriod(v as any)}
                      value={selectedPeriod}
                    >
                      <TabsList>
                        <TabsTrigger value="day">Day</TabsTrigger>
                        <TabsTrigger value="week">Week</TabsTrigger>
                        <TabsTrigger value="month">Month</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-sm">
                          Standard Messages
                        </span>
                        <span className="font-medium text-sm">
                          {subscription?.messagesUsed || 0}
                        </span>
                      </div>
                      <Progress
                        className="h-2"
                        value={
                          ((subscription?.messagesUsed || 0) /
                            (subscription?.messagesLimit || 1)) *
                          100
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-sm">
                          Premium Messages
                        </span>
                        <span className="font-medium text-sm">
                          {subscription?.premiumMessagesUsed || 0}
                        </span>
                      </div>
                      <Progress
                        className="h-2"
                        value={
                          ((subscription?.premiumMessagesUsed || 0) /
                            (subscription?.premiumMessagesLimit || 1)) *
                          100
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-sm">
                          Total Usage
                        </span>
                        <span className="font-medium text-sm">
                          {Math.round(usagePercentage)}%
                        </span>
                      </div>
                      <Progress className="h-2" value={usagePercentage} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Egyptian-themed decorative element */}
            <motion.div
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-2 text-muted-foreground/50"
              initial={{ opacity: 0 }}
              transition={{ delay: 1 }}
            >
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
              <Shield className="h-4 w-4" />
              <span className="text-xs">Protected by ANUBIS</span>
              <Shield className="h-4 w-4" />
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
