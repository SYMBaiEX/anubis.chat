'use client';

import React, { memo } from 'react';
import { BrainCircuit, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';

const models = [
  { name: 'GPT‑5', provider: 'OpenAI' },
  { name: 'Claude Opus 4.1', provider: 'Anthropic' },
  { name: 'Gemini 2.5 Pro', provider: 'Google' },
  { name: 'DeepSeek‑V2', provider: 'DeepSeek' },
];

function Models() {
  return (
    <section className="relative bg-[linear-gradient(180deg,rgba(17,24,21,1)_0%,rgba(12,16,14,1)_100%)] py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h2 className="mb-3 font-bold text-3xl md:text-5xl">
            <span className="bg-gradient-to-r from-accent via-white to-primary bg-clip-text text-transparent">
              Best‑in‑class models
            </span>
          </h2>
          <p className="text-muted-foreground">Choose the brain that fits the task.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {models.map((m) => (
            <Card key={m.name} className="border-white/10 bg-card/70 p-6">
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                <BrainCircuit aria-hidden className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-semibold">{m.name}</h3>
              <p className="text-sm text-muted-foreground">{m.provider}</p>
            </Card>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>Hot‑swap models anytime during a conversation.</span>
        </div>
      </div>
    </section>
  );
}

export default memo(Models);


