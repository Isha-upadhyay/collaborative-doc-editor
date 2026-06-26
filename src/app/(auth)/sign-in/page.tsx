import Link from 'next/link'
import { ArrowLeft, CloudOff, GitBranch, ShieldCheck, FileText } from 'lucide-react'
import { signIn } from '@/lib/auth/config'
import { siteConfig } from '@/lib/site'

const highlights = [
  { icon: CloudOff, text: 'Edit fully offline — your work is never blocked by the network.' },
  { icon: GitBranch, text: 'Deterministic CRDT merge with granular version history.' },
  { icon: ShieldCheck, text: 'Role-based access with database-level tenant isolation.' },
]

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  )
}

function GithubIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 1a11 11 0 0 0-3.48 21.44c.55.1.75-.24.75-.53v-1.86c-3.06.67-3.71-1.47-3.71-1.47-.5-1.28-1.23-1.62-1.23-1.62-1-.69.08-.67.08-.67 1.11.08 1.69 1.14 1.69 1.14.98 1.69 2.58 1.2 3.21.92.1-.71.39-1.2.7-1.47-2.44-.28-5.01-1.22-5.01-5.43 0-1.2.43-2.18 1.13-2.95-.11-.28-.49-1.4.11-2.92 0 0 .92-.3 3.02 1.13a10.4 10.4 0 0 1 5.5 0c2.1-1.43 3.02-1.13 3.02-1.13.6 1.52.22 2.64.11 2.92.7.77 1.13 1.75 1.13 2.95 0 4.22-2.58 5.15-5.03 5.42.4.34.75 1.01.75 2.04v3.03c0 .29.2.64.76.53A11 11 0 0 0 12 1Z" />
    </svg>
  )
}

export default function SignIn() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-foreground p-12 text-background grain lg:flex">
        <div className="bg-aurora pointer-events-none absolute inset-0 opacity-40" />
        <Link href="/" className="relative flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-background text-foreground">
            <FileText className="h-4 w-4" />
          </span>
          {siteConfig.name}
        </Link>

        <div className="relative max-w-md">
          <h2 className="text-balance text-4xl font-semibold leading-tight tracking-tight">
            Your documents, always within reach — online or off.
          </h2>
          <ul className="mt-8 space-y-4">
            {highlights.map((h) => (
              <li key={h.text} className="flex items-start gap-3 text-background/80">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background/10">
                  <h.icon className="h-4 w-4" />
                </span>
                <span className="text-sm leading-relaxed">{h.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-background/50">
          &copy; 2026 {siteConfig.name}
        </p>
      </div>

      {/* Auth panel */}
      <div className="relative flex items-center justify-center bg-background px-6 py-12">
        <Link
          href="/"
          className="absolute left-6 top-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="w-full max-w-sm">
          <div className="mb-8 text-center lg:text-left">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to open your collaborative workspace.
            </p>
          </div>

          <div className="space-y-3">
            <form
              action={async () => {
                'use server'
                await signIn('google', { redirectTo: '/documents' })
              }}
            >
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium transition-all hover:border-foreground/25 hover:bg-secondary"
              >
                <GoogleIcon />
                Continue with Google
              </button>
            </form>

            <form
              action={async () => {
                'use server'
                await signIn('github', { redirectTo: '/documents' })
              }}
            >
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-background transition-transform hover:scale-[1.01]"
              >
                <GithubIcon />
                Continue with GitHub
              </button>
            </form>
          </div>

          <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground">
            By continuing you agree to collaborate responsibly. No passwords stored — auth is
            handled by your provider.
          </p>
        </div>
      </div>
    </div>
  )
}
