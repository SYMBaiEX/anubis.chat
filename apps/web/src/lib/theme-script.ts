/**
 * Theme initialization script
 * Runs before React hydration to prevent flash of unstyled content
 */

export const themeInitScript = `
(function() {
  // Get theme from cookie or localStorage
  function getStoredTheme() {
    // Check cookie first
    const cookies = document.cookie.split(';');
    const themeCookie = cookies.find(c => c.trim().startsWith('theme='));
    if (themeCookie) {
      return themeCookie.split('=')[1];
    }
    
    // Fallback to localStorage (next-themes default)
    try {
      return localStorage.getItem('anubis-theme');
    } catch {
      return null;
    }
  }

  // Get font size from cookie
  function getStoredFontSize() {
    const cookies = document.cookie.split(';');
    const fontCookie = cookies.find(c => c.trim().startsWith('fontSize='));
    if (fontCookie) {
      return fontCookie.split('=')[1];
    }
    return 'medium';
  }

  // Apply theme
  const theme = getStoredTheme() || 'system';
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Remove any existing theme class first
  document.documentElement.classList.remove('dark', 'light');
  
  // Apply the appropriate theme
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
  } else if (theme === 'light') {
    // Light theme - explicitly ensure no dark class
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    document.documentElement.style.colorScheme = 'light';
  } else if (theme === 'system' || !theme) {
    // System preference
    if (prefersDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.style.colorScheme = 'light';
    }
  }

  // Apply font size
  const fontSize = getStoredFontSize();
  if (fontSize && ['small', 'medium', 'large'].includes(fontSize)) {
    document.documentElement.classList.add('font-size-' + fontSize);
  }

  // Apply data attributes for CSS
  document.documentElement.setAttribute('data-theme', theme || 'system');
  document.documentElement.setAttribute('data-font-size', fontSize);
})();
`;
