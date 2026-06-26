# ARCHITECTURE_DECISIONS.md

> **Status:** Authoritative — single source of truth for all implementation decisions.
> **Last updated:** 2026-06-25 | **Stack:** Next.js 16, React 19, TypeScript strict, Tailwind CSS, shadcn/ui, PostgreSQL, Vercel

---

## 1. System Architecture

Four layers: **Client Persistence** (IndexedDB/Dexie — primary source of truth) → **Client App** (React 19 + Yjs Y.Doc, never blocks on network) → **Transport/Sync** (background outbox over WS + HTTP fallback) → **Server** (Next.js Route Handlers + off-Vercel WS relay + PostgreSQL).

Write path: `Keystroke → Y.Doc (sync, <1ms) → y-indexeddb + Dexie outbox (async) → debounced WS send → server validates → persists to crdt_updates → broadcasts to room`.

Read path: `Open doc → hydrate Y.Doc from IndexedDB instantly → render → background WS state-vector exchange → merge remote updates`.

---

## 2. Technology Decisions

| Concern | Decision | Rationale |
|---|---|---|
| CRDT | **Yjs Y.Doc** | Compact binary, state-vector diffing, GC, mature ecosystem |
| Editor | **Tiptap + y-prosemirror** | Rich-text, accessible, first-class Yjs binding |
| Client DB | **Dexie.js + y-indexeddb** | Durable, large quota, async; outbox separate from doc state |
| WS relay | **Dedicated Node service + Upstash Redis Pub/Sub** | Vercel serverless can't hold persistent sockets |
| Database | **PostgreSQL (Supabase/Neon)** | RLS, `bytea` for CRDT, strong consistency |
| ORM | **Drizzle ORM** | Type-safe, thin, RLS-friendly, edge-compatible |
| Auth | **Auth.js (NextAuth v5)** | App Router native, DB sessions, revocable |
| Validation | **Zod** | Runtime schema validation at all trust boundaries |
| AI | **Vercel AI SDK + Groq/Gemini/OpenAI** | Streaming, provider abstraction, server-only |
| Pooling | **PgBouncer / Supabase pooler (transaction mode)** | Serverless connection fan-out |
| Testing | **Vitest + Playwright** | Fast unit; real browser offline simulation |

---

## 3. Database Design

**Core tables:** `users`, `documents` (+ `state_vector bytea`), `document_members` (role enum owner/editor/viewer), `crdt_updates` (append-only, `update_blob bytea`, `byte_size int`), `snapshots` (`state_blob bytea`, `state_vector bytea`, `label`, `summary`), `ai_messages`.

**Key indexes:** `crdt_updates(document_id, id)`, `snapshots(document_id, created_at desc)`, `document_members(user_id)`.

**RLS:** enabled on all tenant tables; `SET LOCAL app.current_user_id` per transaction. INSERT on `crdt_updates` requires `role IN ('owner','editor')`. SELECT requires membership. RLS is the backstop behind ORM scoping.

---

## 4. Local-First Strategy

**IndexedDB stores:** `ydoc-{docId}` (y-indexeddb managed), `outbox` `{id, documentId, updateBlob, status, attempts}`, `documents-meta` (cached titles/roles), `sync-cursor` (last acked server sequence).

Keystrokes apply to Y.Doc synchronously; `y-indexeddb` and the Dexie outbox are written async in parallel — no network call is on the typing path. Cold-start reconstructs Y.Doc from IndexedDB before any network activity.

---

## 5. Sync Engine Design

State machine: `offline → connecting → syncing → live → degraded → offline`.

- **Outbox:** Dexie-backed, FIFO, survives refresh. On WS ack, entry marked `acked` and pruned; `sync-cursor` advances.
- **Flush:** debounced ~300ms idle, max-latency cap ~2s.
- **Retry:** exponential backoff, base 1s × 2, cap 30s, jitter. Permanent rejections (auth/validation) moved to `rejected` store, surfaced in UI, not retried.
- **Reconnect:** re-run state-vector handshake (idempotent), then flush outbox. CRDT merge is commutative — re-sending an applied update is safe.
- **Merge guarantee:** remote updates are *merged*, never assigned. No last-writer-wins anywhere.

---

## 6. CRDT Strategy

**Yjs Y.Doc** per document. Rich text in `Y.XmlFragment` via `y-prosemirror`. Presence via Yjs Awareness (ephemeral, never persisted to PostgreSQL).

