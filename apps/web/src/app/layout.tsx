import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '../index.css';
import { ErrorBoundary } from '@/components/error-boundary';
import Header from '@/components/header';
import Providers from '@/components/providers';
import ServiceWorkerManager from '@/components/service-worker-manager';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ISIS Chat - AI Chat Platform with Web3',
  description: 'Next-generation AI chat platform combining advanced RAG capabilities with Solana Web3 integration. Upload documents, create intelligent chatbots, and interact with multiple AI models.',
  keywords: 'AI chat, Web3, Solana, RAG, document search, chatbot, Claude, GPT-4',
  authors: [{ name: 'ISIS Chat Team' }],
  creator: 'ISIS Chat',
  publisher: 'ISIS Chat',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon/apple-touch-icon.png',
  },
  manifest: '/manifest.webmanifest',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <Providers>
            <ServiceWorkerManager />
            <div className="grid h-svh grid-rows-[auto_1fr]">
              <Header />
              {children}
            </div>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
