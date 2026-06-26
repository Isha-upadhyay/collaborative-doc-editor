"use client"

import { useState, useEffect, useCallback } from 'react'
import * as Y from 'yjs'
import { History, Save, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { Editor as TipTapEditor } from '@tiptap/core'
import { yDocToProsemirrorJSON } from 'y-prosemirror'

export function VersionPanel({ documentId, doc, editorRef }: { documentId: string, doc: Y.Doc, editorRef?: React.RefObject<TipTapEditor | null> }) {
  const [snapshots, setSnapshots] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  const loadSnapshots = useCallback(async () => {
    try {
      const res = await fetch(`/api/documents/${documentId}/snapshots`)
      if (res.ok) {
        const data = await res.json()
        setSnapshots(data.snapshots)
      }
    } finally {
      setIsFetching(false)
    }
  }, [documentId])

  useEffect(() => {
    loadSnapshots()
  }, [loadSnapshots])

  async function createSnapshot() {
    setLoading(true)
    const update = Y.encodeStateAsUpdate(doc)
    const base64Update = btoa(Array.from(update).map(b => String.fromCharCode(b)).join(''))
    
    await fetch(`/api/documents/${documentId}/snapshots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stateVector: base64Update, versionId: `v${snapshots.length + 1}` })
    })
    
    await loadSnapshots()
    setLoading(false)
  }

  function restoreSnapshot(base64Update: string) {
    const editor = editorRef?.current
    if (!editor) return

    const binaryStr = atob(base64Update)
    const update = new Uint8Array(binaryStr.length)
    for (let i = 0; i < binaryStr.length; i++) {
      update[i] = binaryStr.charCodeAt(i)
    }

    // Decode the snapshot into a throwaway doc to read its ProseMirror content.
    const tempDoc = new Y.Doc()
    Y.applyUpdate(tempDoc, update)
    // TipTap stores the editor content under the 'content' field in Yjs.
    const jsonContent = yDocToProsemirrorJSON(tempDoc, 'content')
    tempDoc.destroy()

    // Replace the whole document via a real ProseMirror transaction. The Yjs
    // sync plugin observes this transaction and writes the delta into the
    // 'content' fragment, so the restore propagates to collaborators AND
    // persists through the sync engine + IndexedDB (unlike commands.setContent,
    // which only touches the view and is reverted by the collaboration binding).
    const { state, view } = editor
    const newDoc = state.schema.nodeFromJSON(jsonContent)
    const tr = state.tr.replaceWith(0, state.doc.content.size, newDoc.content)
    tr.setMeta('addToHistory', true)
    view.dispatch(tr)
    editor.commands.focus()
  }

  return (
    <div className="flex flex-col h-full bg-card overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <History className="w-5 h-5 text-brand" />
        <h2 className="font-semibold text-foreground">Version History</h2>
      </div>

      <div className="p-4 border-b border-border">
        <Button
          onClick={createSnapshot}
          disabled={loading}
          className="w-full bg-brand hover:opacity-90 text-brand-foreground shadow-sm rounded-xl"
        >
          {loading ? <RotateCcw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {loading ? 'Saving snapshot...' : 'Save Current Version'}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 scroll-smooth">
        {isFetching ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border border-border p-4 rounded-xl">
                <div className="skeleton h-4 w-24 rounded mb-2" />
                <div className="skeleton h-3 w-36 rounded mb-4" />
                <div className="skeleton h-8 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
        <div className="relative border-l-2 border-border ml-3 space-y-6 pb-6">
          {snapshots.map((s, idx) => (
            <div key={s.id} className="relative pl-6 group">
              {/* Timeline Dot */}
              <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-card border-2 border-brand z-10" />

              <div className="border border-border p-4 rounded-xl bg-card hover:bg-secondary transition-all shadow-sm relative">
                {idx === 0 && <span className="absolute -top-3 right-3 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-wider border border-brand/20 shadow-sm">Latest</span>}

                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                      {s.versionId}
                    </div>
                    <div className="text-muted-foreground text-xs mt-0.5">{new Date(s.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-brand to-brand-2 flex items-center justify-center text-white text-[10px] font-bold">
                    A
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">Auto-saved Snapshot</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => restoreSnapshot(s.stateVector)}
                  className="w-full h-8 text-xs font-medium text-foreground border-border hover:bg-accent hover:text-accent-foreground hover:border-brand/30 transition-colors rounded-lg"
                >
                  Restore this version
                </Button>
              </div>
            </div>
          ))}

          {snapshots.length === 0 && (
            <div className="pl-6 text-center py-8">
              <History className="w-8 h-8 mx-auto text-muted-foreground/60 mb-2" />
              <p className="text-muted-foreground text-sm">No snapshots recorded yet.</p>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  )
}
