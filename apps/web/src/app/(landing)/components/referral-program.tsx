'use client';

import { DollarSign, TrendingUp, Users, Zap } from 'lucide-react';
import Link from 'next/link';
import React, { memo } from 'react';
import AnimatedSection from '@/components/landing/animated-section';
import { Button } from '@/components/ui/button';

const referralFeatures = [
  {
    icon: DollarSign,
    title: 'Earn 3-5% Commission',
    description:
      'Start at 3% and automatically scale up to 5% as you refer more users.',
    gradient: 'from-green-400 to-emerald-400',
  },
  {
    icon: TrendingUp,
    title: 'Recurring Revenue',
    description:
      'Earn on every payment your referrals make - monthly subscriptions and upgrades.',
    gradient: 'from-blue-400 to-primary',
  },
  {
    icon: Zap,
    title: 'Instant Payouts',
    description:
      'Receive commissions directly to your Solana wallet with no waiting periods.',
    gradient: 'from-yellow-400 to-orange-400',
  },
  {
    icon: Users,
    title: 'Pro+ Exclusive',
    description: 'Unlock referral earnings by upgrading to our Pro+ tier.',
    gradient: 'from-purple-400 to-pink-400',
  },
];

function ReferralProgram() {
  return (
    <AnimatedSection
      allowOverlap
      auroraVariant="gold"
      className="py-20 md:py-28 lg:py-32"
      data-bg-variant="accent"
      dustIntensity="low"
      id="referral-program"
      includeHieroglyphs={false}
      includeRosetta={false}
      softEdges
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h2 className="mb-3 font-bold text-3xl md:text-5xl">
            <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-primary bg-clip-text text-transparent">
              Earn with ANUBIS Referral Program
            </span>
          </h2>
          <p className="mb-6 text-muted-foreground">
            Join our referral program and earn up to 5% commission on every
            payment your referrals make - forever!
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/referral-info">
              <Button size="lg" variant="default">
                Learn More About Referrals
              </Button>
            </Link>
            <Link href="/subscription">
              <Button size="lg" variant="outline">
                Upgrade to Pro+ to Start Earning
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {referralFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                className="group hover:-translate-y-0.5 relative rounded-xl p-6 ring-1 ring-border/40 transition-transform"
                key={feature.title}
              >
                <div
                  aria-hidden
                  className={`-z-10 absolute inset-0 rounded-xl bg-gradient-to-br opacity-0 blur-2xl transition-opacity group-hover:opacity-20 ${feature.gradient}`}
                />
                <div className="relative">
                  <div
                    className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${feature.gradient} shadow-md`}
                  >
                    <Icon aria-hidden className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mb-1 font-semibold text-lg">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center rounded-full bg-primary/10 px-6 py-3">
            <Users className="mr-2 h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">
              Join hundreds of referrers earning passive income
            </span>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}

export default memo(ReferralProgram);
