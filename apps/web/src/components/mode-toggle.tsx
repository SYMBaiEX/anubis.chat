'use client';

import { api } from '@convex/_generated/api';
import { useMutation } from 'convex/react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { applyThemeWithTransition } from '@/lib/theme-transition';

export function ModeToggle({ animated = true }: { animated?: boolean } = {}) {
  const { setTheme } = useTheme();
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
          onClick={async () => {
            applyThemeWithTransition('light', setTheme, { animated });
            if (isAuthenticated) {
              try {
                await updateUserPreferences({ theme: 'light' });
              } catch (_error) {}
            }
          }}
        >
          Light
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={async () => {
            applyThemeWithTransition('dark', setTheme, { animated });
            if (isAuthenticated) {
              try {
                await updateUserPreferences({ theme: 'dark' });
              } catch (_error) {}
            }
          }}
        >
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={async () => {
            applyThemeWithTransition('system', setTheme, { animated });
            if (isAuthenticated) {
              try {
                await updateUserPreferences({ theme: 'system' });
              } catch (_error) {}
            }
          }}
        >
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
