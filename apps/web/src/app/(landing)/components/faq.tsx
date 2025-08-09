'use client';

import React, { memo } from 'react';
import { Card } from '@/components/ui/card';

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
    <section className="relative bg-[linear-gradient(180deg,rgba(17,24,21,1)_0%,rgba(12,16,14,1)_100%)] py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h2 className="mb-3 font-bold text-3xl md:text-5xl">
            <span className="bg-gradient-to-r from-primary via-white to-accent bg-clip-text text-transparent">
              Frequently asked questions
            </span>
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {faqs.map((f) => (
            <Card key={f.q} className="border-white/10 bg-card/70 p-6">
              <h3 className="mb-1 font-semibold">{f.q}</h3>
              <p className="text-sm text-muted-foreground">{f.a}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export default memo(FAQ);


