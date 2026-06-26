import * as Y from 'yjs'
import { localDb } from '@/lib/local-db/schema'

const PUSH_INTERVAL_MS = 10_000
const MAX_BACKOFF_MS = 30_000
const SYNC_ORIGIN = 'sync' // updates applied with this origin are NOT re-queued to the outbox

/** Encode a Yjs update (Uint8Array) to base64 without blowing the call stack. */
function toBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}

/**
 * Background sync engine — the durable half of the local-first architecture.
 *
 * PUSH: drains the IndexedDB outbox (local edits) to Postgres via POST /updates.
 * PULL: hydrates the local Y.Doc from the durable Postgres log via GET /updates,
 *       applying every update with origin `'sync'` so it is merged (CRDT, no data
 *       loss) and never echoed back into the outbox.
 *
 * Postgres is the cross-device source of truth; the WebSocket relay handles live
 * realtime fan-out. PULL is what lets a brand-new device reconstruct an existing
 * document even when no other client is currently connected.
 *
 * Lifecycle is explicit: `start()` registers timers/listeners, `stop()` removes
 * every one of them. No dangling intervals across mounts.
 */
export class SyncEngine {
  private readonly documentId: string
  private readonly doc: Y.Doc
  private syncing = false
  private retryCount = 0
  private intervalId: ReturnType<typeof setInterval> | null = null
  private backoffId: ReturnType<typeof setTimeout> | null = null
  private stopped = false
  private readonly onOnline = () => {
    void this.pull()
    void this.drainOutbox()
  }

  constructor(documentId: string, doc: Y.Doc) {
    this.documentId = documentId
    this.doc = doc
  }

  /** Pull the durable update log and merge it into the local doc. Idempotent (CRDT). */
  async pull(): Promise<void> {
    if (this.stopped) return
    if (typeof window !== 'undefined' && !navigator.onLine) return

    try {
      const res = await fetch(`/api/documents/${this.documentId}/updates`)
      if (!res.ok) return
      const { updates } = (await res.json()) as { updates: string[] }
      if (!updates?.length) return

      // Merge into a single update then apply once — fewer transactions, atomic merge.
      const decoded = updates.map(fromBase64)
      const merged = Y.mergeUpdates(decoded)
      Y.applyUpdate(this.doc, merged, SYNC_ORIGIN)
    } catch (e) {
      console.warn('[sync] pull failed', e)
    }
  }

  /** Push queued local edits to the server. */
  async drainOutbox(): Promise<void> {
    if (this.stopped || this.syncing) return
    if (typeof window !== 'undefined' && !navigator.onLine) return

    const pending = await localDb.outbox
      .where('documentId')
      .equals(this.documentId)
      .filter((item) => item.status === 'pending')
      .sortBy('id')

    if (pending.length === 0) return

    this.syncing = true
    try {
      for (const item of pending) {
        const res = await fetch(`/api/documents/${this.documentId}/updates`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ update: toBase64(item.updateBlob) }),
        })
        if (!res.ok) throw new Error(`sync rejected: ${res.status}`)
        await localDb.outbox.delete(item.id!)
      }
      this.retryCount = 0
    } catch (e) {
      console.warn('[sync] push failed, backing off', e)
      this.retryCount++
      const backoff = Math.min(1000 * 2 ** this.retryCount, MAX_BACKOFF_MS)
      this.backoffId = setTimeout(() => void this.drainOutbox(), backoff)
    } finally {
      this.syncing = false
    }
  }

  /** Begin background syncing. Returns void; call stop() to tear everything down. */
  start(): void {
    if (typeof window === 'undefined' || this.intervalId) return
    this.stopped = false
    window.addEventListener('online', this.onOnline)
    this.intervalId = setInterval(() => void this.drainOutbox(), PUSH_INTERVAL_MS)
    void this.drainOutbox()
  }

  /** Remove every timer and listener this engine registered. */
  stop(): void {
    this.stopped = true
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    if (this.backoffId) {
      clearTimeout(this.backoffId)
      this.backoffId = null
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.onOnline)
    }
  }
}
