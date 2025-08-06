"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Toaster } from "./ui/sonner";
import { WalletProvider } from "./wallet/wallet-provider";
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ErrorBoundary } from "./error-boundary";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function Providers({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ErrorBoundary fallback={<div className="p-4 text-center text-destructive">Wallet connection failed</div>}>
          <WalletProvider network={WalletAdapterNetwork.Devnet}>
            <ErrorBoundary fallback={<div className="p-4 text-center text-destructive">Database connection failed</div>}>
              <ConvexProvider client={convex}>{children}</ConvexProvider>
            </ErrorBoundary>
            <Toaster richColors />
          </WalletProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
