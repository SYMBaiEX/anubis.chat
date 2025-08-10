'use client';

import { KeySquare, Lock, Shield } from 'lucide-react';
import React, { memo } from 'react';
import AnimatedSection from '@/components/landing/animated-section';
import { Card } from '@/components/ui/card';

function Security() {
  return (
    <AnimatedSection
      allowOverlap
      auroraVariant="gold"
      className="py-20 md:py-28 lg:py-32"
      data-bg-variant="gold"
      dustIntensity="low"
      includeHieroglyphs={false}
      includeRosetta={false}
      softEdges
    >
      <div className="container mx-auto grid items-stretch gap-8 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
        <div className="self-center">
          <h2 className="mb-4 font-bold text-3xl md:text-5xl">
            <span className="bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text text-transparent">
              Security and Privacy by Default
            </span>
          </h2>
          <p className="mb-6 text-muted-foreground">
            Wallet signatures authenticate every critical action. Messages are
            sanitized and validated. Access is scoped to your public key.
          </p>
          <ul className="space-y-3 text-muted-foreground text-sm">
            <li className="inline-flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" /> Signature‑gated
              actions
            </li>
            <li className="inline-flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" /> Rate limiting & input
              validation
            </li>
            <li className="inline-flex items-center gap-2">
              <KeySquare className="h-4 w-4 text-primary" /> Wallet‑scoped data
              isolation
            </li>
          </ul>
        </div>
        <div
          aria-label="Security panel"
          className="relative overflow-hidden rounded-2xl p-8 ring-1 ring-border/40"
        >
          <div aria-hidden className="pointer-events-none absolute inset-0" />
          <div className="relative grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg p-4 ring-1 ring-border/40">
              <h3 className="mb-1 font-semibold">JWT + Convex</h3>
              <p className="text-muted-foreground text-sm">
                Edge‑secure sessions with reactive data.
              </p>
            </div>
            <div className="rounded-lg p-4 ring-1 ring-border/40">
              <h3 className="mb-1 font-semibold">Sanitized Inputs</h3>
              <p className="text-muted-foreground text-sm">
                XSS‑safe chat and uploads by default.
              </p>
            </div>
            <div className="rounded-lg p-4 ring-1 ring-border/40">
              <h3 className="mb-1 font-semibold">Rate Limits</h3>
              <p className="text-muted-foreground text-sm">
                Protection against abuse and spam.
              </p>
            </div>
            <div className="rounded-lg p-4 ring-1 ring-border/40">
              <h3 className="mb-1 font-semibold">On‑chain Receipts</h3>
              <p className="text-muted-foreground text-sm">
                Subscription proof recorded on Solana.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}

export default memo(Security);
