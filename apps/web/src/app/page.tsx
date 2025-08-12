'use client';

import LandingFooter from '@/components/landing/landing-footer';
import LandingHeader from '@/components/landing/landing-header';
import CTA from './(landing)/components/cta';
import FAQ from './(landing)/components/faq';
import Features from './(landing)/components/features';
import Hero from './(landing)/components/hero';
import HowItWorks from './(landing)/components/howItWorks';
import Models from './(landing)/components/models';
import Pricing from './(landing)/components/pricing';
import ReferralProgram from './(landing)/components/referralProgram';
import SiteLinksSection from './(landing)/components/SiteLinksSection';
import Security from './(landing)/components/security';
import Testimonials from './(landing)/components/testimonials';

export default function LandingPage() {
  return (
    <div className="w-full">
      <LandingHeader />
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
      <SiteLinksSection />
      <LandingFooter />
    </div>
  );
}
