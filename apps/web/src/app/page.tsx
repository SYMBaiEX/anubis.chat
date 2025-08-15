'use client';

import LandingFooter from '@/components/landing/landingFooter';
import LandingHeader from '@/components/landing/landingHeader';
import CTA from './(landing)/components/cta';
import Features from './(landing)/components/features';
import Hero from './(landing)/components/hero';
import Pricing from './(landing)/components/pricing';
import SiteLinksSection from './(landing)/components/siteLinksSection';

export default function LandingPage() {
  return (
    <div className="w-full bg-background">
      <LandingHeader />
      <Hero />
      <Features />
      <Pricing />
      <CTA />
      <SiteLinksSection />
      <LandingFooter />
    </div>
  );
}
