"use client"

import { useEffect, useState } from 'react'
import * as Y from 'yjs'
import { createLocalDoc } from '@/lib/crdt/doc'
import { appendToOutbox } from '@/lib/local-db/outbox'
import { ConnectionManager } from '@/lib/ws/connection'
import { WebsocketProvider } from 'y-websocket'
import { Awareness } from 'y-protocols/awareness'
import { SyncEngine } from '@/lib/sync/engine'

const SYNC_ORIGIN = 'sync'

export function useDocument(documentId: string) {
  const [doc, setDoc] = useState<Y.Doc | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<string>('disconnected')
  const [provider, setProvider] = useState<WebsocketProvider | null>(null)
  const [awareness, setAwareness] = useState<Awareness | null>(null)

  useEffect(() => {
    let mounted = true
    let yDoc: Y.Doc | null = null
    let connectionManager: ConnectionManager | null = null
    let syncEngine: SyncEngine | null = null
    let updateHandler: ((update: Uint8Array, origin: unknown) => void) | null = null

    async function init() {
      // 1. Load from IndexedDB (instant, offline-capable source of truth).
      const { doc: localDoc } = await createLocalDoc(documentId)
      if (!mounted) {
        localDoc.destroy()
        return
      }
      yDoc = localDoc

      // 2. Queue every *local* edit into the durable outbox. Updates merged in from
      //    the server (origin 'sync') are skipped so they aren't echoed back.
      updateHandler = (update: Uint8Array, origin: unknown) => {
        if (origin !== SYNC_ORIGIN) void appendToOutbox(documentId, update)
      }
      localDoc.on('update', updateHandler)

      // 3. Hydrate from the durable Postgres log BEFORE revealing the editor, so a
      //    fresh device reconstructs the full document even if no peer is online.
      syncEngine = new SyncEngine(documentId, localDoc)
      await syncEngine.pull()
      if (!mounted) return

      setDoc(localDoc)
      setLoading(false)

      // 4. Live realtime fan-out (presence + low-latency edits) via the relay.
      const localAwareness = new Awareness(localDoc)
      setAwareness(localAwareness)

      connectionManager = new ConnectionManager(documentId, localDoc, localAwareness, (status) => {
        if (mounted) setSyncStatus(status)
      })
      await connectionManager.connect()
      if (mounted) setProvider(connectionManager.getProvider())

      // 5. Begin background push (drain outbox). pull() already ran above.
      syncEngine.start()
    }

    void init()

    return () => {
      mounted = false
      syncEngine?.stop()
      connectionManager?.disconnect()
      if (yDoc && updateHandler) yDoc.off('update', updateHandler)
      yDoc?.destroy()
    }
  }, [documentId])

  return { doc, loading, syncStatus, provider, awareness }
}
