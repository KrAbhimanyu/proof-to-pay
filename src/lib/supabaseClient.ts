// Supabase Client Integration Layer for Proof-to-Pay Web and Android Sync
// Connects to the authoritative Supabase backend using validated environment variables.
// WARNING: NEVER embed or use a Supabase service-role key or database password in client code.
// Authorization and data protection are strictly enforced via PostgreSQL Row Level Security (RLS).

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  publishableKey: string;
  anonKey: string; // Backwards-compatible alias for publishableKey
  isConfigured: boolean;
  status: 'configured' | 'missing_url' | 'missing_key' | 'placeholder_detected' | 'unconfigured';
  error?: string;
}

const SUPABASE_STORAGE_KEY = 'ptp_supabase_config';

// List of known placeholder substrings that must not be treated as live credentials
const PLACEHOLDER_PATTERNS = [
  'your-project',
  'your-anon-key',
  'your-publishable-key',
  'dummy_anon_key',
  'change-this',
  'placeholder',
  'MY_SUPABASE',
];

function isPlaceholder(value: string | undefined | null): boolean {
  if (!value) return true;
  const lower = value.toLowerCase().trim();
  return PLACEHOLDER_PATTERNS.some((pattern) => lower.includes(pattern));
}

function isValidHttpUrl(string: string): boolean {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function getEnvVar(key: string): string {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key] !== undefined) {
      return String((import.meta as any).env[key]).trim();
    }
  } catch {}
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined) {
      return String(process.env[key]).trim();
    }
  } catch {}
  return '';
}

let testEnvOverride: { url?: string; key?: string; legacyKey?: string } | null = null;

export function _setTestEnvOverride(override: { url?: string; key?: string; legacyKey?: string } | null) {
  testEnvOverride = override;
}

/**
 * Retrieves the current Supabase configuration.
 * Prioritizes VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY from Vite environment variables.
 */
export function getSupabaseConfig(): SupabaseConfig {
  // 1. Read environment variables (or test overrides if actively running unit tests)
  const envUrl = testEnvOverride !== null
    ? (testEnvOverride.url || '')
    : getEnvVar('VITE_SUPABASE_URL');

  const envKey = testEnvOverride !== null
    ? (testEnvOverride.key !== undefined ? testEnvOverride.key : (testEnvOverride.legacyKey || ''))
    : (getEnvVar('VITE_SUPABASE_PUBLISHABLE_KEY') || getEnvVar('VITE_SUPABASE_ANON_KEY'));

  // 2. Check localStorage override (useful for developer sandbox testing via Android/Settings modal)
  let localUrl = '';
  let localKey = '';
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(SUPABASE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        localUrl = parsed.url?.trim() || '';
        localKey = (parsed.publishableKey || parsed.anonKey)?.trim() || '';
      }
    }
  } catch {
    // LocalStorage may be unavailable in restricted environments
  }

  // Active values (Env variables take priority, local override is secondary fallback)
  const activeUrl = envUrl || localUrl || '';
  const activeKey = envKey || localKey || '';

  // 3. Validation checks
  if (!activeUrl && !activeKey) {
    return {
      url: '',
      publishableKey: '',
      anonKey: '',
      isConfigured: false,
      status: 'unconfigured',
      error: 'Supabase credentials are not configured. Define VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local.',
    };
  }

  if (!activeUrl) {
    return {
      url: '',
      publishableKey: activeKey,
      anonKey: activeKey,
      isConfigured: false,
      status: 'missing_url',
      error: 'VITE_SUPABASE_URL is missing. Please provide your Supabase project URL.',
    };
  }

  if (!activeKey) {
    return {
      url: activeUrl,
      publishableKey: '',
      anonKey: '',
      isConfigured: false,
      status: 'missing_key',
      error: 'VITE_SUPABASE_PUBLISHABLE_KEY is missing. Please provide your Supabase publishable/anon key.',
    };
  }

  if (isPlaceholder(activeUrl) || isPlaceholder(activeKey) || !isValidHttpUrl(activeUrl)) {
    return {
      url: activeUrl,
      publishableKey: activeKey,
      anonKey: activeKey,
      isConfigured: false,
      status: 'placeholder_detected',
      error: 'Placeholder credentials detected. Set your real Supabase project URL and publishable key in .env.local.',
    };
  }

  // 4. Fully validated configuration
  return {
    url: activeUrl,
    publishableKey: activeKey,
    anonKey: activeKey,
    isConfigured: true,
    status: 'configured',
  };
}

