'use client';

import { Check } from 'lucide-react';
import Link from 'next/link';
import React, { memo } from 'react';
import AnimatedSection from '@/components/landing/animated-section';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const tiers = [
  {
    name: 'Free',
    price: '0 SOL',
    period: 'forever',
    features: [
      '50 messages / month',
      'Free models (GPT-OSS-20B, GLM-4.5)',
      'Basic chat features',
      'Community support',
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
      '100 premium model messages',
      'Access to GPT-5, Gemini 2.5 Pro',
      'Standard models (o4-mini, GPT-5 Nano)',
      'Conversation history',
      'Model switching',
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
      '300 premium model messages',
      'Access to all available models',
      'Advanced features',
      'Custom preferences',
      'API access (coming soon)',
      'Priority support',
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
      allowOverlap
      auroraVariant="gold"
      className="py-20 md:py-28 lg:py-32"
      data-bg-variant="gold"
      dustIntensity="low"
      includeHieroglyphs={false}
      includeRosetta={false}
      softEdges
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
            <div
              className={cn(
                'relative rounded-2xl p-6 ring-1 ring-border/40',
                t.highlighted && 'shadow-xl ring-primary/40'
              )}
              key={t.name}
            >
              {t.popular ? (
                <div className="absolute top-4 right-4 rounded bg-gradient-to-r from-primary to-accent px-2 py-1 font-semibold text-primary-foreground text-xs">
                  POPULAR
                </div>
              ) : null}
              {t.badge ? (
                <div className="absolute top-4 left-4 rounded bg-gradient-to-r from-orange-500 to-orange-600 px-2 py-1 font-semibold text-white text-xs">
                  {t.badge}
                </div>
              ) : null}
              <div className="mt-4">
                <h3 className="mb-1 font-bold text-2xl">{t.name}</h3>
                <div className="mb-2 flex items-baseline">
                  <span className="font-bold text-3xl">{t.price}</span>
                  {t.originalPrice && (
                    <span className="ml-2 text-lg text-muted-foreground line-through">
                      {t.originalPrice}
                    </span>
                  )}
                </div>
                <p className="mb-4 text-muted-foreground text-sm">{t.period}</p>
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
                <Button
                  className="button-press w-full"
                  type="button"
                  variant={t.highlighted ? 'default' : 'outline'}
                >
                  {t.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}

export default memo(Pricing);
