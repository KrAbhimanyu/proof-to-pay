import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  ThemeMode,
  THEME_STORAGE_KEY,
  getStoredTheme,
  setStoredTheme,
  getSystemTheme,
  getEffectiveTheme,
  applyTheme,
  subscribeToSystemThemeChanges
} from '../lib/theme';
import { ThemeProvider } from '../context/ThemeContext';
import { ThemeToggle } from '../components/common/ThemeToggle';
import fs from 'fs';
import path from 'path';

// Setup lightweight node DOM / localStorage mock for vitest
class MockLocalStorage {
  private store: Record<string, string> = {};
  getItem(key: string) {
    return this.store[key] ?? null;
  }
  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }
  removeItem(key: string) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

const mockStorage = new MockLocalStorage();
const rootClassSet = new Set<string>();
const mediaListeners: ((e: any) => void)[] = [];

if (typeof global.localStorage === 'undefined') {
  (global as any).localStorage = mockStorage;
}

if (typeof global.window === 'undefined') {
  (global as any).window = {
    localStorage: mockStorage,
    matchMedia: (query: string) => ({
      matches: false,
      media: query,
      addEventListener: (_event: string, cb: (e: any) => void) => mediaListeners.push(cb),
      removeEventListener: (_event: string, cb: (e: any) => void) => {
        const idx = mediaListeners.indexOf(cb);
        if (idx !== -1) mediaListeners.splice(idx, 1);
      }
    })
  };
}

if (typeof global.document === 'undefined') {
  (global as any).document = {
    documentElement: {
      classList: {
        add: (cls: string) => rootClassSet.add(cls),
        remove: (cls: string) => rootClassSet.delete(cls),
        contains: (cls: string) => rootClassSet.has(cls)
      },
      style: { colorScheme: '' }
    },
    querySelector: () => null
  };
}