/**
 * Checks whether live Supabase credentials are configured and valid.
 */
export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig().isConfigured;
}

/**
 * Returns structured setup status for UI feedback.
 */
export function getSupabaseSetupStatus(): {
  isConfigured: boolean;
  status: SupabaseConfig['status'];
  message: string;
  missingVars: string[];
} {
  const config = getSupabaseConfig();
  const missing: string[] = [];

  const envUrl = testEnvOverride !== null
    ? (testEnvOverride.url || '')
    : getEnvVar('VITE_SUPABASE_URL');
  const envKey = testEnvOverride !== null
    ? (testEnvOverride.key !== undefined ? testEnvOverride.key : (testEnvOverride.legacyKey || ''))
    : (getEnvVar('VITE_SUPABASE_PUBLISHABLE_KEY') || getEnvVar('VITE_SUPABASE_ANON_KEY'));

  if (!envUrl || isPlaceholder(envUrl)) {
    missing.push('VITE_SUPABASE_URL');
  }
  if (!envKey || isPlaceholder(envKey)) {
    missing.push('VITE_SUPABASE_PUBLISHABLE_KEY');
  }

  return {
    isConfigured: config.isConfigured,
    status: config.status,
    message: config.error || 'Live Supabase backend configured and operational.',
    missingVars: missing,
  };
}

// Internal singleton client instance
let _supabaseClientInstance: SupabaseClient | null = null;
let _lastConfigKey = '';

/**
 * Initializes and returns the official Supabase JavaScript client.
 * Throws a clear setup error if called without valid configuration.
 */
export function getSupabaseClient(): SupabaseClient {
  const config = getSupabaseConfig();

  if (!config.isConfigured || !config.url || !config.publishableKey) {
    throw new Error(
      `Supabase connection error: ${config.error || 'Live Supabase backend is not configured'}. ` +
      'Please configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local. ' +
      'Proof-to-Pay will not silently fake database connections without valid credentials.'
    );
  }

  const currentKey = `${config.url}::${config.publishableKey}`;
  if (!_supabaseClientInstance || _lastConfigKey !== currentKey) {
    _supabaseClientInstance = createClient(config.url, config.publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    _lastConfigKey = currentKey;
  }

  return _supabaseClientInstance;
}

/**
 * Optional client accessor that returns null instead of throwing when unconfigured.
 */
export function tryGetSupabaseClient(): SupabaseClient | null {
  try {
    return isSupabaseConfigured() ? getSupabaseClient() : null;
  } catch {
    return null;
  }
}

/**
 * Exported client reference for convenience (null if unconfigured).
 */
export const supabase: SupabaseClient | null = tryGetSupabaseClient();

/**
 * Persist credentials to local storage (for manual debugging via in-app UI).
 */
export function saveSupabaseConfig(url: string, key: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        SUPABASE_STORAGE_KEY,
        JSON.stringify({
          url: url.trim(),
          publishableKey: key.trim(),
          anonKey: key.trim(),
        })
      );
    }
  } catch {}
  // Reset cached instance
  _supabaseClientInstance = null;
  _lastConfigKey = '';
}

/**
 * Clear persisted credentials from local storage.
 */
export function clearSupabaseConfig(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(SUPABASE_STORAGE_KEY);
    }
  } catch {}
  _supabaseClientInstance = null;
  _lastConfigKey = '';
}
