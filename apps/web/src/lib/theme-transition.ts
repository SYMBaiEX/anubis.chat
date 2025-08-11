'use client';

export type ThemeOption = 'light' | 'dark' | 'system';

export const applyThemeWithTransition = (
  targetTheme: ThemeOption,
  setTheme: (t: ThemeOption) => void,
  options?: { durationMs?: number }
): void => {
  const root = document.documentElement;
  const { durationMs = 300 } = options ?? {};

  const runThemeSwapWithCssGate = () => {
    root.classList.add('theme-transition');
    setTheme(targetTheme);
    window.setTimeout(() => {
      root.classList.remove('theme-transition');
    }, durationMs + 50);
  };

  const maybeStartVT = (
    document as unknown as {
      startViewTransition?: (cb: () => void | Promise<void>) => {
        finished: Promise<void>;
      };
    }
  ).startViewTransition;

  if (typeof maybeStartVT === 'function') {
    try {
      // Use native View Transitions only; also suppress element-level transitions to prevent double animations
      root.classList.add('disable-theme-transitions');
      maybeStartVT(() => {
        setTheme(targetTheme);
      }).finished.finally(() => {
        root.classList.remove('disable-theme-transitions');
      });
      return;
    } catch {
      // Fall through to non-VT path
    }
  }

  runThemeSwapWithCssGate();
};
