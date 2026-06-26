import { NextRequest, NextResponse } from 'next/server'

/**
 * Fixed-window rate limiter.
 *
 * NOTE ON SCALE: This in-memory implementation is correct for a single long-lived
 * Node process (e.g. the WebSocket relay, or `next start` on a single instance).
 * On a horizontally-scaled / serverless deployment it is best-effort only, because
 * each instance keeps its own counter. For production-grade limiting across instances,
 * back this with Redis / Upstash (`@upstash/ratelimit`) — the call sites stay identical.
 *
 * It is also hardened against the unbounded-Map memory leak the naive version had:
 * stale buckets are evicted opportunistically on each call.
 */

interface RateLimitInfo {
  count: number
  windowStart: number
}

const rateLimitMap = new Map<string, RateLimitInfo>()

const WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS = 600 // tuned for high-frequency CRDT update flushes
const MAX_TRACKED_KEYS = 10_000 // backstop against memory growth under key churn

/** Resolve the real client IP, trusting only the first hop in x-forwarded-for. */
function clientKey(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]!.trim()
  return req.headers.get('x-real-ip') || 'anonymous'
}

/** Drop expired buckets so the Map cannot grow without bound. */
function evictStale(now: number): void {
  if (rateLimitMap.size < MAX_TRACKED_KEYS) return
  for (const [key, info] of rateLimitMap) {
    if (now - info.windowStart > WINDOW_MS) rateLimitMap.delete(key)
  }
}

export function checkRateLimit(req: NextRequest): NextResponse | null {
  const now = Date.now()
  const key = clientKey(req)
  const info = rateLimitMap.get(key)

  if (!info || now - info.windowStart > WINDOW_MS) {
    evictStale(now)
    rateLimitMap.set(key, { count: 1, windowStart: now })
    return null
  }

  info.count += 1

  if (info.count > MAX_REQUESTS) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - info.windowStart)) / 1000)
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    )
  }

  return null
}
