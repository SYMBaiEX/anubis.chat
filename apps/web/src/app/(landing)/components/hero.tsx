'use client';

import { ArrowRight, ShieldCheck, Wallet, Zap } from 'lucide-react';
import Link from 'next/link';
import React, { memo } from 'react';
import AnimatedSection from '@/components/landing/animated-section';
import { Button } from '@/components/ui/button';
import { HeroLogo } from '@/components/ui/hero-logo';

function Hero() {
  return (
    <AnimatedSection
      allowOverlap
      aria-label="Hero"
      auroraVariant="primary"
      className="isolate overflow-hidden pt-28 pb-24 md:pt-36 md:pb-32"
      dustIntensity="low"
      glyphIntensity="medium"
      includeHieroglyphs={false}
      includeRosetta={false}
      softEdges
    >
      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
        {/* Left column: copy */}
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[linear-gradient(180deg,rgba(16,185,129,0.16),transparent_70%)] px-3 py-1 text-emerald-300/90">
            <span className="font-medium text-xs tracking-wide">
              New: Wallet‑native Agents
            </span>
          </div>

          <h1 className="mb-4 font-extrabold text-4xl leading-tight tracking-tight md:text-6xl">
            <span className="bg-gradient-to-br from-primary via-foreground to-primary bg-clip-text text-transparent">
              Solana‑Native AI, from chat to on‑chain actions
            </span>
          </h1>
          <p className="mb-8 max-w-xl text-balance text-base text-muted-foreground leading-relaxed md:text-lg">
            Connect your wallet, bring your knowledge, and deploy autonomous
            agents that read, reason, and execute — safely gated by signatures.
          </p>

          <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Link href="/auth">
              <Button
                className="button-press h-12 min-w-[200px] gap-2"
                size="lg"
                type="button"
              >
                Connect Wallet
                <Wallet className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button
                className="h-12 min-w-[200px] gap-2"
                size="lg"
                type="button"
                variant="outline"
              >
                Explore Features
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-muted-foreground text-sm">
            <li className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />{' '}
              Signature‑gated
            </li>
            <li className="inline-flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-400" /> Realtime streaming
            </li>
          </ul>
        </div>

        {/* Right column: visual panel */}
        <div aria-label="Product preview" className="relative overflow-visible">
          {/* Holographic halo */}
          <div
            aria-hidden
            className="-inset-8 -z-10 absolute rounded-[2rem] bg-[conic-gradient(from_90deg_at_50%_50%,rgba(16,185,129,0.35),transparent_50%,rgba(168,85,247,0.3))] blur-3xl"
          />
          {/* Card */}
          <div className="relative overflow-hidden rounded-2xl bg-[radial-gradient(80%_100%_at_50%_0%,rgba(255,255,255,0.08),transparent_70%)] p-6 shadow-2xl backdrop-blur">
            {/* Scanlines */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-soft-light"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(180deg, rgba(255,255,255,0.35) 0, rgba(255,255,255,0.35) 1px, transparent 2px, transparent 4px)',
              }}
            />
            <div className="mb-4 flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-emerald-400" />
              <div className="h-3 w-3 rounded-full bg-yellow-400" />
              <div className="h-3 w-3 rounded-full bg-red-400" />
            </div>
            <HeroLogo className="mb-6" iconSize="lg" showIcon />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_70%)] p-4 backdrop-blur-sm">
                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                  Models
                </p>
                <p className="mt-1 font-medium">
                  GPT‑5, Claude 4.1, Gemini 2.5
                </p>
              </div>
              <div className="rounded-lg bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_70%)] p-4 backdrop-blur-sm">
                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                  RAG
                </p>
                <p className="mt-1 font-medium">Wallet‑scoped Qdrant vectors</p>
              </div>
              <div className="rounded-lg bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_70%)] p-4 backdrop-blur-sm">
                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                  Agents
                </p>
                <p className="mt-1 font-medium">On‑chain DeFi execution</p>
              </div>
              <div className="rounded-lg bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_70%)] p-4 backdrop-blur-sm">
                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                  Auth
                </p>
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
