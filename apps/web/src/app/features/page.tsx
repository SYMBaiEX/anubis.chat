import type { Metadata } from 'next';
import { WebApplicationJsonLd } from '@/components/seo/jsonLd';
import FeaturesPageClient from './features-client';

// SEO Metadata
export const metadata: Metadata = {
  title: 'Features - ANUBIS AI Chat | Advanced AI Features & Web3 Integration',
  description: 'Discover ANUBIS AI Chat features: multiple AI models (GPT-5, Gemini 2.5), Solana wallet integration, custom agents, RAG capabilities, and blockchain-powered conversations.',
  keywords: [
    'AI chat features',
    'GPT-5 access',
    'Gemini 2.5 Pro',
    'Solana AI integration',
    'custom AI agents',
    'RAG AI system',
    'Web3 chat features',
    'blockchain AI capabilities',
    'multimodal AI chat',
    'AI conversation features',
  ],
  openGraph: {
    title: 'ANUBIS AI Features - Advanced Web3 AI Chat Capabilities',
    description: 'Multiple AI models, Solana integration, custom agents, RAG system, and more. Experience the most advanced Web3-native AI chat platform.',
    type: 'website',
    url: 'https://anubis.chat/features',
    images: [
      {
        url: '/api/og?title=ANUBIS%20Features&description=Advanced%20Web3%20AI%20Chat%20Platform&theme=features',
        width: 1200,
        height: 630,
        alt: 'ANUBIS AI Chat Features',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ANUBIS AI Features - Web3 AI Chat',
    description: 'Multiple AI models, Solana integration, custom agents, and more advanced features.',
    images: ['/api/og?title=ANUBIS%20Features&description=Web3%20AI%20Chat&theme=features'],
  },
  alternates: {
    canonical: '/features',
  },
};

export default function FeaturesPage() {
  return (
    <>
      <WebApplicationJsonLd
        name="ANUBIS AI Chat Features"
        description="Advanced AI features with Web3 integration"
        url="https://anubis.chat/features"
        applicationCategory="AI Assistant"
        operatingSystem="Web"
      />
      <FeaturesPageClient />
    </>
  );
}