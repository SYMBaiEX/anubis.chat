'use client';

import { BrainCircuit } from 'lucide-react';
import { memo } from 'react';
import AnimatedSection from '@/components/landing/animated-section';

const models = [
  { name: 'GPT-5', provider: 'OpenAI', tier: 'Premium' },
  { name: 'GPT-OSS-20B', provider: 'OpenRouter', tier: 'Free' },
  { name: 'Gemini 2.5 Pro', provider: 'Google', tier: 'Premium' },
  { name: 'o4-mini', provider: 'OpenAI', tier: 'Standard' },
  { name: 'GLM-4.5-Air', provider: 'OpenRouter', tier: 'Free' },
  { name: 'Qwen3-Coder', provider: 'OpenRouter', tier: 'Free' },
  { name: 'Kimi K2', provider: 'OpenRouter', tier: 'Free' },
  { name: 'GPT-5 Nano', provider: 'OpenAI', tier: 'Standard' },
];

function getTierStyles(tier: string) {
  if (tier === 'Free') {
    return 'bg-emerald-500/10 text-emerald-400';
  }
  if (tier === 'Premium') {
    return 'bg-purple-500/10 text-purple-400';
  }
  return 'bg-blue-500/10 text-blue-400';
}

function Models() {
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
            <span className="bg-gradient-to-r from-accent via-foreground to-primary bg-clip-text text-transparent">
              Best‑in‑class models
            </span>
          </h2>
          <p className="text-muted-foreground">
            Choose the brain that fits the task.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {models.map((m) => (
            <div className="rounded-xl p-6 ring-1 ring-border/40" key={m.name}>
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                <BrainCircuit aria-hidden className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-semibold">{m.name}</h3>
              <p className="text-muted-foreground text-sm">{m.provider}</p>
              <span
                className={`mt-2 inline-block rounded-full px-2 py-1 font-medium text-xs ${getTierStyles(
                  m.tier
                )}`}
              >
                {m.tier}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-muted-foreground text-sm">
          <span>Hot‑swap models anytime during a conversation.</span>
        </div>
      </div>
    </AnimatedSection>
  );
}

export default memo(Models);
