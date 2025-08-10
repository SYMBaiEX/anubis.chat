'use client';

import { Rocket, Wallet } from 'lucide-react';
import Link from 'next/link';
import React, { memo } from 'react';
import AnimatedSection from '@/components/landing/animated-section';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

function CTA() {
  return (
    <AnimatedSection
      allowOverlap
      auroraVariant="primary"
      className="py-20 md:py-28 lg:py-32"
      data-bg-variant="primary"
      dustIntensity="medium"
      edgeMask
      includeHieroglyphs={false}
      includeRosetta={false}
      softEdges
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl p-10 ring-1 ring-border/40">
          <div aria-hidden className="pointer-events-none absolute inset-0" />
          <div className="relative text-center">
            <h2 className="mb-3 font-bold text-3xl md:text-5xl">
              <span className="bg-gradient-to-r from-primary via-foreground to-accent bg-clip-text text-transparent">
                Ready to experience the future of AI chat?
              </span>
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-muted-foreground">
              Join the Web3 revolution with cutting-edge AI models and
              wallet-based authentication. Start chatting in seconds.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/auth">
                <Button
                  className="button-press h-12 min-w-[200px] gap-2"
                  size="lg"
                  type="button"
                >
                  Connect Wallet
                  <Wallet className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/chat">
                <Button
                  className="h-12 min-w-[200px] gap-2"
                  size="lg"
                  type="button"
                  variant="outline"
                >
                  Try Demo
                  <Rocket className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}

export default memo(CTA);
