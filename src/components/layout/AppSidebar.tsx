"use client"

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  FileText,
  Search,
  Clock,
  Users,
  Settings,
  PlusCircle,
  Menu,
  ChevronLeft,
  LogOut,
  X,
  Loader2,
} from 'lucide-react'
import { signOut } from 'next-auth/react'

const navItems = [
  { name: 'All Documents', href: '/documents', icon: FileText },
  { name: 'Recent', href: '/documents?filter=recent', icon: Clock },
  { name: 'Shared', href: '/documents?filter=shared', icon: Users },
]

export function AppSidebar({ user }: { user: { name: string | null; email: string | null } }) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  const isWide = !collapsed

  const createDocument = async () => {
    if (creating) return
    setCreating(true)
    try {
      const res = await fetch('/api/documents', { method: 'POST' })
      if (res.ok) {
        const { document } = await res.json()
        setMobileOpen(false)
        router.push(`/documents/${document.id}`)
      }
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      {/* Mobile hamburger — fixed, only when drawer closed */}
      {!mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          className="fixed left-3 top-2.5 z-40 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card/80 text-foreground backdrop-blur md:hidden"
        >
          <Menu size={18} />
        </button>
      )}

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen shrink-0 flex-col border-r border-border bg-card shadow-xl transition-all duration-300 md:relative md:translate-x-0 md:bg-secondary/40 md:shadow-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isWide ? 'w-64' : 'w-16'}`}
      >
        {/* Brand row */}
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          {isWide && (
            <Link
              href="/documents"
              className="flex items-center gap-2 truncate font-semibold tracking-tight"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-tr from-brand to-brand-2 text-white">
                <FileText className="h-3.5 w-3.5" />
              </span>
              <span>Collaborativa</span>
            </Link>
          )}
          {/* Desktop collapse */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="mx-auto hidden rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary md:block"
          >
            {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
          </button>
          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
            className="rounded-md p-1 text-muted-foreground hover:bg-secondary md:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* New document */}
        <div className="p-3">
          <button
            onClick={createDocument}
            disabled={creating}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-2 text-sm font-medium text-brand-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {creating ? <Loader2 size={18} className="animate-spin" /> : <PlusCircle size={18} />}
            {isWide && <span>New Document</span>}
          </button>
        </div>

        {/* Search (link to documents) */}
        <div className="px-3 pb-1">
          <Link
            href="/documents"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary ${
              isWide ? '' : 'justify-center'
            }`}
          >
            <Search size={18} />
            {isWide && <span>Search…</span>}
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href.split('?')[0] && item.href === '/documents'
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-secondary font-medium text-foreground'
                    : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                } ${isWide ? '' : 'justify-center'}`}
              >
                <item.icon size={18} />
                {isWide && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-border p-4">
          <div className={`flex items-center gap-3 ${isWide ? '' : 'justify-center'}`}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-brand to-brand-2 text-sm font-bold text-white">
              {(user.name || user.email || 'U').charAt(0).toUpperCase()}
            </div>
            {isWide && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user.name || 'User'}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
            )}
          </div>

          {isWide && (
            <div className="mt-4 flex flex-col gap-1">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-3 rounded px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <Settings size={16} />
                <span>Settings</span>
              </button>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-3 rounded px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut size={16} />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Settings modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <button
              onClick={() => setIsSettingsOpen(false)}
              aria-label="Close settings"
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X size={18} />
            </button>
            <h2 className="mb-6 text-xl font-semibold tracking-tight">Settings</h2>
            <div className="flex items-center gap-4 rounded-xl border border-border bg-secondary/40 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-brand to-brand-2 text-lg font-bold text-white">
                {(user.name || user.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="truncate font-medium">{user.name || 'User'}</div>
                <div className="truncate text-sm text-muted-foreground">{user.email}</div>
              </div>
            </div>
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="mt-6 w-full rounded-xl bg-brand py-2.5 font-medium text-brand-foreground transition-opacity hover:opacity-90"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