Updates encoded as `Uint8Array` (binary WS frames / `bytea`). State-vector diffing on connect — only missing ops cross the wire. Yjs GC bounds tombstone memory growth.

---

## 7. WebSocket Architecture

Dedicated Node relay (Railway/Fly/Render) + Upstash Redis Pub/Sub for cross-instance broadcast.

- **Auth:** client mints a short-lived JWT (~60s TTL, scoped to `{userId, documentId, role}`) from a Route Handler; relay verifies at handshake.
- **Rooms:** `doc:{documentId}`. Viewer connections are **forbidden from sending update frames** (relay drops + logs).
- **Broadcast:** validate → persist to `crdt_updates` → Redis publish → fan-out to room (excluding sender).
- **Limits:** per-connection rate limit, max frame size ~1MB, idle ping/reap, resync-by-state-vector if client falls behind.

---

## 8. Version History Design

Snapshot = full `Y.encodeStateAsUpdate(doc)` stored in `snapshots`. Immutable once written.

**Triggers:** manual ("Save version"), time-based (≤1 per 5 min active editing), volume-based (≥200 updates or 256KB since last snapshot).

**Restore:** applies diff as a **new forward CRDT update** — never destructive. Auto-snapshot taken before restore (restore is undoable). Concurrent collaborators converge normally.

**Compaction:** `crdt_updates` rows older than a snapshot's state vector may be truncated. Retention: keep all manual; thin auto snapshots exponentially (dense recent, sparse old).

---

## 9. Authentication Strategy

Auth.js v5, OAuth (Google/GitHub) + email magic link, **database sessions** (PostgreSQL via Drizzle adapter). Session cookie: `httpOnly`, `Secure`, `SameSite=Lax`. Route Handlers call `auth()` → `userId` → bound to RLS via `SET LOCAL`. Short-lived WS JWT minted per document open, refreshed on reconnect.

---

## 10. Authorization Model

| Role | Read | Write/Sync | Manage Members | Delete | Version |
|---|---|---|---|---|---|
| **Owner** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Editor** | ✓ | ✓ | ✗ | ✗ | ✓ |
| **Viewer** | ✓ | **✗** | ✗ | ✗ | ✗ |

**Three enforcement layers (viewer write-block):** (1) client disables outbox, (2) WS relay drops update frames, (3) RLS `WITH CHECK` blocks INSERT. All three required; any one alone is sufficient.

Single `authorizeDocumentAccess(userId, documentId, requiredRole)` guard used in all Route Handlers.

---

## 11. Security Architecture

- **Payload validation:** Zod on every Route Handler (`body`, `params`, `query`); invalid → `400`, no internals leaked.
- **Size limits:** max HTTP body ~1MB, max WS frame ~1MB, per-document update-log cap.
- **Malformed CRDT defense:** server applies update to throwaway Y.Doc before persisting; throws → rejected, never written.
- **OOM prevention:** bounded decode, rate limits (token bucket via Upstash), per-connection byte ceilings.
- **Tenant isolation:** ORM always scoped by `documentId`/`userId` (lint rule); RLS backstop.
- **API hardening:** CSRF via Auth.js + SameSite, secrets env-only, security headers (CSP/HSTS) via Next.js config.
- **AI prompt injection:** document text treated as untrusted data, delimited in prompts, server-only keys.

---

## 12. AI Architecture

Vercel AI SDK, streaming Route Handlers, server-only (keys never in client bundle). AI is **read-only** — no write access to Y.Doc.

**Provider routing:** Groq (fast, default) → Gemini (large context) → OpenAI (quality fallback). Config-driven, swappable.

**Large doc handling:** chunk + map-reduce for summaries; embedding + top-k retrieval for chat. Change summaries feed only the delta between two snapshots.

**Features:** document summary, change summary, meeting-notes extraction, action items, AI document chat. All disabled gracefully when offline.

---

## 13. Folder Structure