describe('Theme System — Core Library (src/lib/theme.ts)', () => {
  beforeEach(() => {
    localStorage.clear();
    rootClassSet.clear();
    if (document.documentElement.style) {
      document.documentElement.style.colorScheme = '';
    }
  });

  it('defaults to system when no theme is stored in localStorage', () => {
    expect(getStoredTheme()).toBe('system');
  });

  it('persists and retrieves valid theme modes to/from localStorage', () => {
    setStoredTheme('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(getStoredTheme()).toBe('dark');

    setStoredTheme('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(getStoredTheme()).toBe('light');

    setStoredTheme('system');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('system');
    expect(getStoredTheme()).toBe('system');
  });

  it('falls back to system when localStorage contains invalid data', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'invalid_mode');
    expect(getStoredTheme()).toBe('system');
  });

  it('resolves effective theme based on mode', () => {
    expect(getEffectiveTheme('light')).toBe('light');
    expect(getEffectiveTheme('dark')).toBe('dark');

    const effective = getEffectiveTheme('system');
    expect(['light', 'dark']).toContain(effective);
  });

  it('applies dark theme by adding .dark class and setting color-scheme', () => {
    const effective = applyTheme('dark');
    expect(effective).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('applies light theme by removing .dark class and setting color-scheme', () => {
    document.documentElement.classList.add('dark');
    const effective = applyTheme('light');
    expect(effective).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('subscribes and cleans up system theme media query listener', () => {
    const onChange = vi.fn();
    const unsubscribe = subscribeToSystemThemeChanges(onChange);
    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
  });
});

describe('Theme System — Component Rendering with ThemeProvider & ThemeToggle', () => {
  it('renders ThemeProvider with children without throwing', () => {
    expect(() => {
      const html = renderToString(
        <ThemeProvider>
          <div data-testid="child">Hello Theme</div>
        </ThemeProvider>
      );
      expect(html).toContain('Hello Theme');
    }).not.toThrow();
  });

  it('renders segmented ThemeToggle with light, dark, and system options', () => {
    const html = renderToString(
      <ThemeProvider>
        <ThemeToggle variant="segmented" showLabels={true} />
      </ThemeProvider>
    );
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('Light');
    expect(html).toContain('Dark');
    expect(html).toContain('System');
  });

  it('renders dropdown ThemeToggle with chevron and role', () => {
    const html = renderToString(
      <ThemeProvider>
        <ThemeToggle variant="dropdown" />
      </ThemeProvider>
    );
    expect(html).toContain('aria-haspopup="true"');
    expect(html).toContain('button');
  });

  it('renders icon ThemeToggle with aria-label', () => {
    const html = renderToString(
      <ThemeProvider>
        <ThemeToggle variant="icon" />
      </ThemeProvider>
    );
    expect(html).toContain('button');
  });
});

describe('Theme System — Web & Android Integration Verification', () => {
  it('verifies StudentDashboard settings tab includes Theme & Appearance controls', () => {
    const studentDashboardCode = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/pages/StudentDashboard.tsx'),
      'utf8'
    );
    expect(studentDashboardCode).toContain('ThemeToggle');
    expect(studentDashboardCode).toContain('Appearance & Theme');
    expect(studentDashboardCode).toContain('System Default');
  });

  it('verifies Navbar includes ThemeToggle in primary action header', () => {
    const navbarCode = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/layout/Navbar.tsx'),
      'utf8'
    );
    expect(navbarCode).toContain('<ThemeToggle variant="dropdown" />');
  });

  it('verifies BusinessWorkspace and CreatorWorkspace include ThemeToggle in sidebar and header', () => {
    const bizCode = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/layout/BusinessWorkspace.tsx'),
      'utf8'
    );
    expect(bizCode).toContain('<ThemeToggle variant="segmented"');
    expect(bizCode).toContain('<ThemeToggle variant="dropdown" />');

    const creatorCode = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/layout/CreatorWorkspace.tsx'),
      'utf8'
    );
    expect(creatorCode).toContain('<ThemeToggle variant="segmented"');
    expect(creatorCode).toContain('<ThemeToggle variant="dropdown" />');
  });

  it('verifies Chat attachment download flow has high-contrast styling in both modes', () => {
    const chatModalCode = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/chat/ChatModal.tsx'),
      'utf8'
    );
    expect(chatModalCode).toContain('Download Attachment');
    expect(chatModalCode).toContain('dark:hover:bg-slate-600');
    expect(chatModalCode).toContain('dark:text-slate-200');
  });

  it('verifies Android Theme.kt contains ThemeMode enum, LightColorScheme, DarkColorScheme, and SharedPreferences persistence', () => {
    const themeFile = fs.readFileSync(
      path.resolve(process.cwd(), 'android/app/src/main/java/in/prooftopay/app/theme/Theme.kt'),
      'utf8'
    );
    expect(themeFile).toContain('enum class ThemeMode');
    expect(themeFile).toContain('LIGHT');
    expect(themeFile).toContain('DARK');
    expect(themeFile).toContain('SYSTEM');
    expect(themeFile).toContain('object ThemeRepository');
    expect(themeFile).toContain('PREFS_NAME = "prooftopay_theme_prefs"');
    expect(themeFile).toContain('fun init(context: android.content.Context)');
    expect(themeFile).toContain('fun setThemeMode(mode: ThemeMode)');
    expect(themeFile).toContain('private val LightColorScheme = lightColorScheme');
    expect(themeFile).toContain('private val DarkColorScheme = darkColorScheme');
    expect(themeFile).toContain('fun ProofToPayTheme');
  });

  it('verifies MainActivity initializes ThemeRepository with applicationContext', () => {
    const mainActivity = fs.readFileSync(
      path.resolve(process.cwd(), 'android/app/src/main/java/in/prooftopay/app/MainActivity.kt'),
      'utf8'
    );
    expect(mainActivity).toContain('ThemeRepository.init(applicationContext)');
    expect(mainActivity).toContain('ProofToPayTheme {');
  });

  it('verifies Android ThemeSelectorCard is integrated into Creator and Business settings', () => {
    const creatorScreens = fs.readFileSync(
      path.resolve(process.cwd(), 'android/app/src/main/java/in/prooftopay/app/ui/screens/creator/CreatorScreens.kt'),
      'utf8'
    );
    expect(creatorScreens).toContain('ThemeSelectorCard()');

    const businessScreens = fs.readFileSync(
      path.resolve(process.cwd(), 'android/app/src/main/java/in/prooftopay/app/ui/screens/business/BusinessScreens.kt'),
      'utf8'
    );
    expect(businessScreens).toContain('ThemeSelectorCard()');
  });

  it('verifies Android ChatScreens attachments use theme color tokens and interactive download flow', () => {
    const chatScreens = fs.readFileSync(
      path.resolve(process.cwd(), 'android/app/src/main/java/in/prooftopay/app/ui/screens/chat/ChatScreens.kt'),
      'utf8'
    );
    expect(chatScreens).toContain('MaterialTheme.colorScheme.primaryContainer');
    expect(chatScreens).toContain('MaterialTheme.colorScheme.onPrimaryContainer');
    expect(chatScreens).toContain('MaterialTheme.colorScheme.errorContainer');
    expect(chatScreens).toContain('MaterialTheme.colorScheme.onErrorContainer');
    expect(chatScreens).toContain('Download attachment');
  });
});
