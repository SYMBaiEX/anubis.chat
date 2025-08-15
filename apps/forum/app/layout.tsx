import type React from "react"
import type { Metadata } from "next"
import { Inter, Cinzel } from "next/font/google"
import Providers from "@/components/providers"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const cinzel = Cinzel({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-cinzel",
})

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
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${cinzel.variable}`}>
      <body className="font-sans antialiased selection:bg-primary/20 selection:text-primary-foreground">
        {/* Ambient gradient background */}
        <div className="gradient-mesh" aria-hidden="true">
          <span className="gradient-blob blob-teal" />
          <span className="gradient-blob blob-purple" />
          <span className="gradient-blob blob-amber" />
        </div>
        <Providers>
          <div className="relative min-h-screen [padding-top:env(safe-area-inset-top)] [padding-bottom:env(safe-area-inset-bottom)]">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
