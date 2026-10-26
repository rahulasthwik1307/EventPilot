import { NextRequest, NextResponse } from 'next/server';

export interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
  retryAfterSeconds: number;
}

/**
 * In-memory sliding window rate limiter designed for bounded per-instance protection.
 *
 * NOTE FOR DISTRIBUTED DEPLOYMENTS:
 * In serverless or multi-node production deployments (e.g., Cloudflare Pages edge workers),
 * each instance maintains its own local state. This limiter provides strict defense-in-depth
 * against local abuse and denial-of-service, but edge-level rate limiting (such as Cloudflare
 * WAF Rate Limiting rules) is recommended for authoritative cross-instance enforcement.
 */
const clientTimestamps = new Map<string, number[]>();
let lastCleanupTime = Date.now();
const CLEANUP_INTERVAL_MS = 60_000;
const MAX_TRACKED_CLIENTS = 10_000;

/**
 * Validates whether an IP address candidate consists of valid IP characters
 * to avoid header injection or spoofing attacks.
 */
function isValidIpCandidate(ip: string): boolean {
  if (!ip || ip.length > 64) return false;
  // Matches IPv4, IPv6, and standard portless IP notation
  return /^[0-9a-fA-F.:%_-]+$/.test(ip);
}

/**
 * Extracts a trustworthy client identifier from incoming request headers.
 * Prioritizes platform-authenticated headers (e.g. Cloudflare) over untrusted forwards.
 */
export function getClientIdentifier(req: NextRequest): string {
  if (!req || !req.headers || typeof req.headers.get !== 'function') {
    return 'anonymous-client';
  }

  // 1. Cloudflare authenticated connecting IP (cannot be spoofed when behind Cloudflare proxy)
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp && isValidIpCandidate(cfIp.trim())) {
    return cfIp.trim();
  }

  // 2. Standard reverse proxy real IP
  const realIp = req.headers.get('x-real-ip');
  if (realIp && isValidIpCandidate(realIp.trim())) {
    return realIp.trim();
  }

  // 3. X-Forwarded-For: select the client IP (first entry) if valid
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const firstIp = forwarded.split(',')[0]?.trim();
    if (firstIp && isValidIpCandidate(firstIp)) {
      return firstIp;
    }
  }

  return 'anonymous-client';
}

/**
 * Evicts expired entries to keep memory bounded.
 */
function evictStaleClients(now: number, windowMs: number): void {
  const cutoff = now - windowMs;
  for (const [key, timestamps] of clientTimestamps.entries()) {
    const active = timestamps.filter((t) => t > cutoff);
    if (active.length === 0) {
      clientTimestamps.delete(key);
    } else {
      clientTimestamps.set(key, active);
    }
  }

  // If still above maximum capacity, drop oldest entries
  if (clientTimestamps.size > MAX_TRACKED_CLIENTS) {
    const keysToRemove = Array.from(clientTimestamps.keys()).slice(
      0,
      clientTimestamps.size - MAX_TRACKED_CLIENTS
    );
    for (const key of keysToRemove) {
      clientTimestamps.delete(key);
    }
  }
}

/**
 * Checks and updates rate limit for a client identifier using sliding window.
 */
export function checkRateLimit(
  clientId: string,
  options?: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const windowMs =
    options?.windowMs ??
    (Number(process.env.AI_RATE_LIMIT_WINDOW_MS) || 60_000);
  const maxRequests =
    options?.maxRequests ??
    (Number(process.env.AI_RATE_LIMIT_MAX_REQUESTS) || 10);

  // Periodic eviction
  if (now - lastCleanupTime > CLEANUP_INTERVAL_MS || clientTimestamps.size > MAX_TRACKED_CLIENTS) {
    evictStaleClients(now, windowMs);
    lastCleanupTime = now;
  }

  const existing = clientTimestamps.get(clientId) || [];
  const cutoff = now - windowMs;
  const activeTimestamps = existing.filter((t) => t > cutoff);

  if (activeTimestamps.length >= maxRequests) {
    const oldestInWindow = activeTimestamps[0];
    const resetMs = oldestInWindow + windowMs;
    const retryAfterSeconds = Math.max(1, Math.ceil((resetMs - now) / 1000));

    // Update map with cleaned active timestamps
    clientTimestamps.set(clientId, activeTimestamps);

    return {
      allowed: false,
      limit: maxRequests,
      remaining: 0,
      resetMs,
      retryAfterSeconds,
    };
  }

  activeTimestamps.push(now);
  clientTimestamps.set(clientId, activeTimestamps);

  const remaining = Math.max(0, maxRequests - activeTimestamps.length);
  const resetMs = now + windowMs;

  return {
    allowed: true,
    limit: maxRequests,
    remaining,
    resetMs,
    retryAfterSeconds: 0,
  };
}

