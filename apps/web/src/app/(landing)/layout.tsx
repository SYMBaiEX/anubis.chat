'use client';

import LandingFooter from '@/components/landing/landing-footer';
import LandingHeader from '@/components/landing/landing-header';
import { Lightning } from '@/components/ui/heroOdyssey';

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 z-0">
        <Lightning />
      </div>
      <div className="relative z-10">
        <LandingHeader />
        {children}
        <LandingFooter />
      </div>
    </div>
  );
}
