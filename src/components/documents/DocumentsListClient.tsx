"use client"

import { useEffect, useState, useMemo } from 'react'
import { localDb, DocumentMeta } from '@/lib/local-db/schema'
import Link from 'next/link'
import { FileText, MoreVertical, Search, Plus } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

export function DocumentsListClient({ initialDocuments }: { initialDocuments: any[] }) {
  const [documents, setDocuments] = useState<DocumentMeta[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const filter = searchParams.get('filter')

  useEffect(() => {
    async function syncLocal() {
      if (initialDocuments.length > 0) {
        const metas: DocumentMeta[] = initialDocuments.map(doc => ({
          id: doc.id,
          title: doc.title,
          role: doc.members[0]?.role || 'VIEWER',
          updatedAt: new Date(doc.updatedAt).getTime()
        }))
        await localDb.documentsMeta.bulkPut(metas)
        setDocuments(metas)
      } else {
        const cached = await localDb.documentsMeta.toArray()
        setDocuments(cached.sort((a, b) => b.updatedAt - a.updatedAt))
      }
      setIsLoading(false)
    }
    syncLocal()

    const handleClickOutside = () => setOpenMenuId(null)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [initialDocuments])

  const filteredDocs = useMemo(() => {
    let result = documents

    if (filter === 'shared') {
      result = result.filter(doc => doc.role !== 'OWNER')
    } else if (filter === 'recent') {
      // Already sorted by updatedAt, but we can enforce a limit if needed
      result = result.slice(0, 10)
    }

    if (search) {
      result = result.filter(doc => doc.title.toLowerCase().includes(search.toLowerCase()))
    }
    
    return result
  }, [documents, search, filter])

  const emptyState = useMemo(() => {
    if (search) {
      return {
        title: 'No matches found',
        description: `We couldn't find any documents matching "${search}".`,
        showCreate: false,
      }
    }
    if (filter === 'shared') {
      return {
        title: 'No shared documents',
        description: "Documents others share with you will appear here.",
        showCreate: false,
      }
    }
    if (filter === 'recent') {
      return {
        title: 'Nothing recent yet',
        description: "Documents you open or edit will show up here.",
        showCreate: true,
      }
    }
    return {
      title: 'No documents yet',
      description: "Get started by creating your first collaborative document.",
      showCreate: true,
    }
  }, [search, filter])

  const handleCreate = async () => {
    const res = await fetch('/api/documents', { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      router.push(`/documents/${data.document.id}`)
    }
  }

  const handleDelete = async (e: React.MouseEvent, docId: string, role: string) => {
    e.preventDefault() // Prevent Link navigation
    
    if (role !== 'OWNER') {
      alert("Only the owner can delete this document.")
      return
    }
    
    if (!confirm("Are you sure you want to permanently delete this document?")) return

    try {
      const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' })
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== docId))
        await localDb.documentsMeta.delete(docId)
      } else {
        const err = await res.json()
        alert(err.error || "Failed to delete document.")
      }
    } catch (e) {
      console.error("Delete error", e)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="skeleton h-10 w-full max-w-md rounded-lg" />
          <div className="skeleton h-10 w-36 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col p-5 bg-card border border-border rounded-xl">
              <div className="skeleton h-10 w-10 rounded-lg mb-4" />
              <div className="skeleton h-4 w-3/4 rounded-md mb-2" />
              <div className="flex items-center justify-between mt-auto pt-4">
                <div className="skeleton h-3 w-20 rounded" />
                <div className="skeleton h-5 w-14 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 transition-shadow"
          />
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-brand hover:opacity-90 text-brand-foreground px-4 py-2 rounded-lg text-sm font-medium transition-opacity shadow-sm"
        >
          <Plus size={18} />
          <span>Create new</span>
        </button>
      </div>

      {filteredDocs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDocs.map(doc => (
            <div 
              key={doc.id} 
              onClick={() => router.push(`/documents/${doc.id}`)}
              className="group flex flex-col p-5 bg-card border border-border rounded-xl hover:shadow-md hover:border-brand/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-accent text-accent-foreground flex items-center justify-center shrink-0">
                  <FileText size={20} />
                </div>
                {doc.role === 'OWNER' && (
                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        e.nativeEvent.stopPropagation() // Stops bubbling to document (fixes the bug)
                        setOpenMenuId(openMenuId === doc.id ? null : doc.id)
                      }}
                      className="p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground hover:bg-secondary rounded-md transition-all"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {openMenuId === doc.id && (
                      <div
                        className="absolute right-0 top-8 w-36 bg-popover text-popover-foreground border border-border rounded-lg shadow-lg overflow-hidden z-20"
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => handleDelete(e, doc.id, doc.role)}
                          className="w-full text-left px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <h2 className="text-base font-medium text-foreground mb-1 line-clamp-1">
                {doc.title || 'Untitled Document'}
              </h2>
              <div className="flex items-center justify-between mt-auto pt-4 text-xs text-muted-foreground">
                <span>{new Date(doc.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium capitalize">
                  {doc.role.toLowerCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center border-2 border-dashed border-border rounded-2xl bg-card/40">
          <div className="w-16 h-16 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center mb-4">
            <FileText size={32} />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">{emptyState.title}</h3>
          <p className="text-muted-foreground max-w-sm mb-6">{emptyState.description}</p>
          {emptyState.showCreate && (
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 bg-brand hover:opacity-90 text-brand-foreground px-6 py-2.5 rounded-lg text-sm font-medium transition-opacity shadow-sm"
            >
              <Plus size={18} />
              Create Document
            </button>
          )}
        </div>
      )}
    </div>
  )
}
