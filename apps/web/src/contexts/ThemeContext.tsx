"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  colors: {
    primary: string;
    accent: string;
    error: string;
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    border: string;
    muted: string;
    mutedForeground: string;
    egypt: {
      gold: string;
      bronze: string;
      amber: string;
      stone: string;
      darkStone: string;
    };
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'isis-chat-theme';

// ISIS.chat brand colors from PRD
const colors = {
  primary: '#14F195',
  accent: '#8247E5', 
  error: '#FF5F56',
  background: {
    light: '#F8F9FB',
    dark: '#0E0E10',
  },
  foreground: {
    light: '#1A1A1A',
    dark: '#F1F1F1',
  },
  card: {
    light: '#FFFFFF',
    dark: '#1A1A1A',
  },
  cardForeground: {
    light: '#1A1A1A', 
    dark: '#F1F1F1',
  },
  border: {
    light: '#E2E8F0',
    dark: '#333333',
  },
  muted: {
    light: '#F1F5F9',
    dark: '#262626',
  },
  mutedForeground: {
    light: '#64748B',
    dark: '#A1A1AA',
  },
  egypt: {
    gold: '#FFD700',
    bronze: '#B48751',
    amber: '#CD853F',
    stone: '#A0785A',
    darkStone: '#5C4530',
  },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      setThemeState(stored);
      setResolvedTheme(stored === 'system' ? systemTheme : stored as ResolvedTheme);
    } else {
      setThemeState('system');
      setResolvedTheme(systemTheme);
    }
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        setResolvedTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    // Add resolved theme class
    root.classList.add(resolvedTheme);
    
    // Update meta theme-color for mobile browsers
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', resolvedTheme === 'dark' ? colors.background.dark : colors.background.light);
    }
  }, [resolvedTheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
    
    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setResolvedTheme(systemTheme);
    } else {
      setResolvedTheme(newTheme as ResolvedTheme);
    }
  };

  const toggleTheme = () => {
    if (theme === 'system') {
      setTheme('light');
    } else if (theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  };

  const contextValue: ThemeContextType = {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    colors: {
      primary: colors.primary,
      accent: colors.accent,
      error: colors.error,
      background: colors.background[resolvedTheme],
      foreground: colors.foreground[resolvedTheme],
      card: colors.card[resolvedTheme],
      cardForeground: colors.cardForeground[resolvedTheme],
      border: colors.border[resolvedTheme],
      muted: colors.muted[resolvedTheme],
      mutedForeground: colors.mutedForeground[resolvedTheme],
      egypt: colors.egypt,
    },
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Backward compatibility with next-themes
export function useThemeCompat() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  return { 
    theme: resolvedTheme,
    setTheme,
    resolvedTheme,
    systemTheme: window?.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  };
}