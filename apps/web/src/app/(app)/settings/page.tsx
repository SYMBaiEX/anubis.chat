'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Bot,
  Crown,
  Loader,
  MessageSquare,
  Settings,
  Sparkles,
  User as UserIcon,
  Wallet as WalletIcon,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { type GridSetting, SettingsGrid } from '@/components/ui/settings-grid';
import { useSubscription } from '@/hooks/use-subscription';

export default function SettingsPage() {
  const { user, isLoading: authLoading } = useAuthContext();
  const {
    subscription,
    upgradePrompt,
    isLoading: subscriptionLoading,
    error,
  } = useSubscription();
  const router = useRouter();

  const isLoading = authLoading || subscriptionLoading;

  const formatTierLabel = (tier?: string): string => {
    switch (tier) {
      case 'pro_plus':
        return 'Pro+';
      case 'pro':
        return 'Pro';
      case 'free':
        return 'Free';
      case 'admin':
        return 'Admin';
      default:
        return tier ?? 'Free';
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            animate={{
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            className="mx-auto mb-4"
            transition={{
              rotate: {
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'linear',
              },
              scale: {
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'easeInOut',
              },
            }}
          >
            <Settings className="h-8 w-8 text-primary" />
          </motion.div>
          <motion.h2
            animate={{ opacity: 1 }}
            className="font-semibold text-xl"
            initial={{ opacity: 0 }}
            transition={{ delay: 0.2 }}
          >
            Loading settings...
          </motion.h2>
          <motion.p
            animate={{ opacity: 1 }}
            className="text-muted-foreground"
            initial={{ opacity: 0 }}
            transition={{ delay: 0.4 }}
          >
            Please wait while we load your settings.
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 p-4 sm:p-6"
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          animate={{ opacity: 1, x: 0 }}
          initial={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h1 className="font-semibold text-xl sm:text-2xl">Settings</h1>
          <p className="text-muted-foreground">
            Manage your preferences and integrations
          </p>
        </motion.div>
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          initial={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
        >
          <Alert className="relative overflow-hidden" variant="destructive">
            <motion.div
              animate={{ x: [-100, 100] }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/10 to-transparent"
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: 'loop',
                ease: 'linear',
              }}
            />
            <AlertTriangle className="relative z-10 h-4 w-4" />
            <AlertDescription className="relative z-10">
              Unable to load subscription data. Some features may not be
              available.
            </AlertDescription>
          </Alert>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="w-full bg-gradient-to-b from-primary/5 dark:from-primary/10"
      initial={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Full-width header */}
      <div className="w-full p-4 md:p-6">
        <div className="mx-auto w-full max-w-6xl">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
            initial={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <motion.div
              animate={{
                rotate: [0, 360],
                scale: [1, 1.1, 1],
              }}
              transition={{
                rotate: {
                  duration: 4,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: 'linear',
                },
                scale: {
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: 'easeInOut',
                },
              }}
            >
              <Settings className="h-6 w-6 text-primary sm:h-8 sm:w-8" />
            </motion.div>
            <div>
              <motion.h1
                animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text font-semibold text-2xl text-transparent sm:text-3xl"
                initial={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                Settings
              </motion.h1>
              <motion.p
                animate={{ opacity: 1, x: 0 }}
                className="text-muted-foreground"
                initial={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                Manage your preferences and integrations
              </motion.p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Constrained content */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full max-w-6xl space-y-4 p-3 sm:p-4 md:p-6"
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        {/* Show upgrade prompt if needed */}
        <AnimatePresence>
          {upgradePrompt?.shouldShow && (
            <motion.div
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              className="overflow-hidden"
              exit={{ opacity: 0, height: 0, y: -20 }}
              initial={{ opacity: 0, height: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <Alert className="relative overflow-hidden border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
                <motion.div
                  animate={{ x: [-100, 100] }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-400/20 to-transparent"
                  transition={{
                    duration: 3,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: 'loop',
                    ease: 'linear',
                  }}
                />
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'easeInOut',
                  }}
                >
                  <AlertTriangle className="relative z-10 h-4 w-4 text-orange-600 dark:text-orange-400" />
                </motion.div>
                <AlertDescription className="relative z-10 text-orange-800 dark:text-orange-200">
                  <strong>{upgradePrompt.title}</strong>
                  <p className="mt-1 text-sm">{upgradePrompt.message}</p>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          animate={{ opacity: 1 }}
          className="space-y-6"
          initial={{ opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            <motion.h2
              animate={{ opacity: 1, x: 0 }}
              className="mb-2 flex items-center gap-2 font-medium"
              initial={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.4, delay: 0.7 }}
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: 'easeInOut',
                }}
              >
                <Crown className="h-4 w-4 text-primary" />
              </motion.div>
              Billing & plan
            </motion.h2>
            {(() => {
              const settings: GridSetting[] = [
                {
                  id: 'subscription-tier',
                  title: 'Subscription',
                  description: 'Plan and usage',
                  type: 'display',
                  value: `${formatTierLabel(subscription?.tier)}${
                    subscription?.messagesLimit
                      ? ` • ${subscription.messagesUsed || 0}/${
                          subscription.messagesLimit
                        } msgs`
                      : ''
                  }`,
                  badge:
                    subscription?.tier !== 'free' && subscription?.planPriceSol
                      ? `${subscription.planPriceSol} SOL/mo`
                      : undefined,
                  icon: <Crown className="h-4 w-4 text-primary" />,
                  category: 'advanced',
                  compact: true,
                },
                {
                  id: 'manage-subscription',
                  title: 'Manage Subscription',
                  description: 'Billing and plan details',
                  type: 'action',
                  onClick: () => router.push('/subscription'),
                  icon: <Crown className="h-4 w-4 text-primary" />,
                  category: 'advanced',
                  compact: true,
                },
              ];
              return (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  initial={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.4, delay: 0.8 }}
                  whileHover={{ scale: 1.01 }}
                >
                  <SettingsGrid
                    className="mt-1"
                    columns={2}
                    gridClassName="gap-4"
                    settings={settings}
                    showFilter={false}
                  />
                </motion.div>
              );
            })()}
          </motion.div>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, delay: 0.9 }}
          >
            <motion.h2
              animate={{ opacity: 1, x: 0 }}
              className="mb-2 flex items-center gap-2 font-medium"
              initial={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.4, delay: 1.0 }}
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{
                  duration: 3,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: 'linear',
                }}
              >
                <Zap className="h-4 w-4 text-primary" />
              </motion.div>
              Account & tools
            </motion.h2>
            {(() => {
              const settings: GridSetting[] = [
                {
                  id: 'account',
                  title: 'Account',
                  description: user?.walletAddress
                    ? `${user.walletAddress.slice(0, 8)}...${user.walletAddress.slice(-4)}`
                    : 'No wallet connected',
                  type: 'action',
                  onClick: () => router.push('/account'),
                  icon: <UserIcon className="h-4 w-4 text-primary" />,
                  category: 'interface',
                },
                {
                  id: 'wallet',
                  title: 'Wallet',
                  description: 'Connect and manage your wallet',
                  type: 'action',
                  onClick: () => router.push('/wallet'),
                  icon: <WalletIcon className="h-4 w-4 text-primary" />,
                  category: 'interface',
                },
                {
                  id: 'chat-settings',
                  title: 'Chat Settings',
                  description: 'Configure AI models and chat behavior',
                  type: 'action',
                  onClick: () => {
                    // Navigate to chat page and open settings
                    router.push('/chat?openSettings=true');
                  },
                  icon: <MessageSquare className="h-4 w-4 text-primary" />,
                  category: 'behavior',
                },
                {
                  id: 'agents',
                  title: 'Agents',
                  description: 'Create and manage agents',
                  type: 'action',
                  onClick: () => router.push('/agents'),
                  icon: <Bot className="h-4 w-4 text-primary" />,
                  category: 'behavior',
                },
              ];
              return (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  initial={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.4, delay: 1.1 }}
                  whileHover={{ scale: 1.01 }}
                >
                  <SettingsGrid
                    className="mt-1"
                    columns={2}
                    gridClassName="gap-4"
                    settings={settings}
                    showFilter={false}
                  />
                </motion.div>
              );
            })()}
          </motion.div>
        </motion.div>

        {/* Preferences section removed by request */}
      </motion.div>
    </motion.div>
  );
}
