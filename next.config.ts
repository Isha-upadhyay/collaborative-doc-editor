import type { NextConfig } from 'next'

/**
 * Build the connect-src allowlist from the configured WebSocket relay URL so we
 * never ship a hardcoded `ws://localhost` to production. In dev we also permit
 * localhost relays; in prod only the explicit URL (plus generic wss:) is allowed.
 */
function connectSrc(): string {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL?.trim()
  const sources = new Set<string>(["'self'", 'https:'])
  if (wsUrl) sources.add(wsUrl)
  if (process.env.NODE_ENV !== 'production') {
    sources.add('ws://localhost:1234')
    sources.add('ws://127.0.0.1:1234')
  } else {
    // Allow secure WebSocket origins in production (relay is served over wss).
    sources.add('wss:')
  }
  return Array.from(sources).join(' ')
}

const csp = [
  "default-src 'self'",
  // Next.js requires inline/eval for its runtime; everything else is locked down.
  "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https: blob:",
  "font-src 'self' data:",
  `connect-src ${connectSrc()}`,
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
]

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
}

export default nextConfig
