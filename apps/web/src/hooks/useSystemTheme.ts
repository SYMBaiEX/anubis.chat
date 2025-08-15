'use client';

import { useEffect, useState } from 'react';

export function useSystemTheme() {
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Check if window is available
    if (typeof window === 'undefined') {
      return;
    }

    // Get initial system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');

    // Listen for system theme changes
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return systemTheme;
}

export function useThemeTransition() {
  useEffect(() => {
    // Add transition class to document for smooth theme changes
    const root = document.documentElement;

    const handleThemeChange = () => {
      root.classList.add('theme-transition');

      setTimeout(() => {
        root.classList.remove('theme-transition');
      }, 300);
    };

    // Watch for class changes on html element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const classList = (mutation.target as HTMLElement).classList;
          if (classList.contains('dark') || classList.contains('light')) {
            handleThemeChange();
          }
        }
      });
    });

    observer.observe(root, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      observer.disconnect();
    };
  }, []);
}
