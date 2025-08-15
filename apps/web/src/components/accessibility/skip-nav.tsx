'use client';

import { cn } from '@/lib/utils';

interface SkipNavProps {
  mainContentId?: string;
  className?: string;
}

/**
 * Skip navigation link for keyboard accessibility
 * Allows users to skip to main content
 */
export function SkipNav({
  mainContentId = 'main-content',
  className,
}: SkipNavProps) {
  return (
    <a
      className={cn(
        'sr-only focus:not-sr-only',
        'absolute top-4 left-4 z-[9999]',
        'rounded-md bg-primary px-4 py-2 text-primary-foreground',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'transition-all',
        className
      )}
      href={`#${mainContentId}`}
    >
      Skip to main content
    </a>
  );
}

/**
 * Skip navigation container with multiple links
 */
interface SkipNavLinksProps {
  links?: Array<{
    id: string;
    label: string;
  }>;
  className?: string;
}

export function SkipNavLinks({
  links = [
    { id: 'main-content', label: 'Skip to main content' },
    { id: 'navigation', label: 'Skip to navigation' },
    { id: 'footer', label: 'Skip to footer' },
  ],
  className,
}: SkipNavLinksProps) {
  return (
    <nav
      aria-label="Skip navigation"
      className={cn(
        'sr-only focus-within:not-sr-only',
        'absolute top-0 left-0 z-[9999]',
        className
      )}
    >
      <ul className="flex gap-2 p-4">
        {links.map((link) => (
          <li key={link.id}>
            <a
              className={cn(
                'rounded-md bg-primary px-3 py-2 text-primary-foreground text-sm',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                'transition-colors hover:bg-primary/90'
              )}
              href={`#${link.id}`}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
