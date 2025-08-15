'use client';

import { api } from '@convex/_generated/api';
import { useMutation, useQuery } from 'convex/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Clock,
  Copy,
  Crown,
  DollarSign,
  Medal,
  MessageCircle,
  Send,
  Star,
  TrendingUp,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Client-side validation to mirror backend rules
const REFERRAL_CODE_REGEX = /^[A-Z0-9]+$/;

function validateReferralCodeFormat(code: string): {
  valid: boolean;
  error?: string;
} {
  if (!code) {
    return { valid: true };
  }
  if (code.length < 4 || code.length > 12) {
    return { valid: false, error: 'Referral code must be 4-12 characters' };
  }
  if (!REFERRAL_CODE_REGEX.test(code)) {
    return { valid: false, error: 'Use only letters A-Z and digits 0-9' };
  }
  return { valid: true };
}

function sanitizeCustomCodeInput(raw: string): string {
  const upper = raw.toUpperCase();
  // Remove non-alphanumerics only (backend will validate same)
  return upper.replace(/[^A-Z0-9]/g, '');
}

export default function ReferralsPage() {
  const { toast } = useToast();
  const [customCode, setCustomCode] = useState('');
  const [claimCode, setClaimCode] = useState('');

  // Data queries
  const subscriptionStatus = useQuery(api.subscriptions.getSubscriptionStatus);
  const userReferralCode = useQuery(api.referrals.getUserReferralCode);
  const userReferralStats = useQuery(api.referrals.getUserReferralStats);
  const claimStatus = useQuery(api.referrals.getReferralClaimStatus);
  const referredUsers = useQuery(api.referrals.getReferredUsers, { limit: 10 });
  const referrerInfo = useQuery(api.referrals.getReferrerPayoutInfo, {});

  // Mutations
  const createReferralCode = useMutation(api.referrals.createReferralCode);
  const claimReferral = useMutation(api.referrals.claimReferral);

  const canCreateReferral =
    subscriptionStatus?.tier === 'pro_plus' ||
    subscriptionStatus?.tier === 'admin';
  const currentTier = subscriptionStatus?.tier || 'free';

  const copyToClipboard = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        toast({
          title: 'Copied!',
          description: 'Referral link copied to clipboard',
        });
      } catch (_error) {
        toast({
          title: 'Copy failed',
          description: 'Please copy the link manually',
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  const handleCreateReferralCode = async () => {
    try {
      if (customCode) {
        const cleaned = sanitizeCustomCodeInput(customCode);
        if (cleaned !== customCode) {
          setCustomCode(cleaned);
        }
        const validation = validateReferralCodeFormat(cleaned);
        if (!validation.valid) {
          toast({
            title: 'Invalid code',
            description: validation.error,
            variant: 'destructive',
          });
          return;
        }
      }
      await createReferralCode({ customCode: customCode || undefined });
      toast({
        title: 'Success!',
        description: 'Your referral code has been created',
      });
      setCustomCode('');
    } catch (error) {
      toast({
        title: 'Error',
        description:
          (error as Error).message || 'Failed to create referral code',
        variant: 'destructive',
      });
    }
  };

  const formatTimeCompact = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  const handleClaimReferral = async () => {
    if (!claimCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a referral code',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await claimReferral({ referralCode: claimCode });
      toast({
        title: 'Success!',
        description: result.message || 'Referral claimed successfully',
      });
      setClaimCode('');
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message || 'Failed to claim referral',
        variant: 'destructive',
      });
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
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

  const headerVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-b from-background to-background/95"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        key="referrals"
      >
        {/* Subtle Background Effect */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute right-1/4 bottom-0 h-72 w-72 rounded-full bg-secondary/5 blur-3xl" />
        </div>

        {/* Header Section - Matching Dashboard/Agents Style */}
        <div className="relative">
          <motion.div
            animate={{ opacity: 0.5 }}
            className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent"
            initial={{ opacity: 0 }}
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
                  <h1 className="animate-gradient-x bg-gradient-to-r from-primary via-accent to-primary bg-clip-text font-bold text-3xl text-transparent sm:text-4xl">
                    Referral Program
                  </h1>
                  <p className="mt-1 text-muted-foreground text-sm">
                    Earn rewards by sharing ANUBIS Chat with your network
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <motion.div
          animate="visible"
          className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
          initial="hidden"
          variants={containerVariants}
        >
          {/* User Stats Section - Above everything */}
          {(userReferralStats || canCreateReferral) && (
            <motion.div
              className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
              variants={containerVariants}
            >
              {/* Total Referrals */}
              <motion.div variants={itemVariants}>
                <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 dark:border-blue-800 dark:from-blue-950/20 dark:to-cyan-950/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-blue-600 text-sm dark:text-blue-400">
                          Total Referrals
                        </p>
                        <p className="font-bold text-2xl text-blue-700 dark:text-blue-300">
                          {userReferralStats?.totalReferrals || 0}
                        </p>
                      </div>
                      <Users className="h-8 w-8 text-blue-500 opacity-50 dark:text-blue-400" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Total Earnings */}
              <motion.div variants={itemVariants}>
                <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:border-green-800 dark:from-green-950/20 dark:to-emerald-950/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-green-600 text-sm dark:text-green-400">
                          Total Earnings
                        </p>
                        <p className="font-bold text-2xl text-green-700 dark:text-green-300">
                          {(userReferralStats?.totalEarnings || 0).toFixed(4)}{' '}
                          SOL
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-500 opacity-50 dark:text-green-400" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Commission Rate */}
              <motion.div variants={itemVariants}>
                <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:border-purple-800 dark:from-purple-950/20 dark:to-pink-950/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-purple-600 text-sm dark:text-purple-400">
                          Commission Rate
                        </p>
                        <p className="font-bold text-2xl text-purple-700 dark:text-purple-300">
                          {(
                            (userReferralStats?.currentCommissionRate || 0.03) *
                            100
                          ).toFixed(0)}
                          %
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-purple-500 opacity-50 dark:text-purple-400" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Current Tier */}
              <motion.div variants={itemVariants}>
                <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-red-50 dark:border-orange-800 dark:from-orange-950/20 dark:to-red-950/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-orange-600 text-sm dark:text-orange-400">
                          Current Tier
                        </p>
                        <p className="font-bold text-2xl text-orange-700 dark:text-orange-300">
                          Tier {userReferralStats?.tier || 1}
                        </p>
                      </div>
                      <Trophy className="h-8 w-8 text-orange-500 opacity-50 dark:text-orange-400" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}

          {/* Main Content Grid - 2x2 Layout */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Left Column - Your Referral Setup */}
            <motion.div className="space-y-6" variants={itemVariants}>
              {/* Referral Code Section */}
              <motion.div
                animate={{ scale: 1, opacity: 1 }}
                initial={{ scale: 0.9, opacity: 0 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-primary" />
                      Your Referral Code
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {canCreateReferral ? (
                      userReferralCode ? (
                        <ReferralCodeDisplay
                          onCopy={copyToClipboard}
                          referralCode={userReferralCode}
                          stats={userReferralStats ?? undefined}
                        />
                      ) : (
                        <CreateReferralCode
                          customCode={customCode}
                          onCreateCode={handleCreateReferralCode}
                          onCustomCodeChange={setCustomCode}
                        />
                      )
                    ) : (
                      <ReferralUpgradePrompt
                        currentTier={currentTier}
                        onUpgrade={() => {
                          window.location.href = '/subscription';
                        }}
                      />
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Your Referrer / Add Referrer */}
              {referrerInfo?.hasReferrer ? (
                <motion.div
                  animate={{ scale: 1, opacity: 1 }}
                  initial={{ scale: 0.9, opacity: 0 }}
                  transition={{ delay: 0.4, type: 'spring', stiffness: 100 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-green-600" />
                        Your Referrer
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            alt={referrerInfo.referrerDisplayName}
                            src={referrerInfo.referrerAvatar}
                          />
                          <AvatarFallback>
                            {(referrerInfo.referrerDisplayName || 'R')
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {referrerInfo.referrerDisplayName}
                          </div>
                          <div className="font-mono text-muted-foreground text-sm">
                            {referrerInfo.referralCode}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : claimStatus?.canClaim && claimStatus.timeRemaining ? (
                <motion.div
                  animate={{ scale: 1, opacity: 1 }}
                  initial={{ scale: 0.9, opacity: 0 }}
                  transition={{ delay: 0.4, type: 'spring', stiffness: 100 }}
                >
                  <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-amber-600" />
                          Add Your Referrer
                        </CardTitle>
                        <span className="font-medium text-amber-600 text-sm">
                          {formatTimeCompact(claimStatus.timeRemaining)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-muted-foreground text-sm">
                        Credit your referrer to help them earn commissions on
                        your payments.
                      </p>
                      <div className="flex gap-2">
                        <Input
                          className="font-mono"
                          maxLength={12}
                          onChange={(e) =>
                            setClaimCode(e.target.value.toUpperCase())
                          }
                          placeholder="Enter referral code"
                          value={claimCode}
                        />
                        <Button onClick={handleClaimReferral} size="sm">
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : null}
            </motion.div>

            {/* Right Column - Two Row Layout */}
            <motion.div
              className="grid grid-rows-2 gap-6"
              variants={itemVariants}
            >
              {/* Top Row - My Referrals & Commission Structure */}
              <motion.div
                animate={{ scale: 1, opacity: 1 }}
                initial={{ scale: 0.9, opacity: 0 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
              >
                <Card className="h-full">
                  <Tabs
                    className="flex h-full flex-col"
                    defaultValue="my-referrals"
                  >
                    <CardHeader className="pb-3">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger
                          className="flex items-center gap-2"
                          value="my-referrals"
                        >
                          <Users className="h-4 w-4" />
                          My Network
                          {referredUsers && referredUsers.totalCount > 0 && (
                            <span className="ml-1 rounded-full bg-primary/20 px-1.5 py-0.5 text-xs">
                              {referredUsers.totalCount}
                            </span>
                          )}
                        </TabsTrigger>
                        <TabsTrigger
                          className="flex items-center gap-2"
                          value="commission-structure"
                        >
                          <TrendingUp className="h-4 w-4" />
                          Commission Rates
                        </TabsTrigger>
                      </TabsList>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-hidden">
                      <TabsContent
                        className="h-full overflow-y-auto"
                        value="my-referrals"
                      >
                        {referredUsers ? (
                          <MyReferralsDisplay
                            referredUsers={referredUsers.referredUsers.map(
                              (u: {
                                userId: string;
                                displayName: string;
                                avatar?: string;
                                walletAddress?: string;
                                referredAt?: number;
                                subscriptionTier: string;
                                totalPayments: number;
                                totalCommissionsEarned: number;
                                lastActiveAt?: number;
                                isActive: boolean;
                              }) => ({
                                userId: u.userId,
                                displayName: u.displayName,
                                avatar: u.avatar,
                                referredAt: u.referredAt ?? Date.now(),
                                totalCommissionsEarned:
                                  u.totalCommissionsEarned,
                                isActive: u.isActive,
                                subscriptionTier: u.subscriptionTier as
                                  | 'admin'
                                  | 'free'
                                  | 'pro'
                                  | 'pro_plus'
                                  | undefined,
                              })
                            )}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-muted-foreground">
                            <div className="text-center">
                              <Users className="mx-auto mb-4 h-12 w-12 opacity-50" />
                              <p>Loading your referrals...</p>
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent
                        className="h-full overflow-y-auto"
                        value="commission-structure"
                      >
                        <div className="space-y-4">
                          <div className="mb-6 text-center">
                            <p className="text-muted-foreground text-sm">
                              Earn higher rates as you refer more users
                            </p>
                          </div>
                          <CompactTierDisplay
                            currentTier={
                              userReferralStats?.tierInfo?.currentTier
                            }
                          />
                        </div>
                      </TabsContent>
                    </CardContent>
                  </Tabs>
                </Card>
              </motion.div>

              {/* Bottom Row - Referral Stats or Additional Info */}
              <motion.div
                animate={{ scale: 1, opacity: 1 }}
                initial={{ scale: 0.9, opacity: 0 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 100 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      Your Performance
                    </CardTitle>
                    <p className="text-muted-foreground text-sm">
                      Track your referral progress and earnings
                    </p>
                  </CardHeader>
                  <CardContent>
                    {userReferralStats ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg bg-muted/30 p-4 text-center">
                          <div className="font-bold text-2xl text-primary">
                            {userReferralStats.totalReferrals || 0}
                          </div>
                          <p className="text-muted-foreground text-sm">
                            Total Referrals
                          </p>
                        </div>
                        <div className="rounded-lg bg-muted/30 p-4 text-center">
                          <div className="font-bold text-2xl text-green-600">
                            {(userReferralStats.totalEarnings || 0).toFixed(4)}{' '}
                            SOL
                          </div>
                          <p className="text-muted-foreground text-sm">
                            Total Earned
                          </p>
                        </div>
                        <div className="rounded-lg bg-muted/30 p-4 text-center">
                          <div className="font-bold text-2xl text-blue-600">
                            {(
                              (userReferralStats.currentCommissionRate || 0) *
                              100
                            ).toFixed(1)}
                            %
                          </div>
                          <p className="text-muted-foreground text-sm">
                            Current Rate
                          </p>
                        </div>
                        <div className="rounded-lg bg-muted/30 p-4 text-center">
                          <div className="font-bold text-2xl text-purple-600">
                            Tier {userReferralStats.tierInfo?.currentTier || 1}
                          </div>
                          <p className="text-muted-foreground text-sm">
                            Current Tier
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <Star className="mx-auto mb-4 h-12 w-12 opacity-50" />
                        <p className="text-muted-foreground">
                          No referral stats available yet
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Component for displaying existing referral code and stats
type ReferralStats = {
  currentCommissionRate?: number;
  totalReferrals?: number;
  tierInfo?: {
    currentTier: number;
    referralsToNext: number;
    currentRate: number;
    nextRate: number;
    isMaxTier: boolean;
  };
  totalEarnings?: number;
};

type ReferralCodeData = { code: string };

function ReferralCodeDisplay({
  referralCode,
  stats,
  onCopy,
}: {
  referralCode: ReferralCodeData;
  stats: ReferralStats | undefined;
  onCopy: (text: string) => void;
}) {
  const { toast } = useToast();
  const referralLink = `https://anubis.chat?ref=${referralCode.code}`;

  const shareOnTwitter = () => {
    const text = `Join me on ANUBIS Chat! 🚀 Use my referral code ${referralCode.code} for exclusive benefits. AI-powered chat with blockchain integration.`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`;
    window.open(url, '_blank');
    toast({
      title: 'Opening Twitter',
      description: 'Share your referral link with your followers!',
    });
  };

  const shareOnDiscord = () => {
    const text = `🎉 **Join ANUBIS Chat!**\n\nUse my referral code: **${referralCode.code}**\nLink: ${referralLink}\n\nGet access to cutting-edge AI chat with Web3 integration!`;
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied for Discord!',
      description: 'Message copied. Paste it in any Discord channel.',
    });
  };

  const shareOnTelegram = () => {
    const text = `Join ANUBIS Chat! 🚀\n\nUse my referral code: ${referralCode.code}\n\nAI-powered chat with blockchain integration.`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    toast({
      title: 'Opening Telegram',
      description: 'Share your referral link with your contacts!',
    });
  };

  return (
    <div className="space-y-4">
      {/* Current Stats */}
      <div className="rounded-lg border p-3">
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <div className="font-semibold text-xl">
              {stats?.currentCommissionRate
                ? (stats.currentCommissionRate * 100).toFixed(1)
                : '3.0'}
              %
            </div>
            <div className="text-muted-foreground text-xs">Current Rate</div>
          </div>
          <div>
            <div className="font-semibold text-xl">
              {stats?.totalReferrals || 0}
            </div>
            <div className="text-muted-foreground text-xs">Total Referrals</div>
          </div>
        </div>
      </div>

      {/* Tier Progress */}
      {stats?.tierInfo && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span>Tier {stats.tierInfo.currentTier + 1} Progress</span>
            <span>{stats.tierInfo.referralsToNext} to next tier</span>
          </div>
          <Progress
            className="h-1.5"
            value={((stats?.totalReferrals ?? 0) % 5) * 20}
          />
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>{(stats.tierInfo.currentRate * 100).toFixed(1)}%</span>
            <span>
              {stats.tierInfo.isMaxTier
                ? 'Max'
                : `${(stats.tierInfo.nextRate * 100).toFixed(1)}%`}
            </span>
          </div>
        </div>
      )}

      {/* Referral Code */}
      <div className="space-y-1.5">
        <Label>Your Referral Code</Label>
        <div className="flex gap-2">
          <Input className="font-mono" readOnly value={referralCode.code} />
          <Button
            onClick={() => onCopy(referralCode.code)}
            size="icon"
            type="button"
            variant="outline"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Referral Link */}
      <div className="space-y-1.5">
        <Label>Referral Link</Label>
        <div className="flex gap-2">
          <Input className="text-sm" readOnly value={referralLink} />
          <Button
            onClick={() => onCopy(referralLink)}
            size="icon"
            type="button"
            variant="outline"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Earnings */}
      <div className="rounded-lg border p-3 text-center">
        <div className="font-semibold text-xl">
          {stats?.totalEarnings?.toFixed(4) || '0.0000'} SOL
        </div>
        <div className="text-muted-foreground text-xs">Total Earnings</div>
      </div>

      {/* Share Buttons */}
      <div className="space-y-2">
        <Label className="text-xs">Share Your Referral</Label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            className="flex items-center gap-1.5"
            onClick={shareOnTwitter}
            size="sm"
            variant="outline"
          >
            <svg
              aria-labelledby="x-logo-title"
              className="h-3.5 w-3.5"
              fill="currentColor"
              role="img"
              viewBox="0 0 24 24"
            >
              <title id="x-logo-title">Share to X</title>
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span className="hidden sm:inline">X</span>
          </Button>
          <Button
            className="flex items-center gap-1.5"
            onClick={shareOnDiscord}
            size="sm"
            variant="outline"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Discord</span>
          </Button>
          <Button
            className="flex items-center gap-1.5"
            onClick={shareOnTelegram}
            size="sm"
            variant="outline"
          >
            <Send className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Telegram</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

// Component for creating new referral code
function CreateReferralCode({
  customCode,
  onCustomCodeChange,
  onCreateCode,
}: {
  customCode: string;
  onCustomCodeChange: (code: string) => void;
  onCreateCode: () => void;
}) {
  const validation = validateReferralCodeFormat(customCode);
  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-blue-50 p-4 dark:bg-blue-900/20">
        <p className="text-blue-800 text-sm">
          🎉 As a Pro+ member, you can create your own referral code and start
          earning commissions!
        </p>
      </div>

      <div className="space-y-2">
        <Label>Custom Code (Optional)</Label>
        <Input
          maxLength={12}
          onChange={(e) =>
            onCustomCodeChange(sanitizeCustomCodeInput(e.target.value))
          }
          placeholder="Enter custom code or leave blank for auto-generated"
          type="text"
          value={customCode}
        />
        {customCode ? (
          validation.valid ? (
            <p className="text-emerald-600 text-xs dark:text-emerald-400">
              Looks good.
            </p>
          ) : (
            <p className="text-destructive text-xs">{validation.error}</p>
          )
        ) : (
          <p className="text-muted-foreground text-xs">
            4-12 characters, letters and numbers only. Leave blank for
            auto-generated code.
          </p>
        )}
      </div>

      <Button
        className="w-full"
        disabled={!!customCode && !validation.valid}
        onClick={onCreateCode}
      >
        Create Referral Code
      </Button>
    </div>
  );
}

// Component for upgrade prompt (Free/Pro users)
function ReferralUpgradePrompt({
  currentTier,
  onUpgrade,
}: {
  currentTier: string;
  onUpgrade: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-yellow-50 p-4 text-center">
        <Crown className="mx-auto mb-2 h-8 w-8 text-yellow-600" />
        <h3 className="font-semibold text-yellow-800">Pro+ Required</h3>
        <p className="mt-1 text-sm text-yellow-700">
          Create referral codes and earn up to 5% commission on every referral
          payment!
        </p>
      </div>

      <div className="space-y-4 text-center">
        <Button
          className="w-full cursor-not-allowed opacity-50"
          disabled
          variant="outline"
        >
          Create Referral Code (Pro+ Only)
        </Button>

        <Button className="w-full" onClick={onUpgrade}>
          Upgrade to Pro+ → Start Earning
        </Button>

        <div className="text-muted-foreground text-xs">
          Current plan:{' '}
          {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}
        </div>
      </div>
    </div>
  );
}

// Component for leaderboard display

// Compact tier display with interactive hover states
function CompactTierDisplay({ currentTier }: { currentTier?: number }) {
  const [hoveredTier, setHoveredTier] = useState<number | null>(null);

  const tiers = [
    { min: 1, max: 4, rate: 3.0, label: '1-4' },
    { min: 5, max: 9, rate: 3.2, label: '5-9' },
    { min: 10, max: 14, rate: 3.4, label: '10-14' },
    { min: 15, max: 19, rate: 3.6, label: '15-19' },
    { min: 20, max: 24, rate: 3.8, label: '20-24' },
    { min: 25, max: 29, rate: 4.0, label: '25-29' },
    { min: 30, max: 34, rate: 4.2, label: '30-34' },
    { min: 35, max: 39, rate: 4.4, label: '35-39' },
    { min: 40, max: 44, rate: 4.6, label: '40-44' },
    { min: 45, max: 49, rate: 4.8, label: '45-49' },
    { min: 50, max: null, rate: 5.0, label: '50+' },
  ];

  return (
    <div className="space-y-3">
      {/* Current Tier Progress Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <div className="mb-1 flex justify-between text-muted-foreground text-xs">
            <span>
              Current Tier: {currentTier !== undefined ? currentTier + 1 : 1}
            </span>
            <span>
              {currentTier !== undefined && currentTier < 10
                ? `Next: Tier ${currentTier + 2}`
                : 'Max Tier'}
            </span>
          </div>
          <Progress
            className="h-2"
            value={
              currentTier !== undefined ? ((currentTier + 1) / 11) * 100 : 0
            }
          />
        </div>
      </div>

      {/* Tier Grid - Responsive */}
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-6">
        {tiers.map((tier, index) => (
          <button
            aria-label={`Tier ${index + 1}: ${tier.label} referrals, ${tier.rate}% commission`}
            className={cn(
              'relative cursor-pointer rounded-md border p-1.5 text-center transition-all sm:p-2',
              currentTier === index
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background hover:bg-muted',
              hoveredTier === index && 'ring-2 ring-primary/50'
            )}
            key={`${tier.label}-${tier.rate}`}
            onBlur={() => setHoveredTier(null)}
            onFocus={() => setHoveredTier(index)}
            onMouseEnter={() => setHoveredTier(index)}
            onMouseLeave={() => setHoveredTier(null)}
            type="button"
          >
            <div className="font-bold text-[11px] sm:text-xs">{tier.rate}%</div>
            <div className="text-[9px] opacity-80 sm:text-[10px]">
              {tier.label}
            </div>
            {tier.max === null && (
              <Crown className="mx-auto mt-0.5 h-2.5 w-2.5 text-yellow-500 sm:mt-1 sm:h-3 sm:w-3" />
            )}

            {hoveredTier === index && (
              <div className="-translate-x-1/2 absolute bottom-full left-1/2 z-10 mb-2 transform whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-popover-foreground shadow-lg">
                <div className="text-xs">
                  <div className="font-semibold">Tier {index + 1}</div>
                  <div>{tier.label} referrals</div>
                  <div className="text-green-600 dark:text-green-400">
                    {tier.rate}% commission
                  </div>
                </div>
                <div className="-translate-x-1/2 -mt-px absolute top-full left-1/2 transform">
                  <div className="border-4 border-transparent border-t-popover" />
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="flex justify-between border-t pt-2 text-muted-foreground text-xs">
        <span>Base: 3.0%</span>
        <span>Max: 5.0%</span>
        <span>+0.2% per 5 referrals</span>
      </div>
    </div>
  );
}

// Component for displaying user's referred users
type ReferredUser = {
  userId: string;
  displayName: string;
  avatar?: string;
  referredAt?: number;
  totalCommissionsEarned: number;
  isActive: boolean;
  subscriptionTier?: 'free' | 'pro' | 'pro_plus' | 'admin';
};

function MyReferralsDisplay({
  referredUsers,
}: {
  referredUsers: ReferredUser[];
}) {
  const formatDate = (timestamp?: number) => {
    if (!timestamp && timestamp !== 0) {
      return 'Unknown';
    }
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-2">
      {referredUsers.map((user) => (
        <div
          className="flex items-center justify-between rounded-lg border p-2.5 transition-colors hover:bg-muted/50"
          key={user.userId}
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage alt={user.displayName} src={user.avatar} />
              <AvatarFallback className="text-xs">
                {user.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-sm">{user.displayName}</div>
              <div className="text-muted-foreground text-xs">
                Joined {formatDate(user.referredAt)}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold text-sm">
              {user.totalCommissionsEarned.toFixed(4)} SOL
            </div>
            <div className="text-muted-foreground text-xs">
              {user.isActive ? (
                <span className="text-green-600 dark:text-green-400">
                  {user.subscriptionTier === 'pro_plus' ? 'Pro+' : 'Pro'}
                </span>
              ) : (
                <span>Free</span>
              )}
            </div>
          </div>
        </div>
      ))}

      {referredUsers.length === 0 && (
        <div className="py-4 text-center text-muted-foreground text-sm">
          No referrals yet. Share your code to start earning!
        </div>
      )}
    </div>
  );
}
