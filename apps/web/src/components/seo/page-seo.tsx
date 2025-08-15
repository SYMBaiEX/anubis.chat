import { OrganizationJsonLd, WebApplicationJsonLd, BreadcrumbJsonLd } from './jsonLd';
import { StructuredData } from './structured-data';

interface PageSEOProps {
  title?: string;
  description?: string;
  path?: string;
  breadcrumbs?: Array<{ name: string; url: string }>;
  type?: 'website' | 'article' | 'product' | 'service';
  schema?: 'WebApplication' | 'Organization' | 'Product' | 'Article' | 'FAQ';
  customStructuredData?: Record<string, any>;
}

/**
 * Comprehensive SEO component for pages
 * Includes structured data, breadcrumbs, and organization info
 */
export function PageSEO({
  title = 'ANUBIS AI Chat',
  description = 'Web3-native AI chat platform with Solana integration',
  path = '',
  breadcrumbs,
  type = 'website',
  schema = 'WebApplication',
  customStructuredData,
}: PageSEOProps) {
  const fullUrl = `https://anubis.chat${path}`;

  // Generate breadcrumbs if not provided
  const defaultBreadcrumbs = path
    ? [
        { name: 'Home', url: 'https://anubis.chat' },
        { name: title, url: fullUrl },
      ]
    : [];

  const finalBreadcrumbs = breadcrumbs || defaultBreadcrumbs;

  return (
    <>
      {/* Organization Schema */}
      <OrganizationJsonLd />

      {/* Application Schema */}
      {schema === 'WebApplication' && (
        <WebApplicationJsonLd
          name={title}
          description={description}
          url={fullUrl}
        />
      )}

      {/* Breadcrumbs */}
      {finalBreadcrumbs.length > 1 && (
        <BreadcrumbJsonLd items={finalBreadcrumbs} />
      )}

      {/* Custom Structured Data */}
      {customStructuredData && (
        <StructuredData data={customStructuredData} />
      )}
    </>
  );
}