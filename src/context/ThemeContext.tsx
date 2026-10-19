import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  ThemeMode,
  getStoredTheme,
  setStoredTheme,
  applyTheme,
  getEffectiveTheme,
  subscribeToSystemThemeChanges
} from '../lib/theme';

interface ThemeContextType {
  theme: ThemeMode;
  effectiveTheme: 'light' | 'dark';
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => getStoredTheme());
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(() => getEffectiveTheme(getStoredTheme()));

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    setStoredTheme(mode);
    const resolved = applyTheme(mode);
    setEffectiveTheme(resolved);
  };

  const toggleTheme = () => {
    // Cycles: light -> dark -> system -> light
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  useEffect(() => {
    // Initial mount apply
    const resolved = applyTheme(theme);
    setEffectiveTheme(resolved);

    // If system mode, subscribe to system preference changes
    const unsubscribe = subscribeToSystemThemeChanges(() => {
      if (theme === 'system') {
        const updated = applyTheme('system');
        setEffectiveTheme(updated);
      }
    });

    return unsubscribe;
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      effectiveTheme,
      setTheme,
      toggleTheme
    }),
    [theme, effectiveTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
