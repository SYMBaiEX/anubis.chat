'use client';

import { api } from '@convex/_generated/api';
import { useQuery } from 'convex/react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import AnimatedSection from '@/components/landing/animated-section';
import LandingFooter from '@/components/landing/landing-footer';
import LandingHeader from '@/components/landing/landing-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function ReferralInfoPage() {
  const subscriptionStatus = useQuery(api.subscriptions.getSubscriptionStatus);
  const canCreateReferral = subscriptionStatus?.tier === 'pro_plus';
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  // Fetch real referral statistics
  const leaderboardData = useQuery(api.referrals.getEnhancedLeaderboard, {
    limit: 100,
  });
  const systemStats = leaderboardData?.systemStats;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />
      <LandingFooter />

      <main className="relative w-full flex-1 overflow-x-hidden bg-gradient-to-b from-background via-background/95 to-background pt-16 pb-10">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="-left-48 absolute top-48 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="-right-48 absolute top-96 h-96 w-96 rounded-full bg-orange-500/5 blur-3xl" />
          <div className="-translate-x-1/2 absolute bottom-48 left-1/2 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        </div>
        {/* Back to Home Link */}
        <AnimatedSection
          auroraVariant="primary"
          className="px-6 py-6"
          softEdges
        >
          <div className="mx-auto max-w-6xl">
            <Link
              className="group inline-flex items-center gap-2 text-muted-foreground text-sm transition-all hover:gap-3 hover:text-foreground"
              href="/"
            >
              <ArrowLeft className="group-hover:-translate-x-1 h-4 w-4 transition-transform" />
              Back to Home
            </Link>
          </div>
        </AnimatedSection>

        {/* Hero Section */}
        <AnimatedSection
          auroraVariant="gold"
          className="relative p-6 sm:p-8 md:p-12"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-50" />
          <div className="relative mx-auto max-w-4xl text-center">
            <div
              className={cn(
                'mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-gradient-to-r from-primary/10 to-orange-500/10 px-5 py-2 backdrop-blur-sm transition-all duration-700',
                mounted
                  ? 'translate-y-0 opacity-100'
                  : '-translate-y-4 opacity-0'
              )}
            >
              <Sparkles className="h-4 w-4 animate-pulse text-primary" />
              <span className="font-semibold text-primary text-sm uppercase tracking-wider">
                Pro+ Exclusive • Up to 5% Commission
              </span>
              <Sparkles className="h-4 w-4 animate-pulse text-primary" />
            </div>
            <h1
              className={cn(
                'mb-6 font-bold text-3xl transition-all delay-100 duration-700 sm:text-4xl md:text-5xl lg:text-6xl',
                mounted
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-4 opacity-0'
              )}
            >
              <span className="animate-gradient-x bg-gradient-to-r from-primary via-yellow-500 to-orange-500 bg-clip-text text-transparent">
                ANUBIS Referral Program
              </span>
            </h1>
            <p
              className={cn(
                'mx-auto mb-8 max-w-3xl text-lg text-muted-foreground transition-all delay-200 duration-700 sm:text-xl md:text-2xl',
                mounted
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-4 opacity-0'
              )}
            >
              Earn up to{' '}
              <span className="animate-pulse font-bold text-primary">
                5% commission
              </span>{' '}
              on every payment your referrals make —
              <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text font-semibold text-transparent">
                {' '}
                forever
              </span>
              .
            </p>

            {/* Stats Row - Real Data */}
            <div
              className={cn(
                'mb-8 flex flex-wrap justify-center gap-8 transition-all delay-300 duration-700',
                mounted
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-4 opacity-0'
              )}
            >
              {systemStats ? (
                <>
                  <div className="text-center">
                    <div className="font-bold text-3xl text-primary">
                      {systemStats.totalReferrers || 0}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      Active Referrers
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-3xl text-primary">
                      {systemStats.totalPayoutsSOL
                        ? `${systemStats.totalPayoutsSOL.toFixed(2)} SOL`
                        : '0 SOL'}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      Total Paid Out
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-3xl text-primary">
                      {systemStats.totalReferrals || 0}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      Total Referrals
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <div className="h-9 w-20 animate-pulse rounded bg-muted" />
                    <div className="mt-2 text-muted-foreground text-sm">
                      Active Referrers
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="h-9 w-24 animate-pulse rounded bg-muted" />
                    <div className="mt-2 text-muted-foreground text-sm">
                      Total Paid Out
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="h-9 w-20 animate-pulse rounded bg-muted" />
                    <div className="mt-2 text-muted-foreground text-sm">
                      Total Referrals
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              {canCreateReferral ? (
                <Link href="/referrals">
                  <Button
                    className="group relative w-full overflow-hidden sm:w-auto"
                    size="lg"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <Star className="mr-2 h-5 w-5 transition-transform group-hover:rotate-12" />
                    Go to Your Referrals
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/subscription">
                    <Button
                      className="group relative w-full overflow-hidden sm:w-auto"
                      size="lg"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                      <span className="relative">
                        Upgrade to Pro+ to Start Earning
                      </span>
                    </Button>
                  </Link>
                  <Link href="/referrals">
                    <Button
                      className="group w-full border-primary/20 backdrop-blur-sm hover:border-primary/40 sm:w-auto"
                      size="lg"
                      variant="outline"
                    >
                      View Referral Dashboard
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </AnimatedSection>

        {/* Key Features */}
        <div className="mx-auto max-w-6xl p-6 sm:p-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-bold text-3xl md:text-4xl">
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Why Choose ANUBIS?
              </span>
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              {systemStats && systemStats.averageCommissionRate > 0
                ? `Join our referral program with an average ${(systemStats.averageCommissionRate * 100).toFixed(1)}% commission rate`
                : 'Join our rewarding referral program in the AI space'}
            </p>
          </div>
          <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="group relative overflow-hidden border-primary/10 bg-gradient-to-br from-background to-background/50 backdrop-blur-sm transition-all hover:scale-105 hover:border-primary/30 hover:shadow-primary/10 hover:shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
              <CardHeader className="relative">
                <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg transition-transform group-hover:scale-110">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">Recurring Revenue</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-muted-foreground text-sm">
                  Earn commission on every payment your referrals make - monthly
                  subscriptions, upgrades, and additional purchases. Build a
                  passive income stream!
                </p>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-primary/10 bg-gradient-to-br from-background to-background/50 backdrop-blur-sm transition-all hover:scale-105 hover:border-primary/30 hover:shadow-primary/10 hover:shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-primary/5 opacity-0 transition-opacity group-hover:opacity-100" />
              <CardHeader className="relative">
                <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-primary shadow-lg transition-transform group-hover:scale-110">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">Auto-Scaling Rates</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-muted-foreground text-sm">
                  Start at 3% commission and automatically increase to 5% as you
                  refer more users. Every 5 referrals unlocks a higher tier!
                </p>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-primary/10 bg-gradient-to-br from-background to-background/50 backdrop-blur-sm transition-all hover:scale-105 hover:border-primary/30 hover:shadow-primary/10 hover:shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
              <CardHeader className="relative">
                <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 shadow-lg transition-transform group-hover:scale-110">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">Instant Payouts</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-muted-foreground text-sm">
                  Receive commissions directly to your Solana wallet during
                  payment processing. No waiting periods or minimum thresholds!
                </p>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-primary/10 bg-gradient-to-br from-background to-background/50 backdrop-blur-sm transition-all hover:scale-105 hover:border-primary/30 hover:shadow-primary/10 hover:shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
              <CardHeader className="relative">
                <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg transition-transform group-hover:scale-110">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">Pro+ Exclusive</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-muted-foreground text-sm">
                  Only Pro+ members can create referral codes and earn
                  commissions. Join the elite tier to unlock this benefit!
                </p>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-primary/10 bg-gradient-to-br from-background to-background/50 backdrop-blur-sm transition-all hover:scale-105 hover:border-primary/30 hover:shadow-primary/10 hover:shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
              <CardHeader className="relative">
                <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg transition-transform group-hover:scale-110">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">Fraud Protection</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-muted-foreground text-sm">
                  Advanced fraud detection ensures legitimate referrals. Rate
                  limiting and IP monitoring protect your earnings.
                </p>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-primary/10 bg-gradient-to-br from-background to-background/50 backdrop-blur-sm transition-all hover:scale-105 hover:border-primary/30 hover:shadow-primary/10 hover:shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
              <CardHeader className="relative">
                <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg transition-transform group-hover:scale-110">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">72-Hour Grace Period</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-muted-foreground text-sm">
                  New users have 72 hours to add their referrer if they didn't
                  use a link. Never miss out on deserved commissions!
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Commission Tiers */}
          <Card className="relative mb-12 overflow-hidden border-primary/20 bg-gradient-to-br from-background via-background/80 to-primary/5">
            <div className="-mr-4 -mt-4 absolute top-0 right-0 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
            <div className="-mb-4 -ml-4 absolute bottom-0 left-0 h-32 w-32 rounded-full bg-orange-500/10 blur-3xl" />
            <CardHeader className="relative">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5">
                <Trophy className="h-4 w-4 text-primary" />
                <span className="font-medium text-primary text-sm">
                  Progressive Rewards
                </span>
              </div>
              <CardTitle className="text-3xl">Commission Tier System</CardTitle>
              <p className="text-muted-foreground">
                Your commission rate increases automatically as you refer more
                users
              </p>
            </CardHeader>
            <CardContent className="relative">
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { tier: 1, referrals: '1-4', rate: '3.0%' },
                    { tier: 2, referrals: '5-9', rate: '3.2%' },
                    { tier: 3, referrals: '10-14', rate: '3.4%' },
                    { tier: 4, referrals: '15-19', rate: '3.6%' },
                    { tier: 5, referrals: '20-24', rate: '3.8%' },
                    { tier: 6, referrals: '25-29', rate: '4.0%' },
                    { tier: 7, referrals: '30-34', rate: '4.2%' },
                    { tier: 8, referrals: '35-39', rate: '4.4%' },
                    { tier: 9, referrals: '40-44', rate: '4.6%' },
                    { tier: 10, referrals: '45-49', rate: '4.8%' },
                    { tier: 11, referrals: '50+', rate: '5.0%', isMax: true },
                  ].map((tier, index) => (
                    <div
                      className={cn(
                        'group relative overflow-hidden rounded-xl border p-4 transition-all hover:scale-105',
                        tier.isMax
                          ? 'border-primary bg-gradient-to-br from-primary/10 to-orange-500/10 shadow-lg shadow-primary/20'
                          : 'border-border/40 bg-gradient-to-br from-background to-muted/30 hover:border-primary/40 hover:shadow-md'
                      )}
                      key={tier.tier}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {tier.isMax && (
                        <div className="absolute top-2 right-2">
                          <Star className="h-4 w-4 animate-pulse text-primary" />
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              Tier {tier.tier}
                            </span>
                            {tier.isMax && (
                              <span className="font-bold text-primary text-xs">
                                MAX
                              </span>
                            )}
                          </div>
                          <div className="text-muted-foreground text-sm">
                            {tier.referrals} referrals
                          </div>
                        </div>
                        <div className="relative">
                          <div className="font-bold text-2xl">
                            <span
                              className={cn(
                                tier.isMax
                                  ? 'bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent'
                                  : 'text-primary'
                              )}
                            >
                              {tier.rate}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-transparent to-orange-500/10 p-6">
                  <div className="absolute inset-0 bg-grid-white/5" />
                  <p className="relative text-center font-medium">
                    Commission increases by{' '}
                    <span className="text-primary">0.2%</span> every{' '}
                    <span className="text-primary">5 referrals</span>, up to a
                    maximum of{' '}
                    <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text font-bold text-transparent">
                      5%
                    </span>{' '}
                    at 50+ referrals
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card className="relative mb-12 overflow-hidden border-primary/20">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-orange-500/5" />
            <CardHeader className="relative">
              <CardTitle className="text-3xl">How It Works</CardTitle>
              <p className="text-muted-foreground">
                Your journey to passive income in 5 simple steps
              </p>
            </CardHeader>
            <CardContent className="relative">
              <div className="relative space-y-8">
                {/* Connecting line */}
                <div className="absolute top-8 bottom-8 left-5 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-transparent" />

                {[
                  {
                    step: 1,
                    title: 'Upgrade to Pro+',
                    description:
                      'Become a Pro+ member to unlock the ability to create referral codes and earn commissions.',
                    color: 'from-purple-500 to-pink-500',
                  },
                  {
                    step: 2,
                    title: 'Create Your Referral Code',
                    description:
                      'Generate a custom or auto-generated referral code from your dashboard.',
                    color: 'from-blue-500 to-cyan-500',
                  },
                  {
                    step: 3,
                    title: 'Share Your Link',
                    description:
                      'Share your unique referral link on social media, Discord, or directly with friends.',
                    color: 'from-green-500 to-emerald-500',
                  },
                  {
                    step: 4,
                    title: 'Track Your Referrals',
                    description:
                      'Monitor your referred users and commission earnings in real-time from your dashboard.',
                    color: 'from-yellow-500 to-orange-500',
                  },
                  {
                    step: 5,
                    title: 'Earn Forever',
                    description:
                      'Receive commissions on every payment your referrals make, including renewals and upgrades.',
                    color: 'from-primary to-orange-500',
                  },
                ].map((item, index) => (
                  <div
                    className="relative flex gap-4 transition-all hover:translate-x-1"
                    key={item.step}
                  >
                    <div
                      className={cn(
                        'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-lg transition-transform hover:scale-110',
                        item.color
                      )}
                    >
                      <span className="font-bold">{item.step}</span>
                      {index < 4 && (
                        <div className="-bottom-2 -translate-x-1/2 absolute left-1/2 h-4 w-0.5 bg-gradient-to-b from-white/20 to-transparent" />
                      )}
                    </div>
                    <div className="flex-1 rounded-lg p-4 transition-colors hover:bg-muted/50">
                      <h3 className="mb-1 font-semibold text-lg">
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card className="relative overflow-hidden border-primary/20">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
            <CardHeader className="relative">
              <CardTitle className="text-3xl">
                Frequently Asked Questions
              </CardTitle>
              <p className="text-muted-foreground">
                Everything you need to know about our referral program
              </p>
            </CardHeader>
            <CardContent className="relative">
              <div className="space-y-4">
                {[
                  {
                    question: 'Who can participate in the referral program?',
                    answer:
                      'Only Pro+ members can create referral codes and earn commissions. However, anyone can be referred and use a referral code.',
                  },
                  {
                    question: 'How do I receive my commissions?',
                    answer:
                      'Commissions are paid directly to your Solana wallet during the payment transaction. There are no waiting periods or minimum payout thresholds.',
                  },
                  {
                    question: 'Do I earn on recurring payments?',
                    answer:
                      'Yes! You earn commission on every payment your referrals make, including monthly renewals, plan upgrades, and additional purchases.',
                  },
                  {
                    question: 'Can referral codes be changed?',
                    answer:
                      "Once a user is referred by someone, this relationship is permanent and cannot be changed. New users have 72 hours to claim their referrer if they didn't use a link initially.",
                  },
                  {
                    question:
                      'Is there a limit to how many people I can refer?',
                    answer:
                      "No! There's no limit to how many users you can refer. The more you refer, the higher your commission rate becomes (up to 5%).",
                  },
                ].map((item, index) => (
                  <button
                    className="group w-full cursor-pointer rounded-xl border border-border/40 bg-gradient-to-br from-background to-muted/20 p-4 text-left transition-all hover:border-primary/40 hover:shadow-md"
                    key={item.question}
                    onClick={() =>
                      setExpandedFaq(expandedFaq === index ? null : index)
                    }
                    type="button"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="pr-4 font-semibold">{item.question}</h3>
                      <div className="shrink-0">
                        {expandedFaq === index ? (
                          <ChevronUp className="h-5 w-5 text-primary transition-transform" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform group-hover:text-primary" />
                        )}
                      </div>
                    </div>
                    <div
                      className={cn(
                        'grid transition-all',
                        expandedFaq === index
                          ? 'mt-3 grid-rows-[1fr]'
                          : 'grid-rows-[0fr]'
                      )}
                    >
                      <div className="overflow-hidden">
                        <p className="text-muted-foreground">{item.answer}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="mt-16 text-center">
            <div className="relative inline-block">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-3xl" />
              {canCreateReferral ? (
                <Link href="/referrals">
                  <Button className="group relative overflow-hidden" size="lg">
                    <span className="absolute inset-0 bg-gradient-to-r from-primary/20 via-orange-500/20 to-primary/20 opacity-0 transition-opacity group-hover:opacity-100" />
                    <Star className="mr-2 h-5 w-5 transition-transform group-hover:rotate-12" />
                    <span className="relative">Start Earning Now</span>
                  </Button>
                </Link>
              ) : (
                <Link href="/subscription">
                  <Button className="group relative overflow-hidden" size="lg">
                    <span className="absolute inset-0 bg-gradient-to-r from-primary/20 via-orange-500/20 to-primary/20 opacity-0 transition-opacity group-hover:opacity-100" />
                    <span className="relative">
                      Upgrade to Pro+ & Start Earning
                    </span>
                  </Button>
                </Link>
              )}
            </div>
            {systemStats && systemStats.totalReferrers > 0 && (
              <p className="mt-6 text-muted-foreground">
                Join{' '}
                <span className="font-bold text-lg text-primary">
                  {systemStats.totalReferrers}
                </span>{' '}
                active referrer{systemStats.totalReferrers !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
