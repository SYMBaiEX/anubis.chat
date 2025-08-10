'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import LandingHeader from '@/components/landing/landing-header';
import { useAuthContext } from '@/components/providers/auth-provider';
import CTA from './(landing)/components/cta';
import FAQ from './(landing)/components/faq';
import Features from './(landing)/components/features';
import Hero from './(landing)/components/hero';
import HowItWorks from './(landing)/components/how-it-works';
import Models from './(landing)/components/models';
import Pricing from './(landing)/components/pricing';
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
    <div className="bg-background">
      <LandingHeader />
      <Hero />
      <Features />
      <HowItWorks />
      <Security />
      <Models />
      <Pricing />
      <Testimonials />
      <FAQ />
      <CTA />
    </div>
  );
}
