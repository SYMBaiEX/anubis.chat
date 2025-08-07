"use client";

import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const getIcon = () => {
    if (resolvedTheme === 'dark') {
      return <Moon className="h-[1.2rem] w-[1.2rem] text-isis-primary transition-all" />;
    }
    return <Sun className="h-[1.2rem] w-[1.2rem] text-isis-accent transition-all" />;
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
          variant="outline"
          size="icon"
          className="border-border/50 bg-card/80 backdrop-blur-sm hover:bg-card/90 hover:border-primary/50 transition-all duration-300"
          aria-label="Toggle theme"
        >
          {getIcon()}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="bg-card/95 backdrop-blur-sm border-border/50 shadow-xl"
      >
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className={`cursor-pointer flex items-center gap-2 ${
            theme === 'light' ? 'bg-primary/10 text-primary' : ''
          }`}
        >
          <Sun className="h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className={`cursor-pointer flex items-center gap-2 ${
            theme === 'dark' ? 'bg-primary/10 text-primary' : ''
          }`}
        >
          <Moon className="h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className={`cursor-pointer flex items-center gap-2 ${
            theme === 'system' ? 'bg-primary/10 text-primary' : ''
          }`}
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
  const { toggleTheme, resolvedTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="border-border/50 bg-card/80 backdrop-blur-sm hover:bg-card/90 hover:border-primary/50 transition-all duration-300"
      aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <Sun className={`h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all ${resolvedTheme === 'dark' ? '-rotate-90 scale-0' : ''}`} />
      <Moon className={`absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all ${resolvedTheme === 'dark' ? 'rotate-0 scale-100' : ''}`} />
    </Button>
  );
}