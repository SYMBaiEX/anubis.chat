import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "../index.css";
import Providers from "@/components/providers";
import Header from "@/components/header";

// PRD Typography: Inter for body, IBM Plex Mono for code
// Note: Satoshi Variable for headers will be loaded via CSS for better Bun runtime performance
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "isis.chat - Ancient Wisdom • Modern AI",
  description: "Solana-native AI chat platform with RAG capabilities. Authenticate with your wallet, chat with AI, and unlock the power of ancient wisdom through modern technology.",
  keywords: ["AI chat", "Solana", "Web3", "RAG", "Ancient Egypt", "Blockchain", "Crypto"],
  authors: [{ name: "SYMBaiEX" }],
  creator: "isis.chat",
  openGraph: {
    title: "isis.chat - Ancient Wisdom • Modern AI",
    description: "Solana-native AI chat platform with RAG capabilities",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "isis.chat - Ancient Wisdom • Modern AI",
    description: "Solana-native AI chat platform with RAG capabilities",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preload Satoshi Variable font for better performance with Bun */}
        <link
          rel="preload"
          href="https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,400&display=swap"
          as="style"
          onLoad="this.onload=null;this.rel='stylesheet'"
        />
        <noscript>
          <link
            rel="stylesheet"
            href="https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,400&display=swap"
          />
        </noscript>
      </head>
      <body
        className={`${inter.variable} ${ibmPlexMono.variable} font-sans antialiased`}
      >
        <Providers>
          <div className="grid grid-rows-[auto_1fr] min-h-screen">
            <Header />
            <main className="flex-1">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
