import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getSupabaseConfig,
  isSupabaseConfigured,
  getSupabaseSetupStatus,
  getSupabaseClient,
  clearSupabaseConfig,
  _setTestEnvOverride,
} from '../lib/supabaseClient';
import { supabaseService } from '../lib/supabaseService';
import { marketplaceStore } from '../lib/storage';

function setTestEnv(url?: string, key?: string, legacyAnonKey?: string) {
  _setTestEnvOverride({ url, key, legacyKey: legacyAnonKey });
}

describe('PROOF-TO-PAY: Supabase Connection, Validation & Client Initialization', () => {
  beforeEach(() => {
    clearSupabaseConfig();
    setTestEnv(undefined, undefined, undefined);
  });

  afterEach(() => {
    clearSupabaseConfig();
    _setTestEnvOverride(null);
  });

  describe('Missing Configuration Handling', () => {
    it('detects unconfigured environment when no variables are set', () => {
      const config = getSupabaseConfig();
      expect(config.isConfigured).toBe(false);
      expect(config.status).toBe('unconfigured');
      expect(config.error).toContain('Supabase credentials are not configured');
      expect(isSupabaseConfigured()).toBe(false);
    });

    it('reports missing URL when only key is provided', () => {
      setTestEnv(undefined, 'valid-jwt-looking-token-xyz');
      const config = getSupabaseConfig();
      expect(config.isConfigured).toBe(false);
      expect(config.status).toBe('missing_url');
      expect(config.error).toContain('VITE_SUPABASE_URL is missing');
    });

    it('reports missing key when only URL is provided', () => {
      setTestEnv('https://valid-project.supabase.co', undefined);
      const config = getSupabaseConfig();
      expect(config.isConfigured).toBe(false);
      expect(config.status).toBe('missing_key');
      expect(config.error).toContain('VITE_SUPABASE_PUBLISHABLE_KEY is missing');
    });

    it('throws a descriptive setup error when getSupabaseClient is invoked without credentials', () => {
      expect(() => {
        getSupabaseClient();
      }).toThrow(/Supabase connection error.*VITE_SUPABASE_URL.*VITE_SUPABASE_PUBLISHABLE_KEY/i);
    });

    it('returns missingVars list from getSupabaseSetupStatus', () => {
      const status = getSupabaseSetupStatus();
      expect(status.isConfigured).toBe(false);
      expect(status.missingVars).toContain('VITE_SUPABASE_URL');
      expect(status.missingVars).toContain('VITE_SUPABASE_PUBLISHABLE_KEY');
    });
  });

  describe('Placeholder Detection & Anti-Fake Connection Protection', () => {
    it('detects template placeholder URL https://your-project.supabase.co and refuses to mark as configured', () => {
      setTestEnv('https://your-project.supabase.co', 'real-looking-token-12345');

      const config = getSupabaseConfig();
      expect(config.isConfigured).toBe(false);
      expect(config.status).toBe('placeholder_detected');
      expect(config.error).toContain('Placeholder credentials detected');
      expect(isSupabaseConfigured()).toBe(false);
    });

    it('detects template placeholder key and refuses to initialize', () => {
      setTestEnv('https://abhimanyu-proof.supabase.co', 'your-publishable-key-placeholder');

      const config = getSupabaseConfig();
      expect(config.isConfigured).toBe(false);
      expect(config.status).toBe('placeholder_detected');
    });

    it('rejects invalid non-HTTP/HTTPS URLs', () => {
      setTestEnv('not-a-valid-url', 'token-12345');

      const config = getSupabaseConfig();
      expect(config.isConfigured).toBe(false);
      expect(config.status).toBe('placeholder_detected');
    });
  });

  describe('Valid Credential Recognition & Client Initialization', () => {
    it('successfully validates when VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are configured', () => {
      setTestEnv('https://abcdefghijklmn.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.validtoken123');

      const config = getSupabaseConfig();
      expect(config.isConfigured).toBe(true);
      expect(config.status).toBe('configured');
      expect(config.url).toBe('https://abcdefghijklmn.supabase.co');
      expect(config.publishableKey).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.validtoken123');
      expect(isSupabaseConfigured()).toBe(true);

      const client = getSupabaseClient();
      expect(client).toBeDefined();
      expect(typeof client.from).toBe('function');
      expect(typeof client.auth.getSession).toBe('function');
    });

    it('supports VITE_SUPABASE_ANON_KEY as backwards-compatible fallback', () => {
      setTestEnv('https://abcdefghijklmn.supabase.co', undefined, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.legacyanonkey');

      const config = getSupabaseConfig();
      expect(config.isConfigured).toBe(true);
      expect(config.publishableKey).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.legacyanonkey');
    });

    it('prefers VITE_SUPABASE_PUBLISHABLE_KEY over legacy VITE_SUPABASE_ANON_KEY', () => {
      setTestEnv('https://abcdefghijklmn.supabase.co', 'primary-publishable-key', 'fallback-anon-key');

      const config = getSupabaseConfig();
      expect(config.publishableKey).toBe('primary-publishable-key');
    });

    it('accepts modern Supabase publishable key format (sb_publishable_*) without false-positive placeholder triggers', () => {
      setTestEnv('https://iwaoampmlyenbkmkelde.supabase.co', 'sb_publishable_EXlEqH2QBDSLLJt8Km2oAw_4eLSWHtx');

      const config = getSupabaseConfig();
      expect(config.isConfigured).toBe(true);
      expect(config.status).toBe('configured');
      expect(config.url).toBe('https://iwaoampmlyenbkmkelde.supabase.co');
      expect(config.publishableKey).toBe('sb_publishable_EXlEqH2QBDSLLJt8Km2oAw_4eLSWHtx');
      expect(isSupabaseConfigured()).toBe(true);
    });
  });

  describe('Storage & Marketplace Mode Integrity', () => {
    it('marks marketplace as offline sandbox when Supabase credentials are not configured', () => {
      expect(isSupabaseConfigured()).toBe(false);
      expect(marketplaceStore.isDemoMode()).toBe(true);
      expect(marketplaceStore.isLiveBackendAvailable()).toBe(false);

      const status = marketplaceStore.getBackendStatus();
      expect(status.isLive).toBe(false);
      expect(status.mode).toBe('OFFLINE_DEMO_SANDBOX');
      expect(status.notice).toContain('Supabase credentials not configured');
    });

    it('transitions to live status when valid Supabase configuration is present', () => {
      setTestEnv('https://live-project-prod.supabase.co', 'token-live-production-456');

      expect(isSupabaseConfigured()).toBe(true);
      expect(marketplaceStore.isDemoMode()).toBe(false);
      expect(marketplaceStore.isLiveBackendAvailable()).toBe(true);

      const status = marketplaceStore.getBackendStatus();
      expect(status.isLive).toBe(true);
      expect(status.mode).toBe('PRODUCTION_SUPABASE');
      expect(status.url).toBe('https://live-project-prod.supabase.co');
      expect(status.notice).toContain('Row Level Security');
    });
  });

  describe('SupabaseService Health Check and Error Reporting', () => {
    it('returns an informative failure report without throwing unhandled exceptions when unconfigured', async () => {
      supabaseService.initClient();
      const ping = await supabaseService.testConnection();

      expect(ping.success).toBe(false);
      expect(ping.latencyMs).toBe(0);
      expect(ping.error).toContain('Supabase');
    });
  });
});
