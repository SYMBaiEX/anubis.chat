'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from "next/navigation";
import { useAuthContext } from '@/components/providers/auth-provider';
import { ModeToggle } from './mode-toggle';
import { WalletConnectButton } from './wallet/wallet-connect-button';
import { Button } from './ui/button';
import { MessageSquare, LayoutDashboard, Home } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuthContext();
  
  // Define navigation links based on authentication status
  const links = isAuthenticated ? [
    { to: '/', label: 'Home', icon: <Home className="h-4 w-4" /> },
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { to: '/chat', label: 'Chat', icon: <MessageSquare className="h-4 w-4" /> }
  ] : [
    { to: '/', label: 'Home', icon: <Home className="h-4 w-4" /> }
  ];

  return (
    <div className="bg-card/80 backdrop-blur-sm border-b border-border/50 transition-all duration-300">
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
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {links.map(({ to, label, icon }) => {
              const isActive = pathname === to;
              return (
                <Link 
                  key={to} 
                  href={to}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition-all duration-300 hover:bg-primary/10 ${
                    isActive 
                      ? 'text-primary bg-primary/10' 
                      : 'text-foreground/70 hover:text-foreground'
                  }`}
                >
                  {icon}
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
          
          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center gap-2">
            {links.map(({ to, icon }) => {
              const isActive = pathname === to;
              return (
                <Link 
                  key={to} 
                  href={to}
                  className={`p-2 rounded-md transition-all duration-300 hover:bg-primary/10 ${
                    isActive 
                      ? 'text-primary bg-primary/10' 
                      : 'text-foreground/70 hover:text-foreground'
                  }`}
                >
                  {icon}
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