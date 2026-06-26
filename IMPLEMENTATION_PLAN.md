# IMPLEMENTATION_PLAN.md

> Follows `ARCHITECTURE_DECISIONS.md`. No deviations without an ADR amendment.
> **Stack:** Next.js 16, React 19, TypeScript strict, Tailwind CSS, shadcn/ui, PostgreSQL, Drizzle, Auth.js v5, Yjs, Dexie.js, Vercel AI SDK.

---

## Phase 1 — Foundation + Auth + Database

**Goals:** Deployable skeleton with auth, role-based access, and verified PostgreSQL schema + RLS.

**Files to create:**
- `src/lib/db/schema.ts` — Drizzle schema (users, documents, document_members, crdt_updates, snapshots, ai_messages, Auth.js adapter tables)
- `src/lib/db/client.ts` — pooled Drizzle client
- `src/lib/db/rls.ts` — `setRLSUser(userId)` helper (SET LOCAL)
- `src/lib/auth/config.ts` — Auth.js v5 config (Google/GitHub providers, Drizzle adapter)
- `src/lib/authz/guard.ts` — `authorizeDocumentAccess(userId, docId, role)`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/api/documents/route.ts` — list + create
- `src/app/api/documents/[id]/route.ts` — get, update title, delete
- `src/app/(auth)/sign-in/page.tsx`
- `src/app/(app)/documents/page.tsx` — document listing
- `src/app/(app)/layout.tsx`
- `drizzle/0001_initial.sql`
- `.github/workflows/ci.yml`

**Files to modify:**
- `next.config.ts` — security headers (CSP, HSTS, X-Content-Type-Options)
- `tailwind.config.ts`, `src/app/globals.css`

**Acceptance criteria:**
- User can sign in via OAuth; session persists across refresh
- Owner, Editor, Viewer roles stored and enforced; `authorizeDocumentAccess` returns 403 on violation
- RLS blocks cross-tenant SELECT and INSERT at the DB level (verified by direct SQL test)
- Documents CRUD works for authenticated users; unauthenticated requests return 401
- CI pipeline runs on every push; build passes

**Test checklist:**
- [ ] Sign-in flow (OAuth) — E2E
- [ ] `authorizeDocumentAccess` — unit tests for all role × action combinations
- [ ] RLS policy — integration test: query as wrong user returns no rows
- [ ] Document list/create/delete API — integration tests
- [ ] 401 on unauthenticated route — unit test

---

## Phase 2 — Offline-First + IndexedDB + CRDT

**Goals:** Editor works fully offline; keystrokes never block on network; state survives refresh.

**Files to create:**
- `src/lib/crdt/doc.ts` — Y.Doc factory, encode/decode helpers
- `src/lib/local-db/schema.ts` — Dexie schema (ydoc store, outbox, documents-meta, sync-cursor)
- `src/lib/local-db/outbox.ts` — append, ack, reject, prune helpers
- `src/components/editor/Editor.tsx` — Tiptap + y-prosemirror (client, `ssr: false`)
- `src/components/editor/EditorShell.tsx` — RSC wrapper with `next/dynamic`
- `src/components/status/ConnectionBadge.tsx` — online/offline/syncing indicator
- `src/hooks/useDocument.ts` — loads Y.Doc from IndexedDB, exposes doc + status
- `src/app/(app)/documents/[documentId]/page.tsx` — editor page (SSR shell)

**Files to modify:**
- `src/app/(app)/documents/page.tsx` — link to editor; show offline-cached list
- `src/app/(app)/layout.tsx` — mount connection status badge

**Acceptance criteria:**
- Document opens and is editable with network disabled
- Edits persist through hard refresh (IndexedDB survives)
- Two Y.Doc states merged offline produce deterministic convergent result
- No network request blocks or delays a keystroke (verified via DevTools network throttle)
- Outbox entries appear on edit and are marked pending

**Test checklist:**
- [ ] Y.Doc encode → persist → reload → decode produces identical state — unit
- [ ] Offline edit + refresh = content preserved — E2E (Playwright offline mode)
- [ ] Outbox append on edit, prune on ack — unit
- [ ] CRDT merge: two diverged docs converge to same state — unit
- [ ] Editor renders without SSR (`ssr: false` guard) — unit

---

## Phase 3 — Realtime Collaboration + Sync Engine + Version History

**Goals:** Multiple users co-edit in real time; offline edits merge on reconnect; snapshot-based version history with safe restore.

**Files to create:**
- `relay/src/server.ts` — Node WS relay (y-websocket protocol, Redis Pub/Sub fan-out)
- `relay/src/rooms.ts` — room management, viewer frame rejection
- `src/lib/ws/connection.ts` — client WS connection manager (state machine)
- `src/lib/sync/engine.ts` — outbox drain, state-vector exchange, retry/backoff
- `src/app/api/documents/[id]/ws-token/route.ts` — mint short-lived JWT (~60s)
- `src/app/api/documents/[id]/updates/route.ts` — HTTP sync fallback (GET/POST)
- `src/app/api/documents/[id]/snapshots/route.ts` — create, list, restore
- `src/components/version-history/VersionPanel.tsx` — timeline UI
- `src/components/presence/PresenceCursors.tsx` — awareness cursors
- `src/hooks/useSyncStatus.ts`
- `src/hooks/usePresence.ts`

**Files to modify:**
- `src/components/editor/Editor.tsx` — wire awareness + sync engine
- `src/components/status/ConnectionBadge.tsx` — reflect sync engine state
- `src/app/(app)/documents/[documentId]/page.tsx` — mount VersionPanel, PresenceCursors

**Acceptance criteria:**
- Two browser sessions co-editing same document converge within ~1s online
- Offline edits on client A merge correctly when A reconnects (no data loss, no overwrite)
- Viewer session cannot push updates (relay drops frame; RLS blocks INSERT)
- Snapshot created manually and via auto-trigger; restore applies as forward op, active session uninterrupted
- WS token expires and reconnect mints a fresh one transparently

**Test checklist:**
- [ ] Sync engine state machine transitions — unit
- [ ] Outbox retry with exponential backoff — unit
- [ ] Two-client convergence — E2E (Playwright multi-page)
- [ ] Offline edit → reconnect → merge — E2E
- [ ] Viewer write blocked at relay and RLS — integration
- [ ] Snapshot create + restore — integration
- [ ] Restore does not corrupt concurrent editor session — E2E

---

## Phase 4 — AI + Security + Testing + Deployment

**Goals:** AI productivity features live; security hardening complete; full test suite passing; production deployed with CI/CD.

**Files to create:**
- `src/lib/ai/router.ts` — provider routing (Groq → Gemini → OpenAI)
- `src/lib/ai/prompts.ts` — prompt templates (summary, change-summary, meeting notes, action items, chat)
- `src/lib/ai/chunker.ts` — map-reduce chunking + retrieval for large docs
- `src/lib/validation/schemas.ts` — Zod schemas for all Route Handler inputs
- `src/app/api/ai/[feature]/route.ts` — streaming AI endpoints
- `src/components/ai/AIPanel.tsx` — summary, chat, action items UI
- `tests/unit/` — unit test suite (Vitest)
- `tests/e2e/` — E2E suite (Playwright)
- `relay/Dockerfile` + `fly.toml` (or Railway config)

**Files to modify:**
- All Route Handlers — add Zod validation + size-limit enforcement
- `relay/src/server.ts` — add max frame size, per-connection rate limit, CRDT decode-to-validate
- `next.config.ts` — finalize CSP, bundle analysis
- `.github/workflows/ci.yml` — add test, lint, type-check, deploy steps
- `src/app/(app)/documents/[documentId]/page.tsx` — mount AIPanel

**Acceptance criteria:**
- AI summary, action items, and chat work for online users; all disabled with clear indicator when offline
- Every Route Handler rejects malformed/oversized payloads with 400 (no stack trace)
- Malformed Yjs binary rejected by relay before persisting (decode-to-validate)
- All unit + integration + E2E tests pass in CI
- App deployed to Vercel (Next.js) + relay deployed (Railway/Fly); live URL accessible
- Footer displays name, GitHub, LinkedIn

**Test checklist:**
- [ ] Zod validation rejects invalid payloads — unit (per Route Handler)
- [ ] Oversized body returns 400 — integration
- [ ] Malformed Yjs update rejected, not persisted — integration
- [ ] AI summary returns streamed response — integration
- [ ] AI disabled when offline (no network) — E2E
- [ ] Full offline → edit → reconnect → sync flow — E2E
- [ ] Auth + role enforcement end-to-end — E2E
- [ ] CI pipeline: lint, typecheck, test, deploy all green
