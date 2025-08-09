'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ModeToggle } from '@/components/mode-toggle';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { LogoWithText } from '@/components/ui/logo';

export default function LandingHeader() {
  const { isAuthenticated } = useAuthContext();
  const [hidden, setHidden] = useState(false);
  const lastYRef = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
      const delta = y - lastYRef.current;
      if (delta < -4) setHidden(false);
      else if (delta > 4) setHidden(true);
      lastYRef.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={
        `sticky top-0 z-40 overflow-visible bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 transition-transform duration-300` +
        ` ${hidden ? '-translate-y-full' : 'translate-y-0'}`
      }
    >
      <div className="relative mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4">
        {/* Brand */}
        <LogoWithText 
          href={isAuthenticated ? '/dashboard' : '/'} 
          size="md" 
          textVariant="gradient" 
        />

        {/* Actions */}
        <div className="flex items-center gap-3">
          <ModeToggle />
          <Link href={isAuthenticated ? '/dashboard' : '/auth'}>
            <Button className="button-press" size="sm" type="button">
              Enter App
            </Button>
          </Link>
        </div>
      </div>
      {/* soft edge fade under header to avoid hard line */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -bottom-4 h-8 bg-gradient-to-b from-background/0 to-background" />
    </header>
  );
}
