'use client';

import React, { memo } from 'react';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const tiers = [
  {
    name: 'Free',
    price: '0 SOL',
    features: ['100 messages / mo', 'Wallet auth', 'Community support'],
    cta: 'Get Started',
    href: '/auth',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '0.15 SOL / mo',
    features: [
      'Unlimited messages',
      'All models',
      'Priority streaming',
      'RAG + agents',
    ],
    cta: 'Start Free Trial',
    href: '/auth',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    features: ['SLAs', 'Dedicated support', 'SAML / SSO', 'Custom deploy'],
    cta: 'Contact Sales',
    href: '/auth',
    highlighted: false,
  },
];

function Pricing() {
  return (
    <section className="relative bg-[linear-gradient(180deg,rgba(12,16,14,1)_0%,rgba(10,12,12,1)_100%)] py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h2 className="mb-3 font-bold text-3xl md:text-5xl">
            <span className="bg-gradient-to-r from-emerald-300 via-white to-primary bg-clip-text text-transparent">
              Simple, transparent pricing
            </span>
          </h2>
          <p className="text-muted-foreground">Scale up or down anytime.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {tiers.map((t) => (
            <Card
              className={`relative border-white/10 bg-card/70 p-6 ${t.highlighted ? 'ring-1 ring-primary/40 shadow-xl' : ''}`}
              key={t.name}
            >
              {t.highlighted ? (
                <div className="absolute right-4 top-4 rounded bg-gradient-to-r from-primary to-accent px-2 py-1 text-xs font-semibold text-primary-foreground">
                  POPULAR
                </div>
              ) : null}
              <h3 className="mb-1 font-bold text-2xl">{t.name}</h3>
              <div className="mb-4 text-3xl">{t.price}</div>
              <ul className="mb-6 space-y-2 text-sm">
                {t.features.map((f) => (
                  <li className="inline-flex items-center gap-2" key={f}>
                    <Check className="h-4 w-4 text-primary" /> {f}
                  </li>
                ))}
              </ul>
              <Link href={t.href}>
                <Button className="button-press w-full" type="button" variant={t.highlighted ? 'default' : 'outline'}>
                  {t.cta}
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export default memo(Pricing);


