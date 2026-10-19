export type ThemeMode = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'proof_to_pay_theme';

/**
 * Returns the user's stored theme preference, falling back to 'system'
 */
export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // LocalStorage access might fail in restricted iframe environments
  }
  return 'system';
}

/**
 * Saves the user's theme preference to localStorage
 */
export function setStoredTheme(mode: ThemeMode): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // Ignore storage write errors
  }
}

/**
 * Checks system appearance preference
 */
export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/**
 * Resolves the active visual theme ('light' or 'dark') given a ThemeMode
 */
export function getEffectiveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return getSystemTheme();
  }
  return mode;
}

/**
 * Applies the theme to document.documentElement (html element)
 * Sets or removes the 'dark' CSS class and updates color-scheme
 */
export function applyTheme(mode: ThemeMode): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light';
  
  const effective = getEffectiveTheme(mode);
  const root = document.documentElement;

  if (effective === 'dark') {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }

  // Also update theme-color meta tag if present
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', effective === 'dark' ? '#0f172a' : '#ffffff');
  }

  return effective;
}

/**
 * Sets up a listener for system color-scheme changes.
 * Calls onChange whenever system preference changes.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeToSystemThemeChanges(onChange: (theme: 'light' | 'dark') => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return () => {};
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const listener = (e: MediaQueryListEvent) => {
    onChange(e.matches ? 'dark' : 'light');
  };

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  } else if ('addListener' in mediaQuery) {
    // Legacy support
    (mediaQuery as any).addListener(listener);
    return () => (mediaQuery as any).removeListener(listener);
  }

  return () => {};
}
