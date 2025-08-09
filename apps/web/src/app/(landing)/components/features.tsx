'use client';

import React, { memo } from 'react';
import {
  Brain,
  Shield,
  Zap,
  Globe,
  Database,
  Network,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import AnimatedSection from '@/components/landing/animated-section';

const featureList = [
  {
    icon: Brain,
    title: 'Model Multiplex',
    description:
      'Switch across GPT‑5, Claude, Gemini and more with streaming responses.',
    gradient: 'from-primary to-accent',
  },
  {
    icon: Shield,
    title: 'Wallet Security',
    description: 'Auth and actions secured by on‑chain signature verification.',
    gradient: 'from-emerald-400 to-primary',
  },
  {
    icon: Zap,
    title: 'Real‑time',
    description: 'Ultra‑low latency streams powered by Convex edge functions.',
    gradient: 'from-accent to-emerald-400',
  },
  {
    icon: Globe,
    title: 'RAG System',
    description: 'Upload docs and query with semantic retrieval tuned for Web3.',
    gradient: 'from-primary to-emerald-400',
  },
  {
    icon: Database,
    title: 'Vector Search',
    description: 'Qdrant‑backed vectors with wallet‑scoped namespaces.',
    gradient: 'from-accent to-primary',
  },
  {
    icon: Network,
    title: 'On‑chain Agents',
    description: 'Autonomous agents that read, reason, and execute DeFi actions.',
    gradient: 'from-emerald-400 to-accent',
  },
];

function Features() {
  return (
    <AnimatedSection
      id="features"
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
              Build faster with wallet‑native primitives
            </span>
          </h2>
          <p className="text-muted-foreground">
            Streaming chat, retrieval, vectors, and on‑chain execution — all in one.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featureList.map((f, i) => {
            const Icon = f.icon;
            return (
              <Card
                className="group relative overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_70%)] p-6 backdrop-blur hover:shadow-lg"
                key={f.title + i}
              >
                <div
                  aria-hidden
                  className={`absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-15 ${f.gradient}`}
                />
                <div className="relative">
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${f.gradient} shadow-md shadow-emerald-500/20`}>
                    <Icon aria-hidden className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mb-1 font-semibold text-xl">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </AnimatedSection>
  );
}

export default memo(Features);


