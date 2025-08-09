'use client';

import React, { memo } from 'react';
import { ArrowRight, Wallet, ShieldCheck, Zap } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HeroLogo } from '@/components/ui/hero-logo';
import AnimatedSection from '@/components/landing/animated-section';

function Hero() {
  return (
    <AnimatedSection
      aria-label="Hero"
      className="isolate overflow-hidden pb-24 pt-28 md:pb-32 md:pt-36"
      auroraVariant="primary"
      includeRosetta={false}
      includeHieroglyphs={false}
      glyphIntensity="medium"
      dustIntensity="low"
      allowOverlap
    >
      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
        {/* Left column: copy */}
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-300/90">
            <span className="text-xs font-medium tracking-wide">New: Wallet‑native Agents</span>
          </div>

          <h1 className="mb-4 font-extrabold text-4xl leading-tight tracking-tight md:text-6xl">
            <span className="bg-gradient-to-br from-primary via-foreground to-primary bg-clip-text text-transparent">
              Solana‑Native AI, from chat to on‑chain actions
            </span>
          </h1>
          <p className="mb-8 max-w-xl text-balance text-base leading-relaxed text-muted-foreground md:text-lg">
            Connect your wallet, bring your knowledge, and deploy autonomous agents
            that read, reason, and execute — safely gated by signatures.
          </p>

          <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Link href="/auth">
              <Button className="button-press h-12 min-w-[200px] gap-2" size="lg" type="button">
                Connect Wallet
                <Wallet className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button className="h-12 min-w-[200px] gap-2" size="lg" type="button" variant="outline">
                Explore Features
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <li className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-400" /> Signature‑gated</li>
            <li className="inline-flex items-center gap-2"><Zap className="h-4 w-4 text-emerald-400" /> Realtime streaming</li>
          </ul>
        </div>

        {/* Right column: visual panel */}
        <div aria-label="Product preview" className="relative overflow-visible">
          {/* Holographic halo */}
          <div aria-hidden className="absolute -inset-8 -z-10 rounded-[2rem] bg-[conic-gradient(from_90deg_at_50%_50%,rgba(16,185,129,0.35),transparent_50%,rgba(168,85,247,0.3))] blur-3xl" />
          {/* Card */}
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-foreground/10 to-foreground/5 p-6 shadow-2xl backdrop-blur">
            {/* Scanlines */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-soft-light"
              style={{ backgroundImage: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.35) 0, rgba(255,255,255,0.35) 1px, transparent 2px, transparent 4px)' }}
            />
            <div className="mb-4 flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-emerald-400" />
              <div className="h-3 w-3 rounded-full bg-yellow-400" />
              <div className="h-3 w-3 rounded-full bg-red-400" />
            </div>
            <HeroLogo className="mb-6" iconSize="lg" showIcon />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-border/60 bg-background/60 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Models</p>
                <p className="mt-1 font-medium">GPT‑5, Claude 4.1, Gemini 2.5</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/60 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">RAG</p>
                <p className="mt-1 font-medium">Wallet‑scoped Qdrant vectors</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/60 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Agents</p>
                <p className="mt-1 font-medium">On‑chain DeFi execution</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/60 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Auth</p>
                <p className="mt-1 font-medium">Wallet signatures only</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}

export default memo(Hero);


