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
 * Displays "ISIS CHAT" in large, styled text with optional icon
 */
export function HeroLogo({
  className,
  showIcon = true,
  iconSize = 'xl',
}: HeroLogoProps) {
  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {showIcon && (
        <div className="animate-pulse">
          <LogoIcon className="drop-shadow-2xl" size={iconSize} />
        </div>
      )}
      <div className="space-y-2 text-center">
        <h1 className="font-bold text-5xl tracking-tight lg:text-7xl">
          <span className="text-gradient">ISIS CHAT</span>
        </h1>
        <div className="egypt-text text-2xl lg:text-3xl">
          Where AI Meets Blockchain
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
        <h2 className="font-bold text-2xl text-gradient">ISIS CHAT</h2>
        <p className="egypt-text text-sm">Ancient Wisdom • Modern Tech</p>
      </div>
    </div>
  );
}
