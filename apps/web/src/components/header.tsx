'use client';
import Link from 'next/link';
import Image from 'next/image';

import { ModeToggle } from './mode-toggle';
import { WalletConnectButton } from './wallet/wallet-connect-button';

export default function Header() {
  const links = [
    { to: '/', label: 'Home' },
  ];

  return (
    <div className="border-b-2 border-border">
      <div className="flex flex-row items-center justify-between px-4 py-3">
        <nav className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Image 
              src="/favicon.png" 
              alt="ISIS Logo" 
              width={36} 
              height={36}
              className="h-9 w-9"
            />
            <h1 className="text-xl font-light tracking-wider">ISIS</h1>
          </Link>
          {links.map(({ to, label }) => {
            return (
              <Link 
                href={to} 
                key={to}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          <WalletConnectButton />
          <ModeToggle />
        </div>
      </div>
    </div>
  );
}