-- Row-Level Security (RLS) — database-enforced tenant isolation.
--
-- This is DEFENCE-IN-DEPTH layered on top of the per-route authorization guards
-- (authorizeDocumentAccess). Even if an application query forgets to scope by user,
-- Postgres refuses to return rows the current user cannot access.
--
-- Policies key off the session variable `app.current_user_id`, which the app sets
-- per-transaction via src/lib/db/rls.ts -> withRLS(userId, ...). Queries made through
-- that helper are isolated; ensure data-plane queries (documents, updates, snapshots)
-- run inside withRLS in production.
--
-- A user may access a document iff they have a DocumentMember row for it.

-- Helper: documents the current user is a member of.
CREATE OR REPLACE FUNCTION app_current_user_id() RETURNS text AS $$
  SELECT current_setting('app.current_user_id', true);
$$ LANGUAGE sql STABLE;

-- ---- DocumentMember ---------------------------------------------------------
ALTER TABLE "DocumentMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DocumentMember" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dm_select ON "DocumentMember";
CREATE POLICY dm_select ON "DocumentMember"
  FOR SELECT USING (
    "userId" = app_current_user_id()
    OR "documentId" IN (
      SELECT "documentId" FROM "DocumentMember"
      WHERE "userId" = app_current_user_id() AND "role" = 'OWNER'
    )
  );

-- ---- Document ---------------------------------------------------------------
ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Document" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS doc_access ON "Document";
CREATE POLICY doc_access ON "Document"
  USING (
    "id" IN (
      SELECT "documentId" FROM "DocumentMember"
      WHERE "userId" = app_current_user_id()
    )
  );

-- ---- CrdtUpdate -------------------------------------------------------------
ALTER TABLE "CrdtUpdate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CrdtUpdate" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crdt_access ON "CrdtUpdate";
CREATE POLICY crdt_access ON "CrdtUpdate"
  USING (
    "documentId" IN (
      SELECT "documentId" FROM "DocumentMember"
      WHERE "userId" = app_current_user_id()
    )
  );

-- ---- Snapshot ---------------------------------------------------------------
ALTER TABLE "Snapshot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Snapshot" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS snap_access ON "Snapshot";
CREATE POLICY snap_access ON "Snapshot"
  USING (
    "documentId" IN (
      SELECT "documentId" FROM "DocumentMember"
      WHERE "userId" = app_current_user_id()
    )
  );

-- ---- AiMessage --------------------------------------------------------------
ALTER TABLE "AiMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AiMessage" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_access ON "AiMessage";
CREATE POLICY ai_access ON "AiMessage"
  USING (
    "documentId" IN (
      SELECT "documentId" FROM "DocumentMember"
      WHERE "userId" = app_current_user_id()
    )
  );
