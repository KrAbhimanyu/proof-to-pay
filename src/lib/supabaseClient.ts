// Supabase Client Integration Layer for Proof-to-Pay Web and Android Sync

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
}

const SUPABASE_STORAGE_KEY = 'ptp_supabase_config';

export function getSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(SUPABASE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) {
        return {
          url: parsed.url,
          anonKey: parsed.anonKey,
          isConfigured: true,
        };
      }
    }
  } catch {}

  // Check Vite environment variables if available
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey) {
    return {
      url: envUrl,
      anonKey: envKey,
      isConfigured: true,
    };
  }

  return {
    url: 'https://your-project.supabase.co',
    anonKey: '',
    isConfigured: false,
  };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  localStorage.setItem(
    SUPABASE_STORAGE_KEY,
    JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() })
  );
}

export function clearSupabaseConfig(): void {
  localStorage.removeItem(SUPABASE_STORAGE_KEY);
}