```
/
├─ src/app/(auth)/           # sign-in routes
├─ src/app/(app)/documents/[documentId]/page.tsx
├─ src/app/api/              # Route Handlers: auth, documents, snapshots, ws-token, ai
├─ src/components/           # ui/, editor/, version-history/, presence/, status/
├─ src/lib/
│  ├─ crdt/                  # Y.Doc helpers
│  ├─ local-db/              # Dexie schema + outbox
│  ├─ sync/                  # sync engine state machine
│  ├─ ws/                    # WS connection manager
│  ├─ auth/ authz/ db/       # auth, guards, Drizzle schema
│  ├─ validation/            # Zod schemas
│  └─ ai/                    # provider routing + prompts
├─ src/hooks/                # useDocument, useSyncStatus, usePresence
├─ relay/                    # standalone WS service (off-Vercel)
├─ tests/                    # Vitest unit + Playwright e2e
├─ drizzle/                  # migrations
└─ .github/workflows/        # CI/CD
```

---

## 14. Coding Conventions

- TypeScript strict (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`). No `any`; use `unknown` + Zod at trust boundaries.
- `PascalCase` components, `camelCase` functions/vars, `SCREAMING_SNAKE_CASE` constants, kebab-case filenames.
- `"use client"` only where required; CRDT/sync/local-db are client-only, never imported in RSC paths.
- Route Handlers return `{ error: { code, message } }` — no stack traces. Sync errors: `transient` (retry) vs `permanent` (surface + stop).
- No silent catches. ESLint + Prettier enforced in CI. Custom lint rule: no unscoped DB queries.

---

## 15. Performance Decisions

- Editor, Yjs, IndexedDB dynamically imported (`next/dynamic`, `ssr: false`); SSR shell is metadata + auth gate only.
- Version timeline virtualized; presence cursors decoupled from doc re-render.
- Outbox flush debounced ~300ms (max ~2s cap); awareness throttled ~50ms.
- IndexedDB stores incremental updates + periodic merged snapshot to bound read/write cost.

---

## 16. Scalability Decisions

- **DB:** transaction-mode pooler (Supabase/PgBouncer/Neon); no long-lived connections from serverless functions.
- **WS:** horizontal relay + Redis Pub/Sub for broadcast correctness without sticky sessions.
- **Documents:** max size cap + snapshot compaction bounds `crdt_updates` growth.
- **Scaling tiers:** single relay sufficient at low scale; add Pub/Sub + replicas at medium; shard relay by `documentId` range at high scale.

---

## 17. Trade-offs

1. Yjs memory overhead (tombstones) ← accepted; bounded by GC + compaction.
2. Dual persistence complexity ← required for offline-first correctness.
3. Off-Vercel WS service ← required; Vercel can't host persistent sockets.
4. Triple viewer write-block (DRY violation) ← correctness over brevity.
5. Decode-to-validate CPU cost ← only reliable malformed-payload defense.
6. DB sessions (read per request) ← enables revocation; security > perf.
7. Snapshot storage cost ← mitigated by compaction + exponential-decay retention.
8. AI online-only ← accepted; AI is productivity, not core data path.

---

## 18. Assumptions

1. Evergreen browsers (IndexedDB + WebSocket); no legacy support.
2. Documents are rich text in the low-MB range; not binary/media.
3. Concurrent editors per doc: single digits to low tens.
4. Users may be offline for hours; offline work must survive and merge.
5. One non-Vercel service (WS relay) + managed Redis + managed PostgreSQL are acceptable deployment targets.
6. Clock skew between clients is irrelevant (CRDT merge is not wall-clock ordered).

---

## 19. Risks

| # | Risk | Mitigation |
|---|---|---|
| 1 | WS can't run on Vercel | Dedicated relay + HTTP/SSE sync fallback |
| 2 | Poison CRDT payload corrupts log | Size → Zod → decode-to-throwaway before persist |
| 3 | OOM via abusive payloads | Size caps + rate limits + per-connection ceilings |
| 4 | Unbounded log/snapshot/Y.Doc growth | GC + compaction + retention thinning + size caps |
| 5 | Viewer bypasses write-block | Triple enforcement: client + relay + RLS |
| 6 | Tenant data leakage | RLS + ORM scoping + lint rule |
| 7 | Serverless DB connection exhaustion | Transaction-mode pooler |
| 8 | Restore corrupts active session | Restore-as-forward-op + pre-restore auto snapshot |
| 9 | Sync drops/duplicates ops | Durable outbox + idempotent CRDT + ack-then-prune |
| 10 | AI prompt injection | Server-only keys, delimited doc content in prompts |
| 11 | WS token replay | 60s TTL, per-document-role scoped, refreshed on reconnect |
| 12 | IndexedDB eviction loses work | Persistent-storage API request; server backstop after sync |
