'use client';

import Link from 'next/link';

export default function InfoPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">About ISIS Chat</h1>
          <p className="text-muted-foreground">Ancient wisdom • Modern AI</p>
        </header>

        <section className="space-y-3">
          <p>
            ISIS Chat is a Solana-native AI chat platform combining state-of-the-art models with
            on-chain authentication and optional RAG capabilities. Build custom agents, connect MCP
            servers, and explore Web3 integrations.
          </p>
          <p>
            This page is public. To access your dashboard and chat, connect your wallet and sign in.
          </p>
        </section>

        <div>
          <Link href="/auth" className="text-primary underline">Get started</Link>
        </div>
      </div>
    </div>
  );
}


