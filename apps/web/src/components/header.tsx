'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from "next/navigation";
import { ModeToggle } from './mode-toggle';
import { getHeaderNav } from '@/constants/navigation';
import { useAuthContext } from '@/components/providers/auth-provider';
import { WalletConnectButton } from './wallet/wallet-connect-button';


export default function Header() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuthContext();
  const isDev = process.env.NODE_ENV === 'development';
  const navItems = getHeaderNav(isAuthenticated, isDev);
  

  return (
    <div className="relative bg-card/80 backdrop-blur-sm border-b border-border/50 transition-all duration-300 overflow-hidden">
      <div className="absolute inset-0 aurora aurora-primary" aria-hidden="true" />
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
            <h1 className="font-light text-xl tracking-wider egypt-text">ISIS</h1>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition-all duration-300 hover:bg-primary/10 ${
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-foreground/70 hover:text-foreground'
                  }`}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
          
          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center gap-2">
            {navItems.map(({ href, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link 
                  key={href}
                  href={href}
                  className={`p-2 rounded-md transition-all duration-300 hover:bg-primary/10 ${
                    isActive 
                      ? 'text-primary bg-primary/10' 
                      : 'text-foreground/70 hover:text-foreground'
                  }`}
                >
                  {Icon && <Icon className="h-5 w-5" />}
                </Link>
              );
            })}
          </div>
        </nav>
        
        <div className="flex items-center gap-3">
          <WalletConnectButton />
          <ModeToggle />
        </div>
      </div>
    </div>
  );
}