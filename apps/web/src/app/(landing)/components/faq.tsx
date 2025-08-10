'use client';

import React, { memo } from 'react';
import AnimatedSection from '@/components/landing/animated-section';
import { Card } from '@/components/ui/card';

const faqs = [
  {
    q: 'Do I need an email to sign up?',
    a: 'No. Simply connect your Solana wallet to start chatting. No email or password required.',
  },
  {
    q: 'Which AI models are available?',
    a: 'We offer GPT-5, Gemini 2.5 Pro, o4-mini, and several free models including GPT-OSS-20B and Qwen3-Coder.',
  },
  {
    q: 'Which wallets are supported?',
    a: 'Phantom, Solflare, Backpack, and all standard Solana wallets are supported.',
  },
  {
    q: 'Can I switch between models during a conversation?',
    a: 'Yes! You can seamlessly switch between any available model mid-conversation.',
  },
  {
    q: 'Is my conversation history saved?',
    a: 'Yes. All conversations are saved and synced across your devices when you sign in with your wallet.',
  },
  {
    q: 'What makes this different from ChatGPT?',
    a: 'Web3-native authentication, multiple AI models in one place, Egyptian-themed UI, and SOL-based payments.',
  },
];

function FAQ() {
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
              Frequently asked questions
            </span>
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {faqs.map((f) => (
            <div className="rounded-xl p-6 ring-1 ring-border/40" key={f.q}>
              <h3 className="mb-1 font-semibold">{f.q}</h3>
              <p className="text-muted-foreground text-sm">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}

export default memo(FAQ);
