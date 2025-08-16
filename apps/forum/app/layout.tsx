import type React from "react"
import type { Metadata } from "next"
import { GeistMono } from "geist/font/mono"
import { GeistSans } from "geist/font/sans"
import Providers from "@/components/providers"
import "./globals.css"

export const metadata: Metadata = {
  title: "Anubis Forum - Ancient Wisdom Meets Modern AI",
  description:
    "Community forum for anubis.chat - Experience the future of AI conversation with Solana wallet authentication",
  generator: "anubis.chat",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} ${GeistSans.className} antialiased selection:bg-primary/20 selection:text-primary-foreground`}
      >
        {/* Ambient gradient background */}
        <div className="gradient-mesh" aria-hidden="true">
          <span className="gradient-blob blob-teal" />
          <span className="gradient-blob blob-purple" />
          <span className="gradient-blob blob-amber" />
        </div>
        {/* Subtle grid overlay for depth (reuses web/public/grid.svg) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20 transition-opacity duration-700 dark:opacity-10 [mask-image:radial-gradient(white,transparent_70%)]"
        />
        <Providers>
          <div className="relative min-h-screen [padding-top:env(safe-area-inset-top)] [padding-bottom:env(safe-area-inset-bottom)]">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
