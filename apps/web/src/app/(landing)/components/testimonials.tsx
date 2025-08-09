'use client';

import React, { memo } from 'react';
import { Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import AnimatedSection from '@/components/landing/animated-section';

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'DeFi Trader',
    content:
      'ISIS Chat agents execute my strategies faster than any manual workflow.',
    rating: 5,
  },
  {
    name: 'Michael Roberts',
    role: 'Data Scientist',
    content: 'RAG quality is outstanding. Context retrieval feels effortless.',
    rating: 5,
  },
  {
    name: 'Emma Wilson',
    role: 'Product Manager',
    content: 'The wallet‑native UX is exactly what our users expect.',
    rating: 5,
  },
];

function Testimonials() {
  return (
    <AnimatedSection
      className="py-20 md:py-28 lg:py-32"
      auroraVariant="gold"
      includeRosetta={false}
      includeHieroglyphs={false}
      dustIntensity="low"
      allowOverlap
      data-bg-variant="gold"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h2 className="mb-3 font-bold text-3xl md:text-5xl">
            <span className="bg-gradient-to-r from-primary via-foreground to-accent bg-clip-text text-transparent">
              Loved by builders
            </span>
          </h2>
          <p className="text-muted-foreground">What our community says.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.name} className="border-border/60 bg-card/70 p-6">
              <div className="mb-3 flex gap-1">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star className="h-4 w-4 fill-egypt-gold text-egypt-gold" key={i} />
                ))}
              </div>
              <p className="mb-4 text-muted-foreground">“{t.content}”</p>
              <div>
                <p className="font-semibold">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.role}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}

export default memo(Testimonials);


