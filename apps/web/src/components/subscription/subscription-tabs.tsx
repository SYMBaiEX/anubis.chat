'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, CreditCard, Crown, Plus, Sparkles, Zap } from 'lucide-react';
import { useState } from 'react';
import MessageCreditsModal from '@/components/auth/messageCreditsModal';
import { UpgradeModal } from '@/components/auth/upgrade-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUpgradeModal } from '@/hooks/use-upgrade-modal';
import { subscriptionConfig } from '@/lib/env';
import { cn } from '@/lib/utils';

interface SubscriptionTabsProps {
  // Props from existing subscription page
  subscription: any;
  limits: any;
  selectedPlan: 'free' | 'pro' | 'pro_plus';
  onSelectPlan: (plan: 'free' | 'pro' | 'pro_plus') => void;
  preview: {
    standardPreview: { id: string; name: string }[];
    premiumPreview: { id: string; name: string }[];
    standardTotal: number;
    premiumTotal: number;
  };
}

const MESSAGE_CREDIT_PACK = {
  standardCredits: 150,
  premiumCredits: 25,
  priceSOL: 0.025,
  priceUSD: 3.5,
};

export function SubscriptionTabs({
  subscription,
  limits,
  selectedPlan,
  onSelectPlan,
  preview,
}: SubscriptionTabsProps) {
  const [activeTab, setActiveTab] = useState('subscriptions');
  const [upgradeInitialTab, setUpgradeInitialTab] = useState<
    'subscription' | 'credits'
  >('subscription');
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>(
    'monthly'
  );
  const { isOpen, openModal, closeModal, suggestedTier } = useUpgradeModal();

  const formatTierLabel = (tier: string): string => {
    switch (tier) {
      case 'pro_plus':
        return 'Pro+';
      case 'pro':
        return 'Pro';
      case 'free':
        return 'Free';
      default:
        return tier;
    }
  };

  const renderSubscriptionTab = () => (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {/* Current subscription status */}
      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        whileHover={{ scale: 1.02 }}
      >
        <Card className="p-4 ring-1 ring-primary/10 transition-all duration-300 hover:shadow-lg hover:ring-primary/20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className={cn(
                  'relative overflow-hidden rounded-lg p-2',
                  subscription.tier === 'pro_plus'
                    ? 'bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800'
                    : subscription.tier === 'pro'
                      ? 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800'
                      : 'bg-gradient-to-br from-muted to-muted/80'
                )}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                whileHover={{ scale: 1.1 }}
              >
                <Crown
                  className={cn(
                    'relative z-10 h-5 w-5',
                    subscription.tier === 'pro_plus'
                      ? 'text-purple-600 dark:text-purple-400'
                      : subscription.tier === 'pro'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-muted-foreground'
                  )}
                />
                {subscription.tier !== 'free' && (
                  <motion.div
                    animate={{
                      x: [-100, 100],
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: 'loop',
                      ease: 'linear',
                    }}
                  />
                )}
              </motion.div>
              <div>
                <motion.h3
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text font-semibold text-base text-transparent sm:text-lg"
                  initial={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  {formatTierLabel(subscription.tier)} Plan
                </motion.h3>
                <motion.p
                  animate={{ opacity: 1, x: 0 }}
                  className="text-muted-foreground text-xs leading-snug sm:text-sm"
                  initial={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  {subscription.tier === 'free' &&
                    'Basic features with limited access'}
                  {subscription.tier === 'pro' &&
                    'Enhanced features with premium models'}
                  {subscription.tier === 'pro_plus' &&
                    'Full access including premium models'}
                </motion.p>
              </div>
            </div>
            <motion.div
              animate={{ opacity: 1, x: 0 }}
              initial={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <Button
                className="group relative overflow-hidden transition-all duration-300 hover:scale-105"
                onClick={() =>
                  openModal({
                    tier: subscription.tier === 'pro' ? 'pro_plus' : 'pro',
                    trigger: 'manual',
                  })
                }
                size="sm"
                variant={
                  subscription.tier === 'pro_plus' ? 'outline' : 'default'
                }
              >
                <motion.span
                  className="relative z-10 flex items-center gap-2"
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  whileHover={{ x: 2 }}
                >
                  {subscription.tier !== 'pro_plus' && (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {subscription.tier === 'free' && 'Upgrade'}
                  {subscription.tier === 'pro' && 'Upgrade to Pro+'}
                  {subscription.tier === 'pro_plus' && 'Manage Billing'}
                </motion.span>
                {subscription.tier !== 'pro_plus' && (
                  <motion.div
                    animate={{
                      x: [-100, 100],
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    transition={{
                      duration: 3,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: 'loop',
                      ease: 'linear',
                    }}
                  />
                )}
              </Button>
            </motion.div>
          </div>
        </Card>
      </motion.div>

      {/* Plans comparison */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="relative overflow-hidden p-4 ring-1 ring-border/50 transition-all duration-300 hover:shadow-lg hover:ring-primary/20 sm:p-5">
          <motion.div
            animate={{ scaleX: 1 }}
            className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500"
            initial={{ scaleX: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          />
          <div className="mb-3 flex items-center justify-between">
            <motion.h3
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text font-semibold text-base text-transparent sm:text-lg"
              initial={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              Available Plans
            </motion.h3>
            {(subscription.tier === 'free' || subscription.tier === 'pro') && (
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                initial={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <Button
                  className="group relative overflow-hidden transition-all duration-300 hover:scale-105"
                  onClick={() =>
                    openModal({ tier: 'pro_plus', trigger: 'manual' })
                  }
                  size="sm"
                >
                  <motion.span
                    className="relative z-10 flex items-center gap-2"
                    whileHover={{ x: 2 }}
                  >
                    <Crown className="h-4 w-4" />
                    Upgrade to Pro+
                  </motion.span>
                  <motion.div
                    animate={{ x: [-100, 100] }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    transition={{
                      duration: 3,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: 'loop',
                      ease: 'linear',
                    }}
                  />
                </Button>
              </motion.div>
            )}
          </div>

          {/* Billing period toggle */}
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-center justify-center"
            initial={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.4, delay: 0.35 }}
          >
            <div className="flex items-center space-x-1 rounded-lg bg-muted p-1">
              <button
                className={cn(
                  'rounded-md px-3 py-1.5 font-medium text-sm transition-all duration-200',
                  billingPeriod === 'monthly'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                onClick={() => setBillingPeriod('monthly')}
                type="button"
              >
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Monthly
                </span>
              </button>
              <button
                className={cn(
                  'relative rounded-md px-3 py-1.5 font-medium text-sm transition-all duration-200',
                  billingPeriod === 'yearly'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                onClick={() => setBillingPeriod('yearly')}
                type="button"
              >
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Yearly
                  <Badge className="ml-1 bg-green-100 px-1.5 py-0 text-green-800 text-xs dark:bg-green-900/50 dark:text-green-300">
                    5% OFF
                  </Badge>
                </span>
              </button>
            </div>
          </motion.div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:grid-cols-3">
              {/* Free Plan */}
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <input
                  checked={selectedPlan === 'free'}
                  className="sr-only"
                  id="plan-free"
                  name="plan"
                  onChange={() => onSelectPlan('free')}
                  type="radio"
                />
                <label
                  className={cn(
                    'group relative block h-full min-h-[10rem] cursor-pointer overflow-hidden rounded-xl border p-4 transition-all duration-300',
                    selectedPlan === 'free'
                      ? 'border-primary/40 bg-gradient-to-br from-primary/10 to-transparent shadow-lg ring-2 ring-primary/40'
                      : 'border-border hover:border-primary/20 hover:shadow-md hover:ring-1 hover:ring-primary/20'
                  )}
                  htmlFor="plan-free"
                >
                  {selectedPlan === 'free' && (
                    <motion.div
                      animate={{
                        background: [
                          'linear-gradient(90deg, rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))',
                          'linear-gradient(90deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.1))',
                        ],
                      }}
                      className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5"
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: 'reverse',
                      }}
                    />
                  )}
                  <div className="relative z-10 flex h-full flex-col justify-between gap-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="font-semibold tracking-tight">Free</div>
                        {subscription.tier === 'free' && (
                          <motion.div
                            animate={{ scale: 1 }}
                            className="rounded bg-primary/10 px-2 py-1 font-medium text-primary text-xs"
                            initial={{ scale: 0 }}
                            transition={{
                              type: 'spring',
                              stiffness: 500,
                              damping: 25,
                            }}
                          >
                            Current
                          </motion.div>
                        )}
                      </div>
                      <div className="font-semibold text-foreground text-sm">
                        $0
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Forever
                      </div>
                    </div>
                  </div>
                </label>
              </motion.div>

              {/* Pro Plan */}
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.4, delay: 0.6 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <input
                  checked={selectedPlan === 'pro'}
                  className="sr-only"
                  id="plan-pro"
                  name="plan"
                  onChange={() => onSelectPlan('pro')}
                  type="radio"
                />
                <label
                  className={cn(
                    'group relative block h-full min-h-[10rem] cursor-pointer overflow-hidden rounded-xl border p-4 transition-all duration-300',
                    selectedPlan === 'pro'
                      ? 'border-blue-400/60 bg-gradient-to-br from-blue-50/80 to-blue-100/40 shadow-lg ring-2 ring-blue-400/60 dark:from-blue-900/40 dark:to-blue-800/20'
                      : 'border-border hover:border-blue-400/30 hover:shadow-md hover:ring-1 hover:ring-blue-400/30'
                  )}
                  htmlFor="plan-pro"
                >
                  {selectedPlan === 'pro' && (
                    <motion.div
                      animate={{
                        background: [
                          'linear-gradient(90deg, rgba(59, 130, 246, 0.1), rgba(96, 165, 250, 0.2), rgba(59, 130, 246, 0.1))',
                          'linear-gradient(90deg, rgba(96, 165, 250, 0.2), rgba(59, 130, 246, 0.1), rgba(96, 165, 250, 0.2))',
                        ],
                      }}
                      className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-blue-400/20 to-blue-500/10"
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: 'reverse',
                      }}
                    />
                  )}
                  <div className="relative z-10 flex h-full flex-col justify-between gap-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <motion.div
                            animate={{
                              scale: selectedPlan === 'pro' ? [1, 1.2, 1] : 1,
                              rotate:
                                selectedPlan === 'pro' ? [0, 10, -10, 0] : 0,
                            }}
                            transition={{
                              duration: 2,
                              repeat:
                                selectedPlan === 'pro'
                                  ? Number.POSITIVE_INFINITY
                                  : 0,
                              ease: 'easeInOut',
                            }}
                          >
                            <Zap className="h-4 w-4 text-blue-500" />
                          </motion.div>
                          <div className="font-semibold tracking-tight">
                            Pro
                          </div>
                        </div>
                        {subscription.tier === 'pro' && (
                          <motion.div
                            animate={{ scale: 1 }}
                            className="rounded bg-blue-100 px-2 py-1 font-medium text-blue-700 text-xs dark:bg-blue-900/50 dark:text-blue-300"
                            initial={{ scale: 0 }}
                            transition={{
                              type: 'spring',
                              stiffness: 500,
                              damping: 25,
                            }}
                          >
                            Current
                          </motion.div>
                        )}
                      </div>
                      <div className="font-semibold text-foreground text-sm">
                        {subscriptionConfig.pro[billingPeriod].priceSOL} SOL
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        per {billingPeriod === 'yearly' ? 'year' : 'month'}
                        {billingPeriod === 'yearly' && (
                          <span className="ml-1 text-green-600 dark:text-green-400">
                            (5% off)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </label>
              </motion.div>

              {/* Pro+ Plan */}
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.4, delay: 0.7 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <input
                  checked={selectedPlan === 'pro_plus'}
                  className="sr-only"
                  id="plan-pro-plus"
                  name="plan"
                  onChange={() => onSelectPlan('pro_plus')}
                  type="radio"
                />
                <label
                  className={cn(
                    'group relative block h-full min-h-[10rem] cursor-pointer overflow-hidden rounded-xl border p-4 transition-all duration-300',
                    selectedPlan === 'pro_plus'
                      ? 'border-purple-400/60 bg-gradient-to-br from-purple-50/80 to-purple-100/40 shadow-lg ring-2 ring-purple-400/60 dark:from-purple-900/40 dark:to-purple-800/20'
                      : 'border-border hover:border-purple-400/30 hover:shadow-md hover:ring-1 hover:ring-purple-400/30'
                  )}
                  htmlFor="plan-pro-plus"
                >
                  {selectedPlan === 'pro_plus' && (
                    <>
                      <motion.div
                        animate={{
                          background: [
                            'linear-gradient(90deg, rgba(147, 51, 234, 0.1), rgba(168, 85, 247, 0.2), rgba(147, 51, 234, 0.1))',
                            'linear-gradient(90deg, rgba(168, 85, 247, 0.2), rgba(147, 51, 234, 0.1), rgba(168, 85, 247, 0.2))',
                          ],
                        }}
                        className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-purple-400/20 to-purple-500/10"
                        transition={{
                          duration: 2,
                          repeat: Number.POSITIVE_INFINITY,
                          repeatType: 'reverse',
                        }}
                      />
                      <motion.div
                        animate={{
                          rotate: 360,
                          scale: [1, 1.2, 1],
                        }}
                        className="absolute top-2 right-2"
                        transition={{
                          rotate: {
                            duration: 8,
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
                        <Sparkles className="h-3 w-3 text-purple-500/60" />
                      </motion.div>
                    </>
                  )}
                  <div className="relative z-10 flex h-full flex-col justify-between gap-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <motion.div
                            animate={{
                              scale:
                                selectedPlan === 'pro_plus' ? [1, 1.1, 1] : 1,
                              y: selectedPlan === 'pro_plus' ? [0, -2, 0] : 0,
                            }}
                            transition={{
                              duration: 1.5,
                              repeat:
                                selectedPlan === 'pro_plus'
                                  ? Number.POSITIVE_INFINITY
                                  : 0,
                              ease: 'easeInOut',
                            }}
                          >
                            <Crown className="h-4 w-4 text-purple-500" />
                          </motion.div>
                          <div className="font-semibold tracking-tight">
                            Pro+
                          </div>
                        </div>
                        {(subscription.tier === 'pro_plus' ||
                          subscription.tier === 'admin') && (
                          <motion.div
                            animate={{ scale: 1 }}
                            className="rounded bg-purple-100 px-2 py-1 font-medium text-purple-700 text-xs dark:bg-purple-900/50 dark:text-purple-300"
                            initial={{ scale: 0 }}
                            transition={{
                              type: 'spring',
                              stiffness: 500,
                              damping: 25,
                            }}
                          >
                            Current
                          </motion.div>
                        )}
                      </div>
                      <div className="font-semibold text-foreground text-sm">
                        {subscriptionConfig.proPlus[billingPeriod].priceSOL} SOL
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        per {billingPeriod === 'yearly' ? 'year' : 'month'}
                        {billingPeriod === 'yearly' && (
                          <span className="ml-1 text-green-600 dark:text-green-400">
                            (5% off)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </label>
              </motion.div>
            </div>

            {/* Features preview */}
            <motion.div
              animate={{ opacity: 1, x: 0 }}
              initial={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <motion.h4
                animate={{ opacity: 1, y: 0 }}
                className="mb-2 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text font-medium text-transparent"
                initial={{ opacity: 0, y: 10 }}
                key={selectedPlan}
                transition={{ duration: 0.3 }}
              >
                Features for{' '}
                {selectedPlan === 'pro_plus'
                  ? 'Pro+'
                  : selectedPlan.charAt(0).toUpperCase() +
                    selectedPlan.slice(1)}
              </motion.h4>
              <motion.div
                animate="visible"
                className="mt-3 grid grid-cols-2 gap-2 text-[11px] sm:text-xs"
                initial="hidden"
                key={selectedPlan}
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.1,
                    },
                  },
                }}
              >
                <motion.div
                  key="messages-month"
                  className="rounded-xl border p-2 transition-all duration-200 hover:border-primary/30 hover:shadow-sm"
                  variants={{
                    hidden: { opacity: 0, scale: 0.8 },
                    visible: { opacity: 1, scale: 1 },
                  }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="text-muted-foreground">Messages/month</div>
                  <motion.div
                    animate={{
                      color:
                        selectedPlan === 'pro_plus'
                          ? '#8b5cf6'
                          : selectedPlan === 'pro'
                            ? '#3b82f6'
                            : '#6b7280',
                    }}
                    className="font-medium"
                    transition={{ duration: 0.3 }}
                  >
                    {selectedPlan === 'free' && '50'}
                    {selectedPlan === 'pro' && '500'}
                    {selectedPlan === 'pro_plus' && '1,000'}
                  </motion.div>
                </motion.div>
                <motion.div
                  key="premium-messages"
                  className="rounded-xl border p-2 transition-all duration-200 hover:border-primary/30 hover:shadow-sm"
                  variants={{
                    hidden: { opacity: 0, scale: 0.8 },
                    visible: { opacity: 1, scale: 1 },
                  }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="text-muted-foreground">Premium messages</div>
                  <motion.div
                    animate={{
                      color:
                        selectedPlan === 'pro_plus'
                          ? '#8b5cf6'
                          : selectedPlan === 'pro'
                            ? '#3b82f6'
                            : '#6b7280',
                    }}
                    className="font-medium"
                    transition={{ duration: 0.3 }}
                  >
                    {selectedPlan === 'free' && '—'}
                    {selectedPlan === 'pro' && '100'}
                    {selectedPlan === 'pro_plus' && '300'}
                  </motion.div>
                </motion.div>
                <motion.div
                  key="standard-models"
                  className="rounded-xl border p-2 transition-all duration-200 hover:border-primary/30 hover:shadow-sm"
                  variants={{
                    hidden: { opacity: 0, scale: 0.8 },
                    visible: { opacity: 1, scale: 1 },
                  }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="text-muted-foreground">Standard models</div>
                  <motion.div
                    animate={{
                      color:
                        selectedPlan === 'pro_plus'
                          ? '#8b5cf6'
                          : selectedPlan === 'pro'
                            ? '#3b82f6'
                            : '#6b7280',
                    }}
                    className="font-medium"
                    transition={{ duration: 0.3 }}
                  >
                    {preview.standardTotal}
                  </motion.div>
                </motion.div>
                <motion.div
                  key="premium-models"
                  className="rounded-xl border p-2 transition-all duration-200 hover:border-primary/30 hover:shadow-sm"
                  variants={{
                    hidden: { opacity: 0, scale: 0.8 },
                    visible: { opacity: 1, scale: 1 },
                  }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="text-muted-foreground">Premium models</div>
                  <motion.div
                    animate={{
                      color:
                        selectedPlan === 'pro_plus'
                          ? '#8b5cf6'
                          : selectedPlan === 'pro'
                            ? '#3b82f6'
                            : '#6b7280',
                    }}
                    className="font-medium"
                    transition={{ duration: 0.3 }}
                  >
                    {preview.premiumTotal}
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );

  const renderCreditsTab = () => (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {/* Current credits balance */}
      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        whileHover={{ scale: 1.02 }}
      >
        <Card className="relative p-4 ring-1 ring-primary/10 transition-all duration-300 hover:shadow-lg hover:ring-primary/20">
          <motion.div
            animate={{ scaleX: 1 }}
            className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-green-400 via-emerald-500 to-green-600"
            initial={{ scaleX: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className="relative overflow-hidden rounded-lg bg-gradient-to-br from-green-100 to-green-200 p-2 dark:from-green-900 dark:to-green-800"
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                whileHover={{ scale: 1.1 }}
              >
                <CreditCard className="relative z-10 h-5 w-5 text-green-600 dark:text-green-400" />
                <motion.div
                  animate={{ x: [-100, 100] }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  transition={{
                    duration: 3,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: 'loop',
                    ease: 'linear',
                  }}
                />
              </motion.div>
              <div>
                <motion.h3
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gradient-to-r from-green-700 to-green-600 bg-clip-text font-semibold text-base text-transparent sm:text-lg dark:from-green-400 dark:to-green-300"
                  initial={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  Current Credits
                </motion.h3>
                <motion.p
                  animate={{ opacity: 1, x: 0 }}
                  className="text-muted-foreground text-xs leading-snug sm:text-sm"
                  initial={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <motion.span
                    animate={{ scale: [1, 1.05, 1] }}
                    className="font-medium text-green-600 dark:text-green-400"
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: 'easeInOut',
                    }}
                  >
                    {subscription.messageCredits || 0}
                  </motion.span>
                  {' Standard • '}
                  <motion.span
                    animate={{ scale: [1, 1.05, 1] }}
                    className="font-medium text-green-600 dark:text-green-400"
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: 'easeInOut',
                      delay: 1,
                    }}
                  >
                    {subscription.premiumMessageCredits || 0}
                  </motion.span>
                  {' Premium'}
                </motion.p>
              </div>
            </div>
            <motion.div
              animate={{ opacity: 1, x: 0 }}
              initial={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <Button
                className="group relative overflow-hidden bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300 hover:scale-105 hover:from-green-600 hover:to-green-700"
                onClick={() => {
                  // Open the Upgrade modal directly on the credits tab
                  setUpgradeInitialTab('credits');
                  openModal({
                    tier: subscription.tier === 'free' ? 'pro' : 'pro_plus',
                    trigger: 'manual',
                  });
                }}
                size="sm"
              >
                <motion.span
                  className="relative z-10 flex items-center gap-2"
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  whileHover={{ x: 2 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 180, 360] }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: 'linear',
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </motion.div>
                  Buy Credits
                </motion.span>
                <motion.div
                  animate={{ x: [-100, 100] }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  transition={{
                    duration: 3,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: 'loop',
                    ease: 'linear',
                  }}
                />
              </Button>
            </motion.div>
          </div>
        </Card>
      </motion.div>

      {/* Credit pack selection */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="relative overflow-hidden p-4 ring-1 ring-border/50 transition-all duration-300 hover:shadow-lg hover:ring-primary/20 sm:p-5">
          <motion.div
            animate={{ scaleX: 1 }}
            className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-green-400 via-emerald-500 to-green-600"
            initial={{ scaleX: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          />
          <div className="mb-3 flex items-center justify-between">
            <motion.h3
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-r from-green-700 to-green-600 bg-clip-text font-semibold text-base text-transparent sm:text-lg dark:from-green-400 dark:to-green-300"
              initial={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              Message Credit Pack
            </motion.h3>
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              initial={{ opacity: 0, scale: 0.8 }}
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 25,
                delay: 0.4,
              }}
              whileHover={{ scale: 1.05 }}
            >
              <Badge className="relative overflow-hidden bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/50 dark:to-emerald-900/50 dark:text-green-300">
                <motion.span
                  animate={{ opacity: [1, 0.7, 1] }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'easeInOut',
                  }}
                >
                  Best Value
                </motion.span>
                <motion.div
                  animate={{ x: [-100, 100] }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: 'loop',
                    ease: 'linear',
                  }}
                />
              </Badge>
            </motion.div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:grid-cols-3">
              {/* Pack details */}
              <div>
                <div className="group block h-full min-h-[8rem] cursor-default rounded-xl border border-green-200 bg-gradient-to-br from-green-50/50 to-transparent p-4 ring-1 ring-green-200/40 transition-all">
                  <div className="flex h-full flex-col justify-between gap-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="font-semibold tracking-tight">
                          Credits
                        </div>
                      </div>
                      <div className="font-semibold text-foreground text-sm">
                        {MESSAGE_CREDIT_PACK.standardCredits +
                          MESSAGE_CREDIT_PACK.premiumCredits}{' '}
                        total
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {MESSAGE_CREDIT_PACK.standardCredits} standard +{' '}
                        {MESSAGE_CREDIT_PACK.premiumCredits} premium
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <div className="group block h-full min-h-[8rem] cursor-default rounded-xl border border-green-200 bg-gradient-to-br from-green-50/50 to-transparent p-4 ring-1 ring-green-200/40 transition-all">
                  <div className="flex h-full flex-col justify-between gap-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="font-semibold tracking-tight">
                          Price
                        </div>
                      </div>
                      <div className="font-semibold text-foreground text-sm">
                        {MESSAGE_CREDIT_PACK.priceSOL} SOL
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        ≈ ${MESSAGE_CREDIT_PACK.priceUSD} USD
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div>
                <div className="group block h-full min-h-[8rem] cursor-default rounded-xl border border-green-200 bg-gradient-to-br from-green-50/50 to-transparent p-4 ring-1 ring-green-200/40 transition-all">
                  <div className="flex h-full flex-col justify-between gap-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="font-semibold tracking-tight">
                          Benefits
                        </div>
                      </div>
                      <div className="font-semibold text-foreground text-sm">
                        Never expire
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Stack with plan
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features & How it works */}
            <div>
              <h4 className="mb-2 font-medium">
                How Message Consumption Works
              </h4>
              <div className="mt-3 grid grid-cols-1 gap-2 text-[11px] sm:text-xs">
                <div className="rounded-xl border p-2">
                  <div className="text-muted-foreground">
                    1. Plan messages first
                  </div>
                  <div className="font-medium">
                    50 Free • 500 Pro • 1,000 Pro+
                  </div>
                </div>
                <div className="rounded-xl border p-2">
                  <div className="text-muted-foreground">
                    2. Credits when needed
                  </div>
                  <div className="font-medium">Auto-used after plan</div>
                </div>
                <div className="rounded-xl border p-2">
                  <div className="text-muted-foreground">
                    3. Premium same pattern
                  </div>
                  <div className="font-medium">Plan premium → credits</div>
                </div>
                <div className="rounded-xl border p-2">
                  <div className="text-muted-foreground">
                    4. Referral support
                  </div>
                  <div className="font-medium">Earn commissions</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Removed redundant bottom purchase button per design update */}
    </motion.div>
  );

  return (
    <>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5 }}
      >
        <Tabs className="w-full" onValueChange={setActiveTab} value={activeTab}>
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <TabsList className="relative grid w-full grid-cols-2 overflow-hidden">
              <motion.div
                animate={{
                  background: [
                    'linear-gradient(90deg, rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))',
                    'linear-gradient(90deg, rgba(139, 92, 246, 0.05), rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05))',
                    'linear-gradient(90deg, rgba(16, 185, 129, 0.05), rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))',
                    'linear-gradient(90deg, rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))',
                  ],
                }}
                className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5"
                transition={{
                  duration: 6,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: 'easeInOut',
                }}
              />
              <TabsTrigger
                className="relative z-10 flex items-center space-x-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-50 data-[state=active]:to-purple-50 sm:space-x-2 dark:data-[state=active]:from-blue-900/20 dark:data-[state=active]:to-purple-900/20"
                value="subscriptions"
              >
                <motion.div
                  animate={{
                    rotate: activeTab === 'subscriptions' ? [0, 10, -10, 0] : 0,
                    scale: activeTab === 'subscriptions' ? [1, 1.1, 1] : 1,
                  }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                >
                  <Crown className="h-4 w-4 flex-shrink-0" />
                </motion.div>
                <span className="hidden sm:inline">Subscription Plans</span>
                <span className="sm:hidden">Plans</span>
              </TabsTrigger>
              <TabsTrigger
                className="relative z-10 flex items-center space-x-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-50 data-[state=active]:to-emerald-50 sm:space-x-2 dark:data-[state=active]:from-green-900/20 dark:data-[state=active]:to-emerald-900/20"
                value="credits"
              >
                <motion.div
                  animate={{
                    rotate: activeTab === 'credits' ? [0, 360] : 0,
                    scale: activeTab === 'credits' ? [1, 1.1, 1] : 1,
                  }}
                  transition={{
                    rotate: {
                      duration: 2,
                      repeat:
                        activeTab === 'credits' ? Number.POSITIVE_INFINITY : 0,
                      ease: 'linear',
                    },
                    scale: { duration: 0.5, ease: 'easeInOut' },
                  }}
                >
                  <CreditCard className="h-4 w-4 flex-shrink-0" />
                </motion.div>
                <span className="hidden sm:inline">Message Credits</span>
                <span className="sm:hidden">Credits</span>
              </TabsTrigger>
            </TabsList>
          </motion.div>

          <div className="relative mt-6">
            <AnimatePresence mode="wait">
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                initial={{ opacity: 0, x: 20 }}
                key={activeTab}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 25,
                  duration: 0.3,
                }}
              >
                <TabsContent className="m-0" value="subscriptions">
                  {renderSubscriptionTab()}
                </TabsContent>

                <TabsContent className="m-0" value="credits">
                  {renderCreditsTab()}
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </div>
        </Tabs>
      </motion.div>

      {/* Modals */}
      <UpgradeModal
        initialTab={upgradeInitialTab}
        isOpen={isOpen}
        onClose={closeModal}
        suggestedTier={suggestedTier}
        trigger="manual"
      />

      <MessageCreditsModal
        isOpen={isCreditsModalOpen}
        onClose={() => setIsCreditsModalOpen(false)}
      />
    </>
  );
}

export default SubscriptionTabs;
