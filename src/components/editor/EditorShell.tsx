"use client"

import dynamic from 'next/dynamic'
import { useDocument } from '@/hooks/useDocument'
import { VersionPanel } from '@/components/version-history/VersionPanel'
import { AIPanel } from '@/components/ai/AIPanel'
import { Skeleton } from '@/components/ui/skeleton'
import { CloudOff, Cloud, RefreshCw, Share, Users, X, Loader2, Sparkles, History } from 'lucide-react'
import { useRef, useCallback, useState } from 'react'
import type { Editor as TipTapEditor } from '@tiptap/core'

const Editor = dynamic(() => import('./Editor'), {
  ssr: false,
  loading: () => <Skeleton className="h-[500px] w-full rounded-xl" />,
})

function SyncStatusBadge({ status }: { status: string }) {
  const base = 'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium'
  if (status === 'disconnected')
    return <div className={`${base} bg-red-50 text-red-600 dark:bg-red-950/30`}><CloudOff size={14} /> Offline</div>
  if (status === 'connecting')
    return <div className={`${base} bg-amber-50 text-amber-600 dark:bg-amber-950/30`}><RefreshCw size={14} className="animate-spin" /> Connecting</div>
  if (status === 'syncing')
    return <div className={`${base} bg-accent text-brand`}><RefreshCw size={14} className="animate-spin" /> Syncing</div>
  return <div className={`${base} bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30`}><Cloud size={14} /> Synced</div>
}

