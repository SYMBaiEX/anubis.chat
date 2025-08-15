import Script from 'next/script';

interface OrganizationJsonLdProps {
  name?: string;
  url?: string;
  logo?: string;
  description?: string;
  sameAs?: string[];
}

export function OrganizationJsonLd({
  name = 'ANUBIS Chat',
  url = 'https://anubis.chat',
  logo = 'https://anubis.chat/logo.png',
  description = 'Next-generation AI-powered chat platform with Web3 integration',
  sameAs = [
    'https://twitter.com/anubischat',
    'https://github.com/anubischat',
    'https://linkedin.com/company/anubischat',
  ],
}: OrganizationJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo,
    description,
    sameAs,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-XXX-XXX-XXXX',
      contactType: 'customer service',
      areaServed: 'Worldwide',
      availableLanguage: ['English'],
    },
  };

  return (
    <Script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      id="organization-jsonld"
      strategy="afterInteractive"
      type="application/ld+json"
    />
  );
}

interface WebApplicationJsonLdProps {
  name?: string;
  url?: string;
  description?: string;
  applicationCategory?: string;
  operatingSystem?: string;
  offers?: {
    price: string;
    priceCurrency: string;
  };
}

export function WebApplicationJsonLd({
  name = 'ANUBIS Chat',
  url = 'https://anubis.chat',
  description = 'AI-powered chat application with real-time messaging and Web3 integration',
  applicationCategory = 'CommunicationApplication',
  operatingSystem = 'Web Browser',
  offers = {
    price: '0',
    priceCurrency: 'USD',
  },
}: WebApplicationJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    url,
    description,
    applicationCategory,
    operatingSystem,
    offers: {
      '@type': 'Offer',
      ...offers,
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1250',
      bestRating: '5',
      worstRating: '1',
    },
    screenshot: [
      'https://anubis.chat/screenshots/dashboard.png',
      'https://anubis.chat/screenshots/chat.png',
      'https://anubis.chat/screenshots/agents.png',
    ],
  };

  return (
    <Script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      id="webapp-jsonld"
      strategy="afterInteractive"
      type="application/ld+json"
    />
  );
}

interface BreadcrumbJsonLdProps {
  items: Array<{
    name: string;
    url: string;
  }>;
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <Script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      id="breadcrumb-jsonld"
      strategy="afterInteractive"
      type="application/ld+json"
    />
  );
}

interface FAQJsonLdProps {
  questions: Array<{
    question: string;
    answer: string;
  }>;
}

export function FAQJsonLd({ questions }: FAQJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <Script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      id="faq-jsonld"
      strategy="afterInteractive"
      type="application/ld+json"
    />
  );
}

interface ArticleJsonLdProps {
  headline: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  author: {
    name: string;
    url?: string;
  };
}

export function ArticleJsonLd({
  headline,
  description,
  image,
  datePublished,
  dateModified,
  author,
}: ArticleJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    image,
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Person',
      name: author.name,
      url: author.url,
    },
    publisher: {
      '@type': 'Organization',
      name: 'ANUBIS Chat',
      logo: {
        '@type': 'ImageObject',
        url: 'https://anubis.chat/logo.png',
      },
    },
  };

  return (
    <Script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      id="article-jsonld"
      strategy="afterInteractive"
      type="application/ld+json"
    />
  );
}

interface VideoJsonLdProps {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration: string;
  contentUrl: string;
  embedUrl: string;
}

export function VideoJsonLd({
  name,
  description,
  thumbnailUrl,
  uploadDate,
  duration,
  contentUrl,
  embedUrl,
}: VideoJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name,
    description,
    thumbnailUrl,
    uploadDate,
    duration,
    contentUrl,
    embedUrl,
    publisher: {
      '@type': 'Organization',
      name: 'ANUBIS Chat',
      logo: {
        '@type': 'ImageObject',
        url: 'https://anubis.chat/logo.png',
      },
    },
  };

  return (
    <Script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      id="video-jsonld"
      strategy="afterInteractive"
      type="application/ld+json"
    />
  );
}

interface ProductJsonLdProps {
  name: string;
  description: string;
  image: string;
  brand: string;
  offers: {
    price: string;
    priceCurrency: string;
    availability: 'InStock' | 'OutOfStock' | 'PreOrder';
  };
  aggregateRating?: {
    ratingValue: string;
    reviewCount: string;
  };
}

export function ProductJsonLd({
  name,
  description,
  image,
  brand,
  offers,
  aggregateRating,
}: ProductJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image,
    brand: {
      '@type': 'Brand',
      name: brand,
    },
    offers: {
      '@type': 'Offer',
      url: 'https://anubis.chat/subscription',
      priceCurrency: offers.priceCurrency,
      price: offers.price,
      availability: `https://schema.org/${offers.availability}`,
    },
    ...(aggregateRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: aggregateRating.ratingValue,
        reviewCount: aggregateRating.reviewCount,
      },
    }),
  };

  return (
    <Script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      id="product-jsonld"
      strategy="afterInteractive"
      type="application/ld+json"
    />
  );
}
