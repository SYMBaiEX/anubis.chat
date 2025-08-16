import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import '../index.css';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from "@vercel/speed-insights/next"
import { ErrorBoundary } from '@/components/error-boundary';
import { GlobalErrorHandler } from '@/components/error-boundary/global-error-handler';
import { globalCommandPalette as GlobalCommandPalette } from '@/components/globalCommandPalette';
import {
  PreloadScripts,
  PreloadStyles,
  ResourceHints,
} from '@/components/prefetch/prefetchLinks';
import Providers from '@/components/providers';
import SchemaMarkup from '@/components/schema-markup';
import {
  OrganizationJsonLd,
  WebApplicationJsonLd,
} from '@/components/seo/jsonLd';
import ServiceWorkerManager from '@/components/service-worker-manager';
import { ThemeProvider } from '@/components/theme-provider';
import {
  ScrollProgressIndicator,
  ScrollToTopButton,
} from '@/components/ui/smooth-scroll';
import { Toaster } from '@/components/ui/toaster';
import { themeInitScript } from '@/lib/theme-script';

// Typography: Geist Sans for body and headers, Geist Mono for code
// Optimized for Next.js font loading and Bun runtime performance

export const metadata: Metadata = {
  metadataBase: new URL('https://anubis.chat'),
  title:
    'ANUBIS AI Chat - Web3 AI Assistant | Solana-Native ChatGPT Alternative',
  description:
    'Advanced AI chat platform with premium models: GPT-5, GPT-5 Mini, Gemini 2.5 Pro, o4-mini, plus free models: GPT-OSS-20B, GLM-4.5-Air, Qwen3-Coder, Kimi K2. Solana wallet authentication, RAG capabilities, and Web3 integration. Better privacy and lower costs than traditional AI chat services.',
  keywords: [
    'AI chat platform',
    'ChatGPT alternative',
    'AI assistant',
    'Solana AI',
    'Web3 AI chat',
    'GPT-5',
    'Gemini 2.5',
    'blockchain AI',
    'crypto AI chat',
    'decentralized AI',
    'AI conversation',
    'multi-model AI',
    'wallet authentication',
    'RAG AI',
    'conversational AI',
    'AI chatbot',
    'artificial intelligence',
    'machine learning chat',
    'Solana dApp',
    'Web3 technology',
  ],
  authors: [{ name: 'anubis.chat Team' }],
  creator: 'anubis.chat',
  publisher: 'anubis.chat',
  openGraph: {
    title: 'ANUBIS AI Chat - Web3 AI Assistant | ChatGPT Alternative',
    description:
      'Advanced AI chat with GPT-5, GPT-5 Mini, Gemini 2.5 Pro, o4-mini & free models. Solana wallet auth, Web3 integration. Better privacy & lower costs.',
    type: 'website',
    locale: 'en_US',
    url: 'https://anubis.chat',
    siteName: 'ANUBIS AI Chat',
    images: [
      {
        url: '/api/og?title=ANUBIS%20Chat&description=Next-generation%20AI-powered%20chat%20platform&theme=dark',
        width: 1200,
        height: 630,
        alt: 'ANUBIS AI Chat – Web3 AI Assistant',
      },
      {
        url: '/assets/hero-preview-dark.png',
        width: 1200,
        height: 630,
        alt: 'ANUBIS AI Chat – Web3 AI Assistant',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ANUBIS AI Chat - Web3 AI Assistant',
    description:
      'Advanced AI chat with GPT-5, GPT-5 Mini, Gemini 2.5 Pro, o4-mini & free models. Solana wallet auth, Web3 integration.',
    creator: '@anubischat',
    site: '@anubischat',
    images: ['/assets/hero-preview-light.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/',
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Theme initialization script - runs before hydration and is identical on server and client */}
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        {/* Smooth scrolling is enabled via CSS in index.css */}
        {/* Geist fonts are loaded via Next.js font optimization */}
      </head>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} ${GeistSans.className} min-h-screen bg-background antialiased transition-colors duration-300`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
          storageKey="anubis-theme"
          themes={['light', 'dark']}
        >
          <ErrorBoundary>
            <Providers>
              <GlobalErrorHandler />
              <SchemaMarkup />
              <ServiceWorkerManager />
              <OrganizationJsonLd />
              <WebApplicationJsonLd />
              <ResourceHints />
              <PreloadStyles />
              <PreloadScripts />
              <main className="relative z-10 min-h-screen w-full overflow-x-hidden">
                {children}
              </main>
              <GlobalCommandPalette />
              <Toaster />
              <ScrollProgressIndicator />
              <ScrollToTopButton />
            </Providers>
          </ErrorBoundary>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