export function EditorShell({
  documentId,
  initialTitle,
  user,
  userRole,
}: {
  documentId: string
  initialTitle: string
  user: { id: string; name: string | null }
  userRole: string
}) {
  const { doc, loading, syncStatus, awareness } = useDocument(documentId)
  const editorRef = useRef<TipTapEditor | null>(null)

  const [title, setTitle] = useState(initialTitle)
  const [isSavingTitle, setIsSavingTitle] = useState(false)

  const [isShareOpen, setIsShareOpen] = useState(false)
  const [shareEmail, setShareEmail] = useState('')
  const [shareRole, setShareRole] = useState('VIEWER')
  const [shareLoading, setShareLoading] = useState(false)
  const [shareMessage, setShareMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  // Mobile/tablet slide-over for AI + Version (hidden side panel on < lg)
  const [mobilePanel, setMobilePanel] = useState<'ai' | 'history' | null>(null)

  const handleEditorReady = useCallback((editor: TipTapEditor) => {
    editorRef.current = editor
  }, [])

  const handleTitleBlur = async () => {
    if (title === initialTitle || !title.trim()) return
    setIsSavingTitle(true)
    try {
      await fetch(`/api/documents/${documentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() }),
      })
    } catch (e) {
      console.error(e)
    } finally {
      setIsSavingTitle(false)
    }
  }

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault()
    setShareLoading(true)
    setShareMessage(null)
    try {
      const res = await fetch(`/api/documents/${documentId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: shareEmail, role: shareRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to share document')
      setShareMessage({ type: 'success', text: 'Document shared successfully!' })
      setShareEmail('')
    } catch (err: any) {
      setShareMessage({ type: 'error', text: err.message })
    } finally {
      setShareLoading(false)
    }
  }

  if (loading || !doc) {
    return (
      <div className="mx-auto flex h-full w-full max-w-4xl flex-col gap-4 px-6 pt-16">
        <Skeleton className="h-12 w-3/4 rounded-lg" />
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-5/6 rounded-md" />
        <Skeleton className="mt-6 h-64 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-background">
      {/* Top bar */}
      <header className="z-20 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-background/70 pl-14 pr-3 backdrop-blur md:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <input
            type="text"
            value={title}
            readOnly={userRole === 'VIEWER'}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur()
            }}
            aria-label="Document title"
            className={`min-w-0 flex-1 truncate rounded-md border-transparent bg-transparent px-2 py-1 font-semibold outline-none transition-all ${
              userRole !== 'VIEWER' ? 'hover:bg-secondary focus:ring-2 focus:ring-brand/30' : ''
            }`}
            placeholder="Untitled Document"
          />
          {isSavingTitle && <RefreshCw className="h-3 w-3 shrink-0 animate-spin text-muted-foreground" />}
          <div className="hidden shrink-0 sm:block">
            <SyncStatusBadge status={syncStatus} />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* Mobile/tablet panel toggles */}
          <button
            onClick={() => setMobilePanel('ai')}
            aria-label="Open AI assistant"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary lg:hidden"
          >
            <Sparkles size={16} />
          </button>
          <button
            onClick={() => setMobilePanel('history')}
            aria-label="Open version history"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary lg:hidden"
          >
            <History size={16} />
          </button>

          {userRole === 'OWNER' && (
            <button
              onClick={() => setIsShareOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90 sm:px-4"
            >
              <Share className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
          )}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-brand to-brand-2 text-xs font-bold text-white">
            {(user.name || 'U').charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        {/* Editor canvas */}
        <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8 sm:py-12">
          <div className="mx-auto max-w-3xl">
            <Editor key={doc.guid} doc={doc} awareness={awareness} user={user} onEditorReady={handleEditorReady} />
          </div>
        </div>

        {/* Desktop side panel */}
        <aside className="hidden w-[360px] shrink-0 flex-col overflow-hidden border-l border-border bg-secondary/30 lg:flex">
          <div className="flex min-h-0 flex-[3] flex-col overflow-hidden border-b border-border">
            <AIPanel key={doc.guid + '-ai'} doc={doc} editorRef={editorRef} />
          </div>
          <div className="flex min-h-0 flex-[2] flex-col overflow-hidden">
            <VersionPanel key={doc.guid + '-version'} documentId={documentId} doc={doc} editorRef={editorRef} />
          </div>
        </aside>
      </div>

      {/* Mobile/tablet slide-over panel */}
      {mobilePanel && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobilePanel(null)} />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-background shadow-2xl">
            <div className="flex items-center gap-1 border-b border-border p-2">
              <button
                onClick={() => setMobilePanel('ai')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors ${
                  mobilePanel === 'ai' ? 'bg-secondary text-foreground' : 'text-muted-foreground'
                }`}
              >
                <Sparkles size={15} /> AI
              </button>
              <button
                onClick={() => setMobilePanel('history')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors ${
                  mobilePanel === 'history' ? 'bg-secondary text-foreground' : 'text-muted-foreground'
                }`}
              >
                <History size={15} /> History
              </button>
              <button
                onClick={() => setMobilePanel(null)}
                aria-label="Close panel"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {mobilePanel === 'ai' ? (
                <AIPanel key={doc.guid + '-ai-m'} doc={doc} editorRef={editorRef} />
              ) : (
                <VersionPanel key={doc.guid + '-v-m'} documentId={documentId} doc={doc} editorRef={editorRef} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share modal */}
      {isShareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <button
              onClick={() => setIsShareOpen(false)}
              aria-label="Close share dialog"
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-accent p-3 text-accent-foreground">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-tight">Share Document</h3>
                <p className="text-sm text-muted-foreground">Invite collaborators to this document.</p>
              </div>
            </div>

            <form onSubmit={handleShare} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">User Email</label>
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="collaborator@example.com"
                  required
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none transition-all focus:ring-2 focus:ring-brand/30"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Access Level</label>
                <select
                  value={shareRole}
                  onChange={(e) => setShareRole(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none transition-all focus:ring-2 focus:ring-brand/30"
                >
                  <option value="VIEWER">Viewer (Can only read)</option>
                  <option value="EDITOR">Editor (Can edit and use AI)</option>
                </select>
              </div>

              {shareMessage && (
                <div
                  className={`rounded-xl border p-3 text-sm font-medium ${
                    shareMessage.type === 'success'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-red-200 bg-red-50 text-red-700'
                  }`}
                >
                  {shareMessage.text}
                </div>
              )}

              <button
                type="submit"
                disabled={shareLoading || !shareEmail}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2.5 font-medium text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {shareLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send Invite'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
