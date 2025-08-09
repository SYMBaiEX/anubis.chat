'use client';

import Link from 'next/link';
import { ModeToggle } from '@/components/mode-toggle';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { LogoWithText } from '@/components/ui/logo';

export default function LandingHeader() {
  const { isAuthenticated } = useAuthContext();

  return (
    <header className="sticky top-0 z-40 overflow-hidden rounded-b-2xl border-border/30 border-b bg-background/85 shadow-sm backdrop-blur-lg supports-[backdrop-filter]:bg-background/80 dark:border-border/50 dark:bg-background/75 dark:shadow-none">
      <div className="relative mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4">
        {/* Brand */}
        <LogoWithText size="md" textVariant="gradient" />

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
