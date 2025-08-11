'use client';

import { Check, MessagesSquare, Rocket, Upload, Wallet } from 'lucide-react';
import React from 'react';
import AnimatedSection from '@/components/landing/animated-section';
import { Card } from '@/components/ui/card';

const steps = [
  {
    icon: Wallet,
    title: 'Connect Wallet',
    text: 'Sign in securely with Phantom, Solflare, or any Solana wallet.',
  },
  {
    icon: MessagesSquare,
    title: 'Start Chatting',
    text: 'Choose your AI model and begin conversing instantly.',
  },
  {
    icon: Upload,
    title: 'Switch Models',
    text: 'Seamlessly switch between GPT-5, Gemini, and free models instantly.',
  },
  {
    icon: Rocket,
    title: 'Save & Continue',
    text: 'Your conversations are saved and synced across all devices.',
  },
];

function HowItWorks() {
  return (
    <AnimatedSection
      allowOverlap
      auroraVariant="primary"
      className="py-20 md:py-28 lg:py-32"
      data-bg-variant="primary"
      dustIntensity="low"
      includeHieroglyphs={false}
      includeRosetta={false}
      softEdges
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h2 className="mb-3 font-bold text-3xl md:text-5xl">
            <span className="bg-gradient-to-r from-primary via-foreground to-accent bg-clip-text text-transparent">
              How it works
            </span>
          </h2>
          <p className="text-muted-foreground">
            Get started in seconds with Web3 authentication.
          </p>
        </div>

        <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <li className="relative" key={s.title + i}>
                <Card className="h-full bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_70%)] p-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Icon aria-hidden className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-1 font-semibold text-lg">{s.title}</h3>
                  <p className="text-muted-foreground text-sm">{s.text}</p>
                </Card>
              </li>
            );
          })}
        </ol>

        <ul className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-4 text-muted-foreground text-sm">
          <li className="inline-flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" /> No email required
          </li>
          <li className="inline-flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" /> Private by design
          </li>
          <li className="inline-flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" /> Export anytime
          </li>
        </ul>
      </div>
    </AnimatedSection>
  );
}

export default memo(HowItWorks);
