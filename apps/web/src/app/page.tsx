'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LandingFooter from '@/components/landing/landing-footer';
import LandingHeader from '@/components/landing/landing-header';
import { useAuthContext } from '@/components/providers/auth-provider';
import CTA from './(landing)/components/cta';
import FAQ from './(landing)/components/faq';
import Features from './(landing)/components/features';
import Hero from './(landing)/components/hero';
import HowItWorks from './(landing)/components/howItWorks';
import Models from './(landing)/components/models';
import Pricing from './(landing)/components/pricing';
import ReferralProgram from './(landing)/components/referralProgram';
import Security from './(landing)/components/security';
import Testimonials from './(landing)/components/testimonials';

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthContext();

  useEffect(() => {
    if (isAuthenticated && user) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="w-full bg-gradient-to-b from-primary/5 dark:from-primary/10">
      <LandingHeader />
      <LandingFooter />
      <div className="pt-16 pb-10">
        <Hero />
        <Features />
        <HowItWorks />
        <Security />
        <Models />
        <Pricing />
        <ReferralProgram />
        <Testimonials />
        <FAQ />
        <CTA />
      </div>
    </div>
  );
}
