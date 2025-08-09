'use client';

import React, { memo } from 'react';
import { ArrowRight, Wallet, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HeroLogo } from '@/components/ui/hero-logo';

function Hero() {
  return (
    <section
      aria-label="Hero"
      className="relative isolate overflow-hidden bg-[linear-gradient(180deg,rgba(10,12,12,1)_0%,rgba(10,12,12,1)_40%,rgba(17,24,21,1)_100%)] px-4 pb-20 pt-28 md:pt-32"
    >
      {/* Decorative background */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute right-[-10%] top-[-10%] h-[40rem] w-[40rem] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute left-[-20%] bottom-[-10%] h-[32rem] w-[32rem] rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(40%_50%_at_50%_0%,rgba(20,241,149,0.10)_0%,rgba(20,241,149,0)_60%)]" />
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 md:grid-cols-2">
        {/* Left column: copy */}
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-300/90">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-medium tracking-wide">New: Wallet‑native Agents</span>
          </div>

          <h1 className="mb-4 font-extrabold text-4xl leading-tight tracking-tight md:text-6xl">
            <span className="bg-gradient-to-br from-emerald-300 via-white to-emerald-500 bg-clip-text text-transparent">
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
        <div aria-label="Product preview" className="relative">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-emerald-400/30 to-accent/30 blur-xl" />
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] p-6 shadow-2xl backdrop-blur">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-emerald-400" />
              <div className="h-3 w-3 rounded-full bg-yellow-400" />
              <div className="h-3 w-3 rounded-full bg-red-400" />
            </div>
            <HeroLogo className="mb-6" iconSize="lg" showIcon />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Models</p>
                <p className="mt-1 font-medium">GPT‑5, Claude 4.1, Gemini 2.5</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">RAG</p>
                <p className="mt-1 font-medium">Wallet‑scoped Qdrant vectors</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Agents</p>
                <p className="mt-1 font-medium">On‑chain DeFi execution</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Auth</p>
                <p className="mt-1 font-medium">Wallet signatures only</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(Hero);


