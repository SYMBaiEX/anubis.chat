'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthContext } from '@/components/providers/auth-provider';
import { getHeaderNav } from '@/constants/navigation';
import { ModeToggle } from './mode-toggle';
import { WalletConnectButton } from './wallet/wallet-connect-button';

export default function Header() {
  const pathname = usePathname();
  const { isAuthenticated, isAdmin } = useAuthContext();
  const isDev = process.env.NODE_ENV === 'development';
  const navItems = getHeaderNav(isAuthenticated, isDev, isAdmin);

  return (
    <div className="relative overflow-hidden border-border/50 border-b bg-card/80 backdrop-blur-sm transition-all duration-300">
      <div
        aria-hidden="true"
        className="aurora aurora-primary absolute inset-0"
      />
      <div className="flex flex-row items-center justify-between px-4 py-3">
        <nav className="flex items-center gap-6">
          <Link
            className="flex items-center gap-2"
            href={isAuthenticated ? '/dashboard' : '/'}
          >
            <Image
              alt="Anubis Logo"
              className="h-9 w-9"
              height={36}
              src="/favicon.png"
              width={36}
            />
            <h1 className="egypt-text font-light text-xl tracking-wider">
              ANUBIS
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-4 md:flex">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 font-medium transition-all duration-300 hover:bg-primary/10 ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground/70 hover:text-foreground'
                  }`}
                  href={href}
                  key={href}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile Navigation */}
          <div className="flex items-center gap-2 md:hidden">
            {navItems.map(({ href, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  className={`rounded-md p-2 transition-all duration-300 hover:bg-primary/10 ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground/70 hover:text-foreground'
                  }`}
                  href={href}
                  key={href}
                >
                  {Icon && <Icon className="h-5 w-5" />}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="flex items-center gap-3">
          <WalletConnectButton />
          <ModeToggle animated={false} />
        </div>
      </div>
    </div>
  );
}
