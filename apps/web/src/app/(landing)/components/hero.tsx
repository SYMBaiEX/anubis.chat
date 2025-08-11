'use client';

import { ArrowRight, ShieldCheck, Wallet, Zap } from 'lucide-react';
import Link from 'next/link';
import AnimatedSection from '@/components/landing/animated-section';
import { Button } from '@/components/ui/button';
import { HeroLogo } from '@/components/ui/hero-logo';

function Hero() {
  return (
    <AnimatedSection
      allowOverlap
      aria-label="Hero"
      auroraVariant="primary"
      className="isolate overflow-visible pt-28 pb-24 md:pt-36 md:pb-32"
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
              Powered by GPT-5, Gemini 2.5, & Free Models
            </span>
          </div>

          <h1 className="mb-4 font-extrabold text-4xl leading-tight tracking-tight md:text-6xl">
            <span className="bg-gradient-to-br from-primary via-foreground to-primary bg-clip-text text-transparent">
              Ancient Wisdom Meets Modern AI
            </span>
          </h1>
          <p className="mb-8 max-w-xl text-balance text-base text-muted-foreground leading-relaxed md:text-lg">
            Experience the future of AI conversation with Solana wallet
            authentication, multi-model intelligence, and seamless Web3
            integration.
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
              <ShieldCheck className="h-4 w-4 text-emerald-400" /> Secure Wallet
              Auth
            </li>
            <li className="inline-flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-400" /> Real-time AI
              Responses
            </li>
          </ul>
        </div>

        {/* Right column: visual panel */}
        <div className="relative overflow-visible">
          {/* Holographic halo */}
          <div
            aria-hidden
            className="-inset-8 -z-10 absolute rounded-[2rem] bg-[conic-gradient(from_90deg_at_50%_50%,rgba(16,185,129,0.35),transparent_50%,rgba(168,85,247,0.3))] blur-3xl"
          />
          {/* Card */}
          <div className="relative overflow-hidden rounded-2xl p-6 shadow-2xl">
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
              <div className="rounded-lg p-4 ring-1 ring-border/40">
                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                  AI Models
                </p>
                <p className="mt-1 font-medium">GPT-5, Gemini 2.5, o4-mini</p>
              </div>
              <div className="rounded-lg p-4 ring-1 ring-border/40">
                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                  Authentication
                </p>
                <p className="mt-1 font-medium">Solana Wallet Integration</p>
              </div>
              <div className="rounded-lg p-4 ring-1 ring-border/40">
                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                  Platform
                </p>
                <p className="mt-1 font-medium">Web3-Native AI Chat</p>
              </div>
              <div className="rounded-lg p-4 ring-1 ring-border/40">
                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                  Experience
                </p>
                <p className="mt-1 font-medium">Real-time Streaming</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}

export default Hero;
