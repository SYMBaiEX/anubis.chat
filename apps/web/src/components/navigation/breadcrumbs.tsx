'use client';

import { motion } from 'framer-motion';
import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
  separator?: React.ReactNode;
  showHome?: boolean;
}

export function Breadcrumbs({
  items,
  className,
  separator = <ChevronRight className="h-4 w-4" />,
  showHome = true,
}: BreadcrumbsProps) {
  const pathname = usePathname();

  // Auto-generate breadcrumbs from pathname if not provided
  const breadcrumbItems = items || generateBreadcrumbs(pathname);

  // Add home to the beginning if requested
  const finalItems = showHome
    ? [
        { label: 'Home', href: '/', icon: <Home className="h-4 w-4" /> },
        ...breadcrumbItems,
      ]
    : breadcrumbItems;

  if (finalItems.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-2 text-sm', className)}
    >
      <ol className="flex items-center space-x-2">
        {finalItems.map((item, index) => {
          const isLast = index === finalItems.length - 1;

          return (
            <motion.li
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center"
              initial={{ opacity: 0, x: -10 }}
              key={item.href || item.label}
              transition={{ delay: index * 0.05 }}
            >
              {isLast ? (
                <span
                  aria-current="page"
                  className="flex items-center gap-1 font-medium text-foreground"
                >
                  {item.icon}
                  {item.label}
                </span>
              ) : (
                <>
                  <Link
                    className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                    href={item.href || '#'}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                  <span
                    aria-hidden="true"
                    className="mx-2 text-muted-foreground"
                  >
                    {separator}
                  </span>
                </>
              )}
            </motion.li>
          );
        })}
      </ol>
    </nav>
  );
}

// Helper function to generate breadcrumbs from pathname
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return [];
  }

  const breadcrumbs: BreadcrumbItem[] = [];
  let currentPath = '';

  for (const segment of segments) {
    currentPath += `/${segment}`;

    // Format the label (capitalize, replace hyphens with spaces)
    const label = segment
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    breadcrumbs.push({
      label: getCustomLabel(segment) || label,
      href: currentPath,
    });
  }

  // Remove href from last item (current page)
  if (breadcrumbs.length > 0) {
    const lastItem = breadcrumbs.at(-1);
    if (lastItem) {
      breadcrumbs[breadcrumbs.length - 1] = { label: lastItem.label };
    }
  }

  return breadcrumbs;
}

// Custom labels for specific routes
function getCustomLabel(segment: string): string | null {
  const customLabels: Record<string, string> = {
    chat: 'Chat',
    agents: 'AI Agents',
    workflows: 'Workflows',
    mcp: 'MCP',
    dashboard: 'Dashboard',
    settings: 'Settings',
    profile: 'Profile',
    'book-of-the-dead': 'Book of the Dead',
    subscription: 'Subscription',
    'referral-info': 'Referral Program',
    legal: 'Legal',
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    cookies: 'Cookie Policy',
  };

  return customLabels[segment] || null;
}

// Breadcrumbs with dropdown for mobile
export function MobileBreadcrumbs({
  items,
  className,
  showHome = true,
}: BreadcrumbsProps) {
  const pathname = usePathname();
  const breadcrumbItems = items || generateBreadcrumbs(pathname);
  const finalItems = showHome
    ? [
        { label: 'Home', href: '/', icon: <Home className="h-4 w-4" /> },
        ...breadcrumbItems,
      ]
    : breadcrumbItems;

  if (finalItems.length === 0) {
    return null;
  }

  const currentItem = finalItems.at(-1);
  const previousItems = finalItems.slice(0, -1);

  if (!currentItem) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center text-sm md:hidden', className)}
    >
      <div className="flex items-center space-x-2">
        {previousItems.length > 0 && (
          <div className="relative">
            <select
              className="appearance-none bg-transparent pr-8 text-muted-foreground focus:text-foreground"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  window.location.href = e.target.value;
                }
              }}
            >
              <option disabled value="">
                Navigate to...
              </option>
              {previousItems.map((item) => (
                <option key={item.href} value={item.href}>
                  {item.label}
                </option>
              ))}
            </select>
            <ChevronRight className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-2 h-4 w-4" />
          </div>
        )}
        <span className="font-medium text-foreground">
          {currentItem.icon}
          {currentItem.label}
        </span>
      </div>
    </nav>
  );
}

// Breadcrumbs with JSON-LD structured data
export function BreadcrumbsWithSchema({
  items,
  className,
  showHome = true,
}: BreadcrumbsProps) {
  const pathname = usePathname();
  const breadcrumbItems = items || generateBreadcrumbs(pathname);
  const finalItems = showHome
    ? [
        { label: 'Home', href: '/', icon: <Home className="h-4 w-4" /> },
        ...breadcrumbItems,
      ]
    : breadcrumbItems;

  // Generate JSON-LD schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: finalItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.href
        ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://anubis.chat'}${item.href}`
        : undefined,
    })),
  };

  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        type="application/ld+json"
      />
      <Breadcrumbs className={className} items={items} showHome={showHome} />
    </>
  );
}
