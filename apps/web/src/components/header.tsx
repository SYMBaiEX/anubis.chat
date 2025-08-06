'use client';
import Image from 'next/image';
import Link from 'next/link';

import { ModeToggle } from './mode-toggle';
import { WalletConnectButton } from './wallet/wallet-connect-button';

export default function Header() {
  const links = [{ to: '/', label: 'Home' }];

  return (
    <div className="border-border border-b-2">
      <div className="flex flex-row items-center justify-between px-4 py-3">
        <nav className="flex items-center gap-6">
          <Link className="flex items-center gap-2" href="/">
            <Image
              alt="ISIS Logo"
              className="h-9 w-9"
              height={36}
              src="/favicon.png"
              width={36}
            />
            <h1 className="font-light text-xl tracking-wider">ISIS</h1>
          </Link>
          {links.map(({ to, label }) => {
            return (
              <Link
                className="text-muted-foreground transition-colors hover:text-foreground"
                href={to}
                key={to}
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
