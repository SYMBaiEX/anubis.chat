import type { Metadata, Viewport } from 'next';
import { Inter, IBM_Plex_Mono } from 'next/font/google';
import '../index.css';
import { ErrorBoundary } from '@/components/error-boundary';
import Sidebar from '@/components/sidebar';
import Header from '@/components/header';
import Providers from '@/components/providers';
import LayoutWrapper from '@/components/layout-wrapper';
import ServiceWorkerManager from '@/components/service-worker-manager';

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
  title: "ISIS Chat - Ancient Wisdom • Modern AI",
  description: "Solana-native AI chat platform with RAG capabilities. Authenticate with your wallet, chat with AI, and unlock the power of ancient wisdom through modern technology.",
  keywords: ["AI chat", "Solana", "Web3", "RAG", "Ancient Egypt", "Blockchain", "Crypto", "Claude", "GPT-4"],
  authors: [{ name: "ISIS Chat Team" }],
  creator: "ISIS Chat",
  publisher: "ISIS Chat",
  openGraph: {
    title: "ISIS Chat - Ancient Wisdom • Modern AI",
    description: "Solana-native AI chat platform with RAG capabilities",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "ISIS Chat - Ancient Wisdom • Modern AI",
    description: "Solana-native AI chat platform with RAG capabilities",
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
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,400&display=swap"
        />
      </head>
      <body
        className={`${inter.variable} ${ibmPlexMono.variable} font-sans antialiased`}
      >
        <ErrorBoundary>
          <Providers>
            <ServiceWorkerManager />
            <div className="flex h-screen">
              <Sidebar />
              <div className="flex-1 flex flex-col">
                <Header />
                <main className="flex-1 overflow-auto">
                  {children}
                </main>
              </div>
            </div>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
