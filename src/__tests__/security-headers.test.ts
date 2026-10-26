import { describe, it, expect } from 'vitest';
import nextConfig from '../../next.config.mjs';

describe('HTTP Security Headers Configuration (next.config.mjs)', () => {
  it('defines headers function that matches all routes', async () => {
    expect(nextConfig.headers).toBeDefined();
    expect(typeof nextConfig.headers).toBe('function');

    const headersConfig = await nextConfig.headers!();
    expect(Array.isArray(headersConfig)).toBe(true);
    expect(headersConfig.length).toBeGreaterThan(0);

    const rootRule = headersConfig.find((r: any) => r.source === '/:path*');
    expect(rootRule).toBeDefined();
  });

  it('enforces X-Frame-Options: DENY to prevent clickjacking', async () => {
    const headersConfig = await nextConfig.headers!();
    const rootRule = headersConfig.find((r: any) => r.source === '/:path*');
    expect(rootRule).toBeDefined();

    const header = rootRule?.headers?.find((h: any) => h.key === 'X-Frame-Options');
    expect(header).toBeDefined();
    expect(header?.value).toBe('DENY');
  });

  it('enforces X-Content-Type-Options: nosniff to prevent MIME sniffing', async () => {
    const headersConfig = await nextConfig.headers!();
    const rootRule = headersConfig.find((r: any) => r.source === '/:path*');
    expect(rootRule).toBeDefined();

    const header = rootRule?.headers?.find((h: any) => h.key === 'X-Content-Type-Options');
    expect(header).toBeDefined();
    expect(header?.value).toBe('nosniff');
  });

  it('enforces Referrer-Policy: strict-origin-when-cross-origin', async () => {
    const headersConfig = await nextConfig.headers!();
    const rootRule = headersConfig.find((r: any) => r.source === '/:path*');
    expect(rootRule).toBeDefined();

    const header = rootRule?.headers?.find((h: any) => h.key === 'Referrer-Policy');
    expect(header).toBeDefined();
    expect(header?.value).toBe('strict-origin-when-cross-origin');
  });

  it('enforces Permissions-Policy disabling camera, microphone, and geolocation', async () => {
    const headersConfig = await nextConfig.headers!();
    const rootRule = headersConfig.find((r: any) => r.source === '/:path*');
    expect(rootRule).toBeDefined();

    const header = rootRule?.headers?.find((h: any) => h.key === 'Permissions-Policy');
    expect(header).toBeDefined();
    expect(header?.value).toContain('camera=()');
    expect(header?.value).toContain('microphone=()');
    expect(header?.value).toContain('geolocation=()');
  });

  it('enforces Content Security Policy with frame-ancestors none', async () => {
    const headersConfig = await nextConfig.headers!();
    const rootRule = headersConfig.find((r: any) => r.source === '/:path*');
    expect(rootRule).toBeDefined();

    const header = rootRule?.headers?.find((h: any) => h.key === 'Content-Security-Policy');
    expect(header).toBeDefined();
    expect(header?.value).toContain("frame-ancestors 'none'");
  });
});
