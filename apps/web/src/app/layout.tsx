import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, Inter } from 'next/font/google';
import '../index.css';
import { ErrorBoundary } from '@/components/error-boundary';
import Providers from '@/components/providers';
import ServiceWorkerManager from '@/components/service-worker-manager';
import { Toaster } from '@/components/ui/toaster';

// PRD Typography: Inter for body, IBM Plex Mono for code
// Note: Satoshi Variable for headers will be loaded via CSS for better Bun runtime performance
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-ibm-plex-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'anubis.chat - Ancient Wisdom • Modern AI',
  description:
    'Solana-native AI chat platform with RAG capabilities. Authenticate with your wallet, chat with AI, and unlock the power of ancient wisdom through modern technology.',
  keywords: [
    'AI chat',
    'Solana',
    'Web3',
    'RAG',
    'Ancient Egypt',
    'Blockchain',
    'Crypto',
    'Claude',
    'GPT-4',
  ],
  authors: [{ name: 'anubis.chat Team' }],
  creator: 'anubis.chat',
  publisher: 'anubis.chat',
  openGraph: {
    title: 'anubis.chat - Ancient Wisdom • Modern AI',
    description: 'Solana-native AI chat platform with RAG capabilities',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'anubis.chat - Ancient Wisdom • Modern AI',
    description: 'Solana-native AI chat platform with RAG capabilities',
  },
  robots: {
    index: true,
    follow: true,
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
        {/* Load Satoshi font stylesheet without client event handlers */}
        <link
          crossOrigin="anonymous"
          href="https://api.fontshare.com"
          rel="preconnect"
        />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${inter.variable} ${ibmPlexMono.variable} font-sans antialiased`}
      >
        <ErrorBoundary>
          <Providers>
            <ServiceWorkerManager />
            <main className="min-h-screen w-full overflow-x-hidden">
              {children}
            </main>
            <Toaster />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
