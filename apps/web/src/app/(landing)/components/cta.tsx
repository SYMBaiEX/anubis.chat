'use client';

import React, { memo } from 'react';
import { Rocket, Wallet } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AnimatedSection from '@/components/landing/animated-section';

function CTA() {
  return (
    <AnimatedSection
      className="py-20 md:py-28 lg:py-32"
      auroraVariant="primary"
      includeRosetta={false}
      includeHieroglyphs={false}
      dustIntensity="medium"
      edgeMask
      allowOverlap
      softEdges
      data-bg-variant="primary"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="relative overflow-hidden bg-[radial-gradient(60%_60%_at_80%_20%,rgba(20,241,149,0.12)_0%,transparent_60%)] p-10">
          <div aria-hidden className="pointer-events-none absolute inset-0" />
          <div className="relative text-center">
            <h2 className="mb-3 font-bold text-3xl md:text-5xl">
              <span className="bg-gradient-to-r from-primary via-foreground to-accent bg-clip-text text-transparent">
                Ready to build with wallet‑native AI?
              </span>
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-muted-foreground">
              Join thousands of crypto‑native users and teams shipping faster with
              on‑chain intelligence.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/auth">
                <Button className="button-press h-12 min-w-[200px] gap-2" size="lg" type="button">
                  Connect Wallet
                  <Wallet className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/chat">
                <Button className="h-12 min-w-[200px] gap-2" size="lg" type="button" variant="outline">
                  Try Demo
                  <Rocket className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </AnimatedSection>
  );
}

export default memo(CTA);


