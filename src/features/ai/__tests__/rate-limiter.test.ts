import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  getClientIdentifier,
  checkRateLimit,
  resetRateLimits,
  parseJsonWithLimit,
  createRateLimitExceededResponse,
  attachRateLimitHeaders,
} from '../rate-limiter';

describe('rate-limiter', () => {
  beforeEach(() => {
    resetRateLimits();
  });

  describe('getClientIdentifier', () => {
    it('prioritizes cf-connecting-ip when present', () => {
      const req = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'cf-connecting-ip': '203.0.113.195',
          'x-real-ip': '198.51.100.1',
          'x-forwarded-for': '192.0.2.1',
        },
      });

      expect(getClientIdentifier(req)).toBe('203.0.113.195');
    });

    it('falls back to x-real-ip if cf-connecting-ip is missing', () => {
      const req = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-real-ip': '198.51.100.1',
          'x-forwarded-for': '192.0.2.1',
        },
      });

      expect(getClientIdentifier(req)).toBe('198.51.100.1');
    });

    it('extracts client IP from x-forwarded-for list when higher-priority headers are absent', () => {
      const req = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '192.0.2.1, 198.51.100.2, 203.0.113.5',
        },
      });

      expect(getClientIdentifier(req)).toBe('192.0.2.1');
    });

    it('rejects malicious/spoofed IP format and falls back to anonymous-client', () => {
      const req = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'cf-connecting-ip': '<script>alert(1)</script>',
        },
      });

      expect(getClientIdentifier(req)).toBe('anonymous-client');
    });

    it('returns anonymous-client if no headers or empty request', () => {
      const req = new NextRequest('http://localhost:3000/api/test');
      expect(getClientIdentifier(req)).toBe('anonymous-client');
    });
  });

  describe('checkRateLimit', () => {
    it('allows requests within threshold and decrements remaining', () => {
      const client = '198.51.100.10';
      const r1 = checkRateLimit(client, { maxRequests: 3, windowMs: 10_000 });
      expect(r1.allowed).toBe(true);
      expect(r1.remaining).toBe(2);

      const r2 = checkRateLimit(client, { maxRequests: 3, windowMs: 10_000 });
      expect(r2.allowed).toBe(true);
      expect(r2.remaining).toBe(1);

      const r3 = checkRateLimit(client, { maxRequests: 3, windowMs: 10_000 });
      expect(r3.allowed).toBe(true);
      expect(r3.remaining).toBe(0);

      const r4 = checkRateLimit(client, { maxRequests: 3, windowMs: 10_000 });
      expect(r4.allowed).toBe(false);
      expect(r4.remaining).toBe(0);
      expect(r4.retryAfterSeconds).toBeGreaterThan(0);
    });

    it('tracks different clients independently', () => {
      const clientA = '198.51.100.1';
      const clientB = '198.51.100.2';

      for (let i = 0; i < 2; i++) {
        checkRateLimit(clientA, { maxRequests: 2, windowMs: 10_000 });
      }

      const blockedA = checkRateLimit(clientA, { maxRequests: 2, windowMs: 10_000 });
      expect(blockedA.allowed).toBe(false);

      const allowedB = checkRateLimit(clientB, { maxRequests: 2, windowMs: 10_000 });
      expect(allowedB.allowed).toBe(true);
      expect(allowedB.remaining).toBe(1);
    });

    it('resets correctly when resetRateLimits is invoked', () => {
      const client = '198.51.100.20';
      checkRateLimit(client, { maxRequests: 1, windowMs: 10_000 });
      expect(checkRateLimit(client, { maxRequests: 1, windowMs: 10_000 }).allowed).toBe(false);

      resetRateLimits();
      expect(checkRateLimit(client, { maxRequests: 1, windowMs: 10_000 }).allowed).toBe(true);
    });
  });

  describe('parseJsonWithLimit', () => {
    it('parses valid JSON when payload is under limit', async () => {
      const validBody = JSON.stringify({ message: 'Hello Event Pilot' });
      const req = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: validBody,
      });

      const result = await parseJsonWithLimit(req, 1024);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ message: 'Hello Event Pilot' });
      }
    });

    it('rejects immediately when Content-Length header exceeds limit', async () => {
      const req = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': '2048',
        },
        body: '{"a":1}',
      });

      const result = await parseJsonWithLimit(req, 1024);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response.status).toBe(413);
        const data = await result.response.json();
        expect(data.code).toBe('PAYLOAD_TOO_LARGE');
      }
    });

    it('rejects when actual byte size exceeds limit even without content-length header', async () => {
      const largeString = 'x'.repeat(2000);
      const req = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify({ data: largeString }),
      });

      const result = await parseJsonWithLimit(req, 1024);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response.status).toBe(413);
        const data = await result.response.json();
        expect(data.code).toBe('PAYLOAD_TOO_LARGE');
      }
    });

    it('returns 400 MALFORMED_REQUEST for broken JSON', async () => {
      const req = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: '{broken-json',
      });

      const result = await parseJsonWithLimit(req, 1024);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response.status).toBe(400);
        const data = await result.response.json();
        expect(data.code).toBe('MALFORMED_REQUEST');
      }
    });

    it('streams chunked request body and parses valid JSON under limit', async () => {
      const encoder = new TextEncoder();
      const chunk1 = encoder.encode('{"message":');
      const chunk2 = encoder.encode('"chunked hello"}');

      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(chunk1);
          controller.enqueue(chunk2);
          controller.close();
        },
      });

      const req = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: stream,
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await parseJsonWithLimit(req, 1024);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ message: 'chunked hello' });
      }
    });

    it('aborts chunked stream immediately when cumulative bytes exceed limit', async () => {
      const encoder = new TextEncoder();
      let chunksSupplied = 0;
      let streamCancelled = false;

      const stream = new ReadableStream<Uint8Array>({
        pull(controller) {
          chunksSupplied++;
          controller.enqueue(encoder.encode('x'.repeat(400)));
        },
        cancel() {
          streamCancelled = true;
        },
      });

      const req = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: stream,
        headers: { 'Content-Type': 'application/json' },
      });

      // Limit is 500 bytes. Chunk 1 is 400 bytes, Chunk 2 reaches 800 bytes (> 500) -> early abort
      const result = await parseJsonWithLimit(req, 500);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response.status).toBe(413);
        const body = await result.response.json();
        expect(body.code).toBe('PAYLOAD_TOO_LARGE');
      }
      expect(streamCancelled).toBe(true);
      expect(chunksSupplied).toBeLessThanOrEqual(2);
    });

    it('rejects chunked stream with invalid UTF-8 bytes with 400 MALFORMED_REQUEST', async () => {
      const invalidUtf8 = new Uint8Array([0xff, 0xfe, 0xfd]);

      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(invalidUtf8);
          controller.close();
        },
      });

      const req = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: stream,
      });

      const result = await parseJsonWithLimit(req, 1024);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response.status).toBe(400);
        const body = await result.response.json();
        expect(body.code).toBe('MALFORMED_REQUEST');
      }
    });

    it('falls back gracefully to req.json() for mock requests lacking body and text', async () => {
      const mockReq = {
        headers: new Headers(),
        json: async () => ({ mock: 'data' }),
      } as unknown as NextRequest;

      const result = await parseJsonWithLimit(mockReq, 1024);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ mock: 'data' });
      }
    });
  });

  describe('responses and headers', () => {
    it('creates 429 response with Retry-After and rate limit headers', async () => {
      const res = createRateLimitExceededResponse({
        allowed: false,
        limit: 10,
        remaining: 0,
        resetMs: Date.now() + 30_000,
        retryAfterSeconds: 30,
      });

      expect(res.status).toBe(429);
      expect(res.headers.get('Retry-After')).toBe('30');
      expect(res.headers.get('X-RateLimit-Limit')).toBe('10');
      expect(res.headers.get('X-RateLimit-Remaining')).toBe('0');
      const body = await res.json();
      expect(body.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('attaches rate limit headers to response', () => {
      const original = NextRequest ? new Response(JSON.stringify({ ok: true })) : null;
      // We can test attachRateLimitHeaders on a NextResponse
      const { NextResponse } = require('next/server');
      const res = NextResponse.json({ ok: true });
      attachRateLimitHeaders(res, {
        allowed: true,
        limit: 10,
        remaining: 7,
        resetMs: 1700000000000,
        retryAfterSeconds: 0,
      });

      expect(res.headers.get('X-RateLimit-Limit')).toBe('10');
      expect(res.headers.get('X-RateLimit-Remaining')).toBe('7');
      expect(res.headers.get('X-RateLimit-Reset')).toBe('1700000000');
    });
  });
});
