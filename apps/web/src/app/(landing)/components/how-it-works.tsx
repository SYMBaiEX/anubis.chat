'use client';

import React, { memo } from 'react';
import { Check, Upload, Wallet, MessagesSquare, Rocket } from 'lucide-react';
import { Card } from '@/components/ui/card';
import AnimatedSection from '@/components/landing/animated-section';

const steps = [
  {
    icon: Wallet,
    title: 'Connect Wallet',
    text: 'Authenticate with Phantom, Backpack, or your preferred Solana wallet.',
  },
  {
    icon: Upload,
    title: 'Add Knowledge',
    text: 'Upload docs, notes, or URLs. We embed and index your knowledge.',
  },
  {
    icon: MessagesSquare,
    title: 'Chat & Retrieve',
    text: 'Ask anything. Responses are context‑aware with secure retrieval.',
  },
  {
    icon: Rocket,
    title: 'Execute On‑chain',
    text: 'Approve actions with signatures — swaps, transfers, or agent tasks.',
  },
];

function HowItWorks() {
  return (
    <AnimatedSection
      className="py-20 md:py-28 lg:py-32"
      auroraVariant="primary"
      includeRosetta={false}
      includeHieroglyphs={false}
      dustIntensity="low"
      allowOverlap
      softEdges
      data-bg-variant="primary"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h2 className="mb-3 font-bold text-3xl md:text-5xl">
            <span className="bg-gradient-to-r from-primary via-foreground to-accent bg-clip-text text-transparent">
              How it works
            </span>
          </h2>
          <p className="text-muted-foreground">Four steps, end‑to‑end and secure.</p>
        </div>

        <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <li key={s.title + i} className="relative">
                <Card className="h-full bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_70%)] p-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Icon aria-hidden className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-1 font-semibold text-lg">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.text}</p>
                </Card>
              </li>
            );
          })}
        </ol>

        <ul className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          <li className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> No email required</li>
          <li className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Private by design</li>
          <li className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Export anytime</li>
        </ul>
      </div>
    </AnimatedSection>
  );
}

export default memo(HowItWorks);


