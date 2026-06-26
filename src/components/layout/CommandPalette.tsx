"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { Search, FileText, Settings, Sparkles } from 'lucide-react'
import { localDb } from '@/lib/local-db/schema'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [documents, setDocuments] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  useEffect(() => {
    if (open) {
      localDb.documentsMeta.toArray().then(setDocuments)
    }
  }, [open])

  const filteredDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5)

  const handleSelect = (id: string) => {
    setOpen(false)
    router.push(`/documents/${id}`)
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[20%] z-[100] grid w-full max-w-lg translate-x-[-50%] gap-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-0 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[20%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[20%] rounded-xl overflow-hidden">
          <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Type a command or search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto p-2">
            {filteredDocs.length > 0 ? (
              <div className="mb-4">
                <div className="px-2 text-xs font-semibold text-zinc-500 mb-2">Documents</div>
                {filteredDocs.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => handleSelect(doc.id)}
                    className="w-full flex items-center px-2 py-2 text-sm rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 transition-colors"
                  >
                    <FileText className="mr-2 h-4 w-4 text-brand" />
                    {doc.title || 'Untitled Document'}
                  </button>
                ))}
              </div>
            ) : null}
            
            <div>
              <div className="px-2 text-xs font-semibold text-zinc-500 mb-2">Quick Actions</div>
              <button
                onClick={() => { setOpen(false); router.push('/documents') }}
                className="w-full flex items-center px-2 py-2 text-sm rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 transition-colors"
              >
                <Search className="mr-2 h-4 w-4" />
                Go to Dashboard
              </button>
              <button
                onClick={() => { setOpen(false); router.push('/documents') }} // Mock settings route
                className="w-full flex items-center px-2 py-2 text-sm rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 transition-colors"
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
