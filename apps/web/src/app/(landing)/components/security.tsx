'use client';

import React, { memo } from 'react';
import { Shield, Lock, KeySquare } from 'lucide-react';
import { Card } from '@/components/ui/card';

function Security() {
  return (
    <section className="relative bg-[linear-gradient(180deg,rgba(10,12,12,1)_0%,rgba(10,12,12,1)_40%,rgba(17,24,21,1)_100%)] py-20 md:py-28">
      <div className="container mx-auto grid items-stretch gap-8 px-4 md:grid-cols-2">
        <div className="self-center">
          <h2 className="mb-4 font-bold text-3xl md:text-5xl">
            <span className="bg-gradient-to-r from-emerald-300 via-white to-primary bg-clip-text text-transparent">
              Security and Privacy by Default
            </span>
          </h2>
          <p className="mb-6 text-muted-foreground">
            Wallet signatures authenticate every critical action. Messages are sanitized and
            validated. Access is scoped to your public key.
          </p>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="inline-flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Signature‑gated actions</li>
            <li className="inline-flex items-center gap-2"><Lock className="h-4 w-4 text-primary" /> Rate limiting & input validation</li>
            <li className="inline-flex items-center gap-2"><KeySquare className="h-4 w-4 text-primary" /> Wallet‑scoped data isolation</li>
          </ul>
        </div>
        <Card aria-label="Security panel" className="relative overflow-hidden border-white/10 bg-card/70 p-8">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_30%_20%,rgba(20,241,149,0.08)_0%,rgba(20,241,149,0)_60%)]" />
          <div className="relative grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border/60 bg-background/60 p-4">
              <h3 className="mb-1 font-semibold">JWT + Convex</h3>
              <p className="text-sm text-muted-foreground">Edge‑secure sessions with reactive data.</p>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/60 p-4">
              <h3 className="mb-1 font-semibold">Sanitized Inputs</h3>
              <p className="text-sm text-muted-foreground">XSS‑safe chat and uploads by default.</p>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/60 p-4">
              <h3 className="mb-1 font-semibold">Rate Limits</h3>
              <p className="text-sm text-muted-foreground">Protection against abuse and spam.</p>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/60 p-4">
              <h3 className="mb-1 font-semibold">On‑chain Receipts</h3>
              <p className="text-sm text-muted-foreground">Subscription proof recorded on Solana.</p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

export default memo(Security);


