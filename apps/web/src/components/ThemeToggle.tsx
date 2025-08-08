'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  const getIcon = () => {
    if (resolvedTheme === 'dark') {
      return (
        <Moon className="h-[1.2rem] w-[1.2rem] text-isis-primary transition-all" />
      );
    }
    return (
      <Sun className="h-[1.2rem] w-[1.2rem] text-isis-accent transition-all" />
    );
  };

  const getThemeLabel = (themeValue: string) => {
    switch (themeValue) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
      default:
        return 'Theme';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Toggle theme"
          className="border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:bg-card/90"
          size="icon"
          variant="outline"
        >
          {getIcon()}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="border-border/50 bg-card/95 shadow-xl backdrop-blur-sm"
      >
        <DropdownMenuItem
          className={`flex cursor-pointer items-center gap-2 ${
            theme === 'light' ? 'bg-primary/10 text-primary' : ''
          }`}
          onClick={() => setTheme('light')}
        >
          <Sun className="h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem
          className={`flex cursor-pointer items-center gap-2 ${
            theme === 'dark' ? 'bg-primary/10 text-primary' : ''
          }`}
          onClick={() => setTheme('dark')}
        >
          <Moon className="h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          className={`flex cursor-pointer items-center gap-2 ${
            theme === 'system' ? 'bg-primary/10 text-primary' : ''
          }`}
          onClick={() => setTheme('system')}
        >
          <Monitor className="h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Simple toggle button without dropdown (for space-constrained areas)
export function SimpleThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Button
      aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
      className="border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:bg-card/90"
      onClick={toggleTheme}
      size="icon"
      variant="outline"
    >
      <Sun
        className={`h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all ${resolvedTheme === 'dark' ? '-rotate-90 scale-0' : ''}`}
      />
      <Moon
        className={`absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all ${resolvedTheme === 'dark' ? 'rotate-0 scale-100' : ''}`}
      />
    </Button>
  );
}
