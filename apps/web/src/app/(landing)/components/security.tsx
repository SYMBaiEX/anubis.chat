'use client';

import React, { memo } from 'react';
import { Shield, Lock, KeySquare } from 'lucide-react';
import { Card } from '@/components/ui/card';
import AnimatedSection from '@/components/landing/animated-section';

function Security() {
  return (
    <AnimatedSection
      className="py-20 md:py-28 lg:py-32"
      auroraVariant="gold"
      includeRosetta={false}
      includeHieroglyphs={false}
      dustIntensity="low"
      allowOverlap
      softEdges
      data-bg-variant="gold"
    >
      <div className="container mx-auto grid items-stretch gap-8 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
        <div className="self-center">
          <h2 className="mb-4 font-bold text-3xl md:text-5xl">
            <span className="bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text text-transparent">
              Security and Privacy by Default
            </span>
          </h2>
          <p className="mb-6 text-muted-foreground">
            Wallet signatures authenticate every critical action. Messages are sanitized and
            validated. Access is scoped to your public key.
          </p>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="inline-flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Signature‑gated actions</li>
            <li className="inline-flex items-center gap-2"><Lock className="h-4 w-4 text-primary" /> Rate limiting & input validation</li>
            <li className="inline-flex items-center gap-2"><KeySquare className="h-4 w-4 text-primary" /> Wallet‑scoped data isolation</li>
          </ul>
        </div>
        <Card aria-label="Security panel" className="relative overflow-hidden bg-[radial-gradient(60%_60%_at_30%_20%,rgba(20,241,149,0.08)_0%,transparent_60%)] p-8">
          <div aria-hidden className="pointer-events-none absolute inset-0" />
          <div className="relative grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_70%)] p-4">
              <h3 className="mb-1 font-semibold">JWT + Convex</h3>
              <p className="text-sm text-muted-foreground">Edge‑secure sessions with reactive data.</p>
            </div>
            <div className="rounded-lg bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_70%)] p-4">
              <h3 className="mb-1 font-semibold">Sanitized Inputs</h3>
              <p className="text-sm text-muted-foreground">XSS‑safe chat and uploads by default.</p>
            </div>
            <div className="rounded-lg bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_70%)] p-4">
              <h3 className="mb-1 font-semibold">Rate Limits</h3>
              <p className="text-sm text-muted-foreground">Protection against abuse and spam.</p>
            </div>
            <div className="rounded-lg bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_70%)] p-4">
              <h3 className="mb-1 font-semibold">On‑chain Receipts</h3>
              <p className="text-sm text-muted-foreground">Subscription proof recorded on Solana.</p>
            </div>
          </div>
        </Card>
      </div>
    </AnimatedSection>
  );
}

export default memo(Security);


