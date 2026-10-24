import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('PWA Workbox Runtime Caching Configuration', () => {
  const viteConfigPath = path.resolve(process.cwd(), 'vite.config.ts');

  it('verifies vite.config.ts exists on disk', () => {
    expect(fs.existsSync(viteConfigPath)).toBe(true);
  });

  const viteConfigContent = fs.readFileSync(viteConfigPath, 'utf8');

  it('configures runtimeCaching in workbox options', () => {
    expect(viteConfigContent).toContain('runtimeCaching: [');
  });

  it('configures NetworkFirst dynamic runtime caching for /api/* routes', () => {
    expect(viteConfigContent).toContain("cacheName: 'api-routes-cache'");
    expect(viteConfigContent).toContain("handler: 'NetworkFirst'");
    expect(viteConfigContent).toContain('networkTimeoutSeconds: 5');
    expect(viteConfigContent).toContain("url.pathname.startsWith('/api/')");
  });

  it('configures NetworkFirst caching for Supabase REST endpoints', () => {
    expect(viteConfigContent).toContain("cacheName: 'supabase-api-cache'");
    expect(viteConfigContent).toContain("url.hostname.includes('supabase.co')");
  });

  it('sets cacheable response statuses to include successful and opaque responses', () => {
    expect(viteConfigContent).toContain('statuses: [0, 200]');
  });

  it('configures long-term CacheFirst caching for Google Web Fonts', () => {
    expect(viteConfigContent).toContain("cacheName: 'google-fonts-cache'");
    expect(viteConfigContent).toContain("cacheName: 'gstatic-fonts-cache'");
    expect(viteConfigContent).toContain("handler: 'CacheFirst'");
  });
});
