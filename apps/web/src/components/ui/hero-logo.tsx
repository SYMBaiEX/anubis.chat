'use client';

import { cn } from '@/lib/utils';
import { LogoIcon } from './logo';

interface HeroLogoProps {
  className?: string;
  /** Show the logo icon above the text */
  showIcon?: boolean;
  /** Custom size for the icon */
  iconSize?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Large hero logo for landing pages and splash screens
 * Displays "anubis.chat" in large, styled text with optional icon
 */
export function HeroLogo({
  className,
  showIcon = true,
  iconSize = 'xl',
}: HeroLogoProps) {
  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <div className="space-y-2 text-center">
        <h1 className="font-extrabold font-heading text-5xl tracking-tight lg:text-7xl">
          <span className="bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text text-transparent">
            anubis
          </span>
          <span className="text-muted-foreground">.chat</span>
        </h1>
        <div className="egypt-text text-xl lg:text-2xl">
          Ancient Wisdom • Modern AI
        </div>
      </div>
    </div>
  );
}

/**
 * Compact hero logo variant for smaller spaces
 */
export function CompactHeroLogo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <LogoIcon size="lg" />
      <div>
        <h2 className="font-extrabold font-heading text-2xl">
          <span className="bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text text-transparent">
            anubis
          </span>
          <span className="text-muted-foreground">.chat</span>
        </h2>
        <p className="egypt-text text-sm">Ancient Wisdom • Modern AI</p>
      </div>
    </div>
  );
}
