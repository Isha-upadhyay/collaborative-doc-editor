import Link from 'next/link'
import {
  ArrowRight,
  Cloud,
  CloudOff,
  GitBranch,
  Sparkles,
  ShieldCheck,
  Users,
  Zap,
  FileText,
} from 'lucide-react'
import { auth } from '@/lib/auth/config'
import { siteConfig } from '@/lib/site'
import { SiteFooter } from '@/components/layout/SiteFooter'

const features = [
  {
    icon: CloudOff,
    title: 'Local-first, offline-ready',
    body: 'Every keystroke lands in IndexedDB first. Open, edit and close documents with zero network requests blocking the UI — even on a plane.',
  },
  {
    icon: GitBranch,
    title: 'Deterministic merge',
    body: 'Concurrent offline edits reconcile through CRDTs with no data loss. Two people, two timelines, one consistent document.',
  },
  {
    icon: Users,
    title: 'Realtime presence',
    body: 'Live multiplayer cursors over an authenticated WebSocket relay. Viewers read; editors write — enforced at the protocol layer.',
  },
  {
    icon: GitBranch,
    title: 'Version time-travel',
    body: 'Snapshot any moment and restore it safely, without corrupting the shared state your collaborators are actively editing.',
  },
  {
    icon: ShieldCheck,
    title: 'Hardened by design',
    body: 'Per-request auth, payload caps against OOM, schema validation on every sync, and database-level row isolation.',
  },
  {
    icon: Sparkles,
    title: 'AI in the margin',
    body: 'Summarize, rewrite and extract action items with document-aware AI — streamed inline and applied with one click.',
  },
]

export default async function Home() {
  const session = await auth()
  const ctaHref = session ? '/documents' : '/sign-in'

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/60 glass">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
              <FileText className="h-4 w-4" />
            </span>
            {siteConfig.name}
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="#features"
              className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              Features
            </Link>
            <Link
              href={ctaHref}
              className="group inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-transform hover:scale-[1.03]"
            >
              {session ? 'Open workspace' : 'Sign in'}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden grain bg-aurora">
        <div className="pointer-events-none absolute inset-0 grid-lines" />
        <div className="relative mx-auto max-w-4xl px-6 pb-10 pt-24 text-center sm:pt-32">
          <div className="animate-rise mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
            </span>
            Offline-first · CRDT sync · Next.js 16
          </div>

          <h1 className="animate-rise text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
            Write together.
            <br />
            <span className="text-gradient">Even when you&rsquo;re offline.</span>
          </h1>

          <p className="animate-rise mx-auto mt-7 max-w-2xl text-pretty text-lg text-muted-foreground">
            {siteConfig.name} is a collaborative document editor with a local-first core —
            instant edits, deterministic conflict resolution, and granular version history that
            survives the worst network you can throw at it.
          </p>

          <div className="animate-rise mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={ctaHref}
              className="group inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 font-medium text-brand-foreground shadow-[0_10px_40px_-8px_hsl(var(--brand)/0.6)] transition-transform hover:scale-[1.03]"
            >
              Start writing — it&rsquo;s free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-7 py-3.5 font-medium transition-colors hover:bg-secondary"
            >
              See how it works
            </Link>
          </div>
        </div>

        {/* Editor preview mockup */}
        <div className="relative mx-auto max-w-5xl px-6 pb-24">
          <div className="animate-rise overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center gap-2 border-b border-border bg-secondary/50 px-4 py-3">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-400/80" />
                <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
              </div>
              <div className="mx-auto flex items-center gap-1.5 rounded-md bg-background/60 px-3 py-1 text-xs text-muted-foreground">
                <Cloud className="h-3.5 w-3.5 text-emerald-500" /> Synced · 3 collaborators
              </div>
            </div>
            <div className="grid gap-0 sm:grid-cols-[1fr_260px]">
              <div className="space-y-3 p-8 text-left">
                <div className="text-2xl font-semibold tracking-tight">Q3 Product Strategy</div>
                <div className="h-3 w-5/6 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted" />
                <div className="relative h-3 w-2/3 rounded bg-muted">
                  <span className="absolute -top-5 left-1/2 rounded bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-white shadow">
                    Maya
                  </span>
                </div>
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-4/5 rounded bg-muted" />
                <div className="mt-4 rounded-lg border border-brand/30 bg-accent/60 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-accent-foreground">
                    <Sparkles className="h-3.5 w-3.5" /> AI suggestion
                  </div>
                  <div className="mt-2 h-2.5 w-full rounded bg-brand/20" />
                  <div className="mt-1.5 h-2.5 w-3/4 rounded bg-brand/20" />
                </div>
              </div>
              <div className="border-t border-border bg-secondary/30 p-5 sm:border-l sm:border-t-0">
                <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <GitBranch className="h-3.5 w-3.5" /> Version history
                </div>
                <div className="space-y-3 border-l border-border pl-4">
                  {['v4 · just now', 'v3 · 2h ago', 'v2 · yesterday'].map((v, i) => (
                    <div key={v} className="relative">
                      <span
                        className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 ${i === 0 ? 'border-brand bg-background' : 'border-border bg-muted'}`}
                      />
                      <div className="text-xs font-medium">{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border bg-background py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center gap-1.5 text-sm font-medium text-brand">
              <Zap className="h-4 w-4" /> Engineered for the hard parts
            </div>
            <h2 className="mt-4 text-balance text-4xl font-semibold tracking-tight">
              A distributed system that feels like a notepad
            </h2>
            <p className="mt-4 text-pretty text-muted-foreground">
              The complexity lives in memory management, sync race conditions and merge
              algorithms — so your writing flow never has to.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-7 transition-all hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-colors group-hover:bg-brand group-hover:text-brand-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-background pb-24 pt-8">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-border bg-foreground px-6 py-16 text-center text-background grain">
          <div className="bg-aurora pointer-events-none absolute inset-0 opacity-40" />
          <h2 className="relative text-balance text-4xl font-semibold tracking-tight">
            Ready when your network isn&rsquo;t.
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-background/70">
            Spin up a document and start writing in seconds. Your work is saved locally the
            instant you type it.
          </p>
          <Link
            href={ctaHref}
            className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-background px-7 py-3.5 font-medium text-foreground transition-transform hover:scale-[1.03]"
          >
            {session ? 'Open your workspace' : 'Get started free'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
