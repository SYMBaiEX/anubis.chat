'use client';

import { api } from '@convex/_generated/api';
import { useMutation } from 'convex/react';
import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const { isAuthenticated } = useAuthContext();
  const updateUserPreferences = useMutation(
    api.userPreferences.updateUserPreferences
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="outline">
          <Sun className="dark:-rotate-90 h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          className="flex items-center justify-between"
          onClick={() => {
            setTheme('light');
            // Update preferences asynchronously without blocking UI
            if (isAuthenticated) {
              updateUserPreferences({ theme: 'light' }).catch(() => {
                // Silently handle errors to avoid UI blocking
              });
            }
          }}
        >
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4" />
            <span>Light</span>
          </div>
          {theme === 'light' && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center justify-between"
          onClick={() => {
            setTheme('dark');
            // Update preferences asynchronously without blocking UI
            if (isAuthenticated) {
              updateUserPreferences({ theme: 'dark' }).catch(() => {
                // Silently handle errors to avoid UI blocking
              });
            }
          }}
        >
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4" />
            <span>Dark</span>
          </div>
          {theme === 'dark' && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center justify-between"
          onClick={() => {
            setTheme('system');
            // Update preferences asynchronously without blocking UI
            if (isAuthenticated) {
              updateUserPreferences({ theme: 'system' }).catch(() => {
                // Silently handle errors to avoid UI blocking
              });
            }
          }}
        >
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            <span>System</span>
          </div>
          {theme === 'system' && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
