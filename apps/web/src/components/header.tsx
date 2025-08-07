'use client';
import Image from 'next/image';
import Link from 'next/link';
<<<<<<< HEAD
import { usePathname } from "next/navigation";
=======
>>>>>>> upstream/main

import { ModeToggle } from './mode-toggle';
import { WalletConnectButton } from './wallet/wallet-connect-button';

export default function Header() {
<<<<<<< HEAD
  const pathname = usePathname();
  const links = [{ to: '/', label: 'Home' }];

  return (
    <div className="bg-card/80 backdrop-blur-sm border-b border-border/50 transition-all duration-300">
=======
  const links = [{ to: '/', label: 'Home' }];

  return (
    <div className="border-border border-b-2">
>>>>>>> upstream/main
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
            const isActive = pathname === to;
            return (
<<<<<<< HEAD
              <Link 
                key={to} 
                href={to}
                className={`font-medium transition-all duration-300 hover:text-primary ${
                  isActive 
                    ? 'text-primary relative after:absolute after:bottom-[-8px] after:left-0 after:w-full after:h-0.5 after:bg-primary after:rounded-full' 
                    : 'text-foreground/70 hover:text-foreground'
                }`}
=======
              <Link
                className="text-muted-foreground transition-colors hover:text-foreground"
                href={to}
                key={to}
>>>>>>> upstream/main
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
