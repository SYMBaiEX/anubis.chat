'use client';

import Link from 'next/link';
import { ModeToggle } from '@/components/mode-toggle';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { LogoWithText } from '@/components/ui/logo';
import { Menu } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

        {/* Centered Primary Nav (desktop) */}
        <nav aria-label="Primary" className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 md:block">
          <ul className="pointer-events-auto flex items-center gap-6">
            <li>
              <Link className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground" href="/">
                Home
              </Link>
            </li>
            <li>
              <Link className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground" href="/referral-info">
                Referral Info
              </Link>
            </li>
            <li>
              <Link className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground" href="/roadmap">
                Roadmap
              </Link>
            </li>
          </ul>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="md:hidden" asChild>
              <Button size="icon" type="button" variant="outline">
                <Menu className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/">Home</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/referral-info">Referral Info</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/roadmap">Roadmap</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
