'use client';

import { api } from '@convex/_generated/api';
import { useQuery } from 'convex/react';
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Shield,
  Star,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import LandingFooter from '@/components/landing/landing-footer';
import LandingHeader from '@/components/landing/landing-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReferralInfoPage() {
  const subscriptionStatus = useQuery(api.subscriptions.getSubscriptionStatus);
  const canCreateReferral = subscriptionStatus?.tier === 'pro_plus';

  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />
      <LandingFooter />

      <main className="w-full flex-1 pt-16 pb-10">
        {/* Back to Home Link */}
        <div className="w-full bg-gradient-to-b from-primary/5 to-transparent">
          <div className="mx-auto max-w-6xl px-6 py-4">
            <Link
              className="inline-flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
              href="/"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-b from-primary/10 to-background p-6 sm:p-8 md:p-12">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-4 font-bold text-3xl sm:text-4xl md:text-5xl">
              ANUBIS Referral Program
            </h1>
            <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
              Earn up to 5% commission on every payment your referrals make -
              forever!
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              {canCreateReferral ? (
                <Link href="/referrals">
                  <Button className="w-full sm:w-auto" size="lg">
                    <Star className="mr-2 h-5 w-5" />
                    Go to Your Referrals
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/subscription">
                    <Button className="w-full sm:w-auto" size="lg">
                      Upgrade to Pro+ to Start Earning
                    </Button>
                  </Link>
                  <Link href="/referrals">
                    <Button
                      className="w-full sm:w-auto"
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
        </div>

        {/* Key Features */}
        <div className="mx-auto max-w-6xl p-6 sm:p-8">
          <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Recurring Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Earn commission on every payment your referrals make - monthly
                  subscriptions, upgrades, and additional purchases. Build a
                  passive income stream!
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Auto-Scaling Rates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Start at 3% commission and automatically increase to 5% as you
                  refer more users. Every 5 referrals unlocks a higher tier!
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Instant Payouts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Receive commissions directly to your Solana wallet during
                  payment processing. No waiting periods or minimum thresholds!
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Pro+ Exclusive
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Only Pro+ members can create referral codes and earn
                  commissions. Join the elite tier to unlock this benefit!
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Fraud Protection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Advanced fraud detection ensures legitimate referrals. Rate
                  limiting and IP monitoring protect your earnings.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  72-Hour Grace Period
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  New users have 72 hours to add their referrer if they didn't
                  use a link. Never miss out on deserved commissions!
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Commission Tiers */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-2xl">Commission Tier System</CardTitle>
              <p className="text-muted-foreground text-sm">
                Your commission rate increases automatically as you refer more
                users
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
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
                  ].map((tier) => (
                    <div
                      className={`rounded-lg border p-4 ${
                        tier.isMax ? 'border-primary bg-primary/5' : ''
                      }`}
                      key={tier.tier}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">Tier {tier.tier}</div>
                          <div className="text-muted-foreground text-sm">
                            {tier.referrals} referrals
                          </div>
                        </div>
                        <div className="font-bold text-2xl text-primary">
                          {tier.rate}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg bg-muted p-4 text-center">
                  <p className="text-muted-foreground text-sm">
                    Commission increases by <strong>0.2%</strong> every{' '}
                    <strong>5 referrals</strong>, up to a maximum of{' '}
                    <strong>5%</strong> at 50+ referrals
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-2xl">How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  {
                    step: 1,
                    title: 'Upgrade to Pro+',
                    description:
                      'Become a Pro+ member to unlock the ability to create referral codes and earn commissions.',
                  },
                  {
                    step: 2,
                    title: 'Create Your Referral Code',
                    description:
                      'Generate a custom or auto-generated referral code from your dashboard.',
                  },
                  {
                    step: 3,
                    title: 'Share Your Link',
                    description:
                      'Share your unique referral link on social media, Discord, or directly with friends.',
                  },
                  {
                    step: 4,
                    title: 'Track Your Referrals',
                    description:
                      'Monitor your referred users and commission earnings in real-time from your dashboard.',
                  },
                  {
                    step: 5,
                    title: 'Earn Forever',
                    description:
                      'Receive commissions on every payment your referrals make, including renewals and upgrades.',
                  },
                ].map((item, index) => (
                  <div className="flex gap-4" key={item.step}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <h3 className="mb-1 font-semibold">{item.title}</h3>
                      <p className="text-muted-foreground text-sm">
                        {item.description}
                      </p>
                    </div>
                    {index < 4 && (
                      <ChevronRight className="mt-2 h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="mb-2 font-semibold">
                    Who can participate in the referral program?
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Only Pro+ members can create referral codes and earn
                    commissions. However, anyone can be referred and use a
                    referral code.
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold">
                    How do I receive my commissions?
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Commissions are paid directly to your Solana wallet during
                    the payment transaction. There are no waiting periods or
                    minimum payout thresholds.
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold">
                    Do I earn on recurring payments?
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Yes! You earn commission on every payment your referrals
                    make, including monthly renewals, plan upgrades, and
                    additional purchases.
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold">
                    Can referral codes be changed?
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Once a user is referred by someone, this relationship is
                    permanent and cannot be changed. New users have 72 hours to
                    claim their referrer if they didn't use a link initially.
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold">
                    Is there a limit to how many people I can refer?
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    No! There's no limit to how many users you can refer. The
                    more you refer, the higher your commission rate becomes (up
                    to 5%).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="mt-12 text-center">
            {canCreateReferral ? (
              <Link href="/referrals">
                <Button size="lg">
                  <Star className="mr-2 h-5 w-5" />
                  Start Earning Now
                </Button>
              </Link>
            ) : (
              <Link href="/subscription">
                <Button size="lg">Upgrade to Pro+ & Start Earning</Button>
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
