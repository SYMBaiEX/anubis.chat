"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "@/contexts/ThemeContext";
import { WalletButton } from "./wallet/wallet-button";

export default function Header() {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  
  const links = [
    { to: "/", label: "Home" },
    { to: "/todos", label: "Todos" },
  ];

  return (
    <div className="bg-card/80 backdrop-blur-sm border-b border-border/50 transition-all duration-300">
      <div className="flex flex-row items-center justify-between px-4 py-2 gap-4">
        <nav className="flex gap-4 md:gap-6 text-base md:text-lg">
          {links.map(({ to, label }) => {
            const isActive = pathname === to;
            return (
              <Link 
                key={to} 
                href={to}
                className={`font-medium transition-all duration-300 hover:text-primary ${
                  isActive 
                    ? 'text-primary relative after:absolute after:bottom-[-8px] after:left-0 after:w-full after:h-0.5 after:bg-primary after:rounded-full' 
                    : 'text-foreground/70 hover:text-foreground'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2 md:gap-3">
          {/* Logo/Brand - Hidden on very small screens */}
          <div className="hidden sm:block text-lg md:text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            ISIS.chat
          </div>
          <div className="hidden sm:block w-px h-6 bg-border/50" />
          <div className="flex items-center gap-1 md:gap-2">
            <WalletButton size="sm" />
            <div className="w-px h-6 bg-border/50" />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
