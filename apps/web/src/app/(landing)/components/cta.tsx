'use client';

import React, { memo } from 'react';
import { Rocket, Wallet } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

function CTA() {
  return (
    <section className="relative bg-[linear-gradient(180deg,rgba(12,16,14,1)_0%,rgba(10,12,12,1)_100%)] py-20 md:py-28">
      <div className="container mx-auto px-4">
        <Card className="relative overflow-hidden border-white/10 bg-card/70 p-10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_80%_20%,rgba(20,241,149,0.12)_0%,rgba(20,241,149,0)_60%)]"
          />
          <div className="relative text-center">
            <h2 className="mb-3 font-bold text-3xl md:text-5xl">
              <span className="bg-gradient-to-r from-primary via-white to-accent bg-clip-text text-transparent">
                Ready to build with wallet‑native AI?
              </span>
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-muted-foreground">
              Join thousands of crypto‑native users and teams shipping faster with
              on‑chain intelligence.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/auth">
                <Button className="button-press h-12 min-w-[200px] gap-2" size="lg" type="button">
                  Connect Wallet
                  <Wallet className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/chat">
                <Button className="h-12 min-w-[200px] gap-2" size="lg" type="button" variant="outline">
                  Try Demo
                  <Rocket className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

export default memo(CTA);