/**
 * Clears rate limiter cache (primarily for deterministic unit testing).
 */
export function resetRateLimits(): void {
  clientTimestamps.clear();
  lastCleanupTime = Date.now();
}

/**
 * Safely parses request JSON while enforcing strict byte-size limits before
 * expensive schema parsing or model invocation.
 */
export async function parseJsonWithLimit<T = unknown>(
  req: NextRequest,
  maxBytes: number
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  // 1. Fast-path check on declared Content-Length header
  if (req?.headers && typeof req.headers.get === 'function') {
    const contentLengthHeader = req.headers.get('content-length');
    if (contentLengthHeader) {
      const parsedLen = parseInt(contentLengthHeader, 10);
      if (!isNaN(parsedLen) && parsedLen > maxBytes) {
        return {
          success: false,
          response: NextResponse.json(
            {
              error: `Request payload exceeds size limit of ${Math.round(maxBytes / 1024)}KB.`,
              code: 'PAYLOAD_TOO_LARGE',
            },
            {
              status: 413,
              headers: { 'Content-Type': 'application/json' },
            }
          ),
        };
      }
    }
  }

  // 2. Read raw body stream as text to inspect actual byte length
  if (typeof req?.text === 'function') {
    let rawText: string;
    try {
      rawText = await req.text();
    } catch {
      return {
        success: false,
        response: NextResponse.json(
          {
            error: 'Failed to read request body stream.',
            code: 'STREAM_READ_ERROR',
          },
          { status: 400 }
        ),
      };
    }

    const byteLength = new TextEncoder().encode(rawText).length;
    if (byteLength > maxBytes) {
      return {
        success: false,
        response: NextResponse.json(
          {
            error: `Request payload exceeds size limit of ${Math.round(maxBytes / 1024)}KB.`,
            code: 'PAYLOAD_TOO_LARGE',
          },
          {
            status: 413,
            headers: { 'Content-Type': 'application/json' },
          }
        ),
      };
    }

    try {
      const parsed = JSON.parse(rawText) as T;
      return { success: true, data: parsed };
    } catch {
      return {
        success: false,
        response: NextResponse.json(
          {
            error: 'Invalid JSON request payload.',
            code: 'MALFORMED_REQUEST',
          },
          { status: 400 }
        ),
      };
    }
  }

  // 3. Fallback for test environments where mock request only supplies req.json()
  if (typeof req?.json === 'function') {
    try {
      const data = (await req.json()) as T;
      return { success: true, data };
    } catch {
      return {
        success: false,
        response: NextResponse.json(
          {
            error: 'Invalid JSON request payload.',
            code: 'MALFORMED_REQUEST',
          },
          { status: 400 }
        ),
      };
    }
  }

  return {
    success: false,
    response: NextResponse.json(
      {
        error: 'Invalid request body.',
        code: 'MALFORMED_REQUEST',
      },
      { status: 400 }
    ),
  };
}

/**
 * Creates standard HTTP 429 response with rate limit headers.
 */
export function createRateLimitExceededResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: 'Too many requests. Please wait before submitting another AI request.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfterSeconds: result.retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfterSeconds),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(result.resetMs / 1000)),
      },
    }
  );
}

/**
 * Attaches standard rate limit headers to successful responses.
 */
export function attachRateLimitHeaders(
  res: NextResponse,
  result: RateLimitResult
): NextResponse {
  res.headers.set('X-RateLimit-Limit', String(result.limit));
  res.headers.set('X-RateLimit-Remaining', String(Math.max(0, result.remaining)));
  res.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetMs / 1000)));
  return res;
}
