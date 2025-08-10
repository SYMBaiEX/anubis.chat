'use client';

import Link from 'next/link';
import { ModeToggle } from '@/components/mode-toggle';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { LogoWithText } from '@/components/ui/logo';

export default function LandingHeader() {
  const { isAuthenticated } = useAuthContext();

  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-border/50 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
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
    </header>
  );
}
