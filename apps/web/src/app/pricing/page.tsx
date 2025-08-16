import type { Metadata } from 'next';
import { FAQJsonLd, ProductJsonLd } from '@/components/seo/jsonLd';
import PricingPageClient from './pricing-client';

// SEO Metadata
export const metadata: Metadata = {
  title: 'Pricing - ANUBIS AI Chat | Affordable AI Chat Plans with SOL',
  description:
    'Choose from Free, Pro, or Pro+ plans for ANUBIS AI Chat. Pay with SOL for premium AI models including GPT-5, Gemini 2.5 Pro, and more. Transparent pricing, no hidden fees.',
  keywords: [
    'AI chat pricing',
    'Solana payment',
    'ChatGPT alternative pricing',
    'Web3 AI subscription',
    'cryptocurrency payment AI',
    'blockchain AI pricing',
    'SOL payment plans',
    'affordable AI chat',
    'premium AI models pricing',
    'decentralized AI cost',
  ],
  openGraph: {
    title: 'ANUBIS AI Chat Pricing - Pay with SOL | Transparent AI Plans',
    description:
      'Affordable AI chat plans starting free. Pay with SOL for premium models like GPT-5, Gemini 2.5 Pro. Choose Free, Pro (0.05 SOL/mo), or Pro+ (0.1 SOL/mo).',
    type: 'website',
    url: 'https://anubis.chat/pricing',
    images: [
      {
        url: '/api/og?title=ANUBIS%20Pricing&description=Pay%20with%20SOL%20for%20Premium%20AI%20Models&theme=pricing',
        width: 1200,
        height: 630,
        alt: 'ANUBIS AI Chat Pricing Plans',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ANUBIS AI Pricing - Pay with SOL',
    description:
      'Transparent pricing for Web3-native AI chat. Free plan available, Pro starts at 0.05 SOL/month.',
    images: [
      '/api/og?title=ANUBIS%20Pricing&description=Pay%20with%20SOL&theme=pricing',
    ],
  },
  alternates: {
    canonical: '/pricing',
  },
};

// FAQ Data for structured data
const faqData = [
  {
    question: 'How does SOL payment work?',
    answer:
      'Payments are processed directly through your Solana wallet. Simply connect your wallet and approve the transaction. No credit cards or traditional payment methods required.',
  },
  {
    question: 'Can I switch plans anytime?',
    answer:
      "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any unused time.",
  },
  {
    question: 'What happens if I exceed my message limit?',
    answer:
      "You'll be notified when you're approaching your limit. Once exceeded, you can either upgrade your plan or wait for the next billing cycle.",
  },
  {
    question: 'Is there a refund policy?',
    answer:
      "Due to the nature of blockchain transactions, we don't offer refunds. However, you can cancel your subscription at any time to prevent future charges.",
  },
  {
    question: 'Do unused messages roll over?',
    answer:
      "Messages reset each billing cycle and don't roll over. We recommend choosing a plan that matches your typical usage.",
  },
];

export default function PricingPage() {
  // Structured data for pricing plans
  const pricingFAQData = faqData.map((faq) => ({
    question: faq.question,
    answer: faq.answer,
  }));

  return (
    <>
      {/* Structured Data */}
      <ProductJsonLd
        aggregateRating={{
          ratingValue: '4.8',
          reviewCount: '1250',
        }}
        brand="ANUBIS AI"
        description="Professional AI chat plan with premium models and unlimited conversations"
        image="https://anubis.chat/assets/pricing-hero.png"
        name="ANUBIS AI Chat Pro Plan"
        offers={{
          price: '0.05',
          priceCurrency: 'SOL',
          availability: 'InStock',
        }}
      />

      <FAQJsonLd questions={pricingFAQData} />

      <PricingPageClient />
    </>
  );
}
