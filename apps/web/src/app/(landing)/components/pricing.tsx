'use client';

import React, { memo } from 'react';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AnimatedSection from '@/components/landing/animated-section';

const tiers = [
  {
    name: 'Free',
    price: '0 SOL',
    period: 'forever',
    features: [
      '50 messages / month',
      'GPT-4o Mini & DeepSeek',
      'Basic chat features',
      'Community support'
    ],
    cta: 'Get Started',
    href: '/auth',
    highlighted: false,
    popular: false,
  },
  {
    name: 'Pro',
    price: '0.05 SOL',
    period: 'per month',
    originalPrice: '0.1 SOL',
    features: [
      '1,500 messages / month',
      '100 premium messages (GPT-4o, Claude)',
      'All standard models unlimited',
      'Document uploads',
      'Basic agents',
      'Chat history'
    ],
    cta: 'Start Pro Plan',
    href: '/auth',
    highlighted: true,
    popular: true,
    badge: 'Launch Special - 50% Off',
  },
  {
    name: 'Pro+',
    price: '0.1 SOL',
    period: 'per month',
    originalPrice: '0.2 SOL',
    features: [
      '3,000 messages / month',
      '300 premium messages',
      'All models unlimited',
      'Large file uploads (100MB)',
      'Advanced agents',
      'API access',
      'Priority support'
    ],
    cta: 'Go Pro+',
    href: '/auth',
    highlighted: false,
    popular: false,
    badge: 'Launch Special - 50% Off',
  },
];

function Pricing() {
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h2 className="mb-3 font-bold text-3xl md:text-5xl">
            <span className="bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text text-transparent">
              Simple, transparent pricing
            </span>
          </h2>
          <p className="text-muted-foreground">Scale up or down anytime.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {tiers.map((t) => (
            <Card
              className={`relative bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_70%)] p-6 ${t.highlighted ? 'ring-1 ring-primary/40 shadow-xl' : ''}`}
              key={t.name}
            >
              {t.popular ? (
                <div className="absolute right-4 top-4 rounded bg-gradient-to-r from-primary to-accent px-2 py-1 text-xs font-semibold text-primary-foreground">
                  POPULAR
                </div>
              ) : null}
              {t.badge ? (
                <div className="absolute left-4 top-4 rounded bg-gradient-to-r from-orange-500 to-orange-600 px-2 py-1 text-xs font-semibold text-white">
                  {t.badge}
                </div>
              ) : null}
              <div className="mt-4">
                <h3 className="mb-1 font-bold text-2xl">{t.name}</h3>
                <div className="mb-2 flex items-baseline">
                  <span className="text-3xl font-bold">{t.price}</span>
                  {t.originalPrice && (
                    <span className="ml-2 text-lg text-muted-foreground line-through">
                      {t.originalPrice}
                    </span>
                  )}
                </div>
                <p className="mb-4 text-sm text-muted-foreground">{t.period}</p>
              </div>
              <ul className="mb-6 space-y-2 text-sm">
                {t.features.map((f) => (
                  <li className="inline-flex items-start gap-2" key={f}>
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <span>{f}</span>
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
    </AnimatedSection>
  );
}

export default memo(Pricing);


