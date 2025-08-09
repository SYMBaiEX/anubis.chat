'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LandingHeader from '@/components/landing/landing-header';
import { useAuthContext } from '@/components/providers/auth-provider';
import Hero from './(landing)/components/hero';
import Features from './(landing)/components/features';
import HowItWorks from './(landing)/components/how-it-works';
import Security from './(landing)/components/security';
import Models from './(landing)/components/models';
import Pricing from './(landing)/components/pricing';
import Testimonials from './(landing)/components/testimonials';
import FAQ from './(landing)/components/faq';
import CTA from './(landing)/components/cta';

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


