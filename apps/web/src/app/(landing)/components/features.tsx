'use client';

import { Brain, Database, Globe, Network, Shield, Zap } from 'lucide-react';
import React from 'react';
import AnimatedSection from '@/components/landing/animated-section';

const featureList = [
  {
    icon: Brain,
    title: 'Multi-Model AI',
    description:
      'Access GPT-5, Gemini 2.5 Pro, and free models like GPT-OSS-20B in one platform.',
    gradient: 'from-primary to-accent',
  },
  {
    icon: Shield,
    title: 'Wallet Authentication',
    description:
      'Secure access with Solana wallet signatures - no passwords needed.',
    gradient: 'from-emerald-400 to-primary',
  },
  {
    icon: Zap,
    title: 'Real-time Streaming',
    description:
      'Instant AI responses with ultra-low latency streaming technology.',
    gradient: 'from-accent to-emerald-400',
  },
  {
    icon: Globe,
    title: 'Web3 Native',
    description: 'Built for the blockchain era with native Solana integration.',
    gradient: 'from-primary to-emerald-400',
  },
  {
    icon: Database,
    title: 'Conversation History',
    description: 'Persistent chat history synced across all your devices.',
    gradient: 'from-accent to-primary',
  },
  {
    icon: Network,
    title: 'Egyptian-Themed UI',
    description:
      'Unique ancient Egyptian aesthetics with modern design principles.',
    gradient: 'from-emerald-400 to-accent',
  },
];

function Features() {
  return (
    <AnimatedSection
      allowOverlap
      auroraVariant="primary"
      className="py-20 md:py-28 lg:py-32"
      data-bg-variant="primary"
      dustIntensity="low"
      id="features"
      includeHieroglyphs={false}
      includeRosetta={false}
      softEdges
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h2 className="mb-3 font-bold text-3xl md:text-5xl">
            <span className="bg-gradient-to-r from-primary via-foreground to-accent bg-clip-text text-transparent">
              Powerful Features for the Modern Web3 Era
            </span>
          </h2>
          <p className="text-muted-foreground">
            Experience cutting-edge AI models with blockchain authentication and
            Egyptian-inspired design.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featureList.map((f, _i) => {
            const Icon = f.icon;
            return (
              <div
                className="group hover:-translate-y-0.5 relative rounded-xl p-6 ring-1 ring-border/40 transition-transform"
                key={f.title}
              >
                <div
                  aria-hidden
                  className={`-z-10 absolute inset-0 rounded-xl bg-gradient-to-br opacity-0 blur-2xl transition-opacity group-hover:opacity-20 ${f.gradient}`}
                />
                <div className="relative">
                  <div
                    className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${f.gradient} shadow-emerald-500/20 shadow-md`}
                  >
                    <Icon aria-hidden className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mb-1 font-semibold text-xl">{f.title}</h3>
                  <p className="text-muted-foreground text-sm">
                    {f.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AnimatedSection>
  );
}

export default Features;
