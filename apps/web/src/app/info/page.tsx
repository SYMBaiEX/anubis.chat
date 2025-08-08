'use client';

import Link from 'next/link';

export default function InfoPage() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <header className="space-y-2">
          <h1 className="font-bold text-3xl tracking-tight">About ISIS Chat</h1>
          <p className="text-muted-foreground">Ancient wisdom • Modern AI</p>
        </header>

        <section className="space-y-3">
          <p>
            ISIS Chat is a Solana-native AI chat platform combining
            state-of-the-art models with on-chain authentication and optional
            RAG capabilities. Build custom agents, connect MCP servers, and
            explore Web3 integrations.
          </p>
          <p>
            This page is public. To access your dashboard and chat, connect your
            wallet and sign in.
          </p>
        </section>

        <div>
          <Link className="text-primary underline" href="/auth">
            Get started
          </Link>
        </div>
      </div>
    </div>
  );
}
