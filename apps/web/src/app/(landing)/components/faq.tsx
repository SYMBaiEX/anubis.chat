'use client';

import React, { memo } from 'react';
import { Card } from '@/components/ui/card';
import AnimatedSection from '@/components/landing/animated-section';

const faqs = [
  {
    q: 'Do I need an email to sign up?',
    a: 'No. Authentication is wallet‑native. Your public key is your identity.',
  },
  {
    q: 'Where is my data stored?',
    a: 'Conversation data lives in Convex. Uploaded knowledge is embedded and stored with wallet‑scoped namespaces.',
  },
  {
    q: 'Which wallets are supported?',
    a: 'Phantom, Backpack, Solflare, and standard Solana wallets via adapters.',
  },
  {
    q: 'Can I export my data?',
    a: 'Yes. You can export conversations and uploaded knowledge anytime.',
  },
];

function FAQ() {
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
              Frequently asked questions
            </span>
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {faqs.map((f) => (
            <Card key={f.q} className="bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_70%)] p-6">
              <h3 className="mb-1 font-semibold">{f.q}</h3>
              <p className="text-sm text-muted-foreground">{f.a}</p>
            </Card>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}

export default memo(FAQ);


