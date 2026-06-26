import type { Metadata, Viewport } from 'next'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { siteConfig } from '@/lib/site'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} — Local-first collaborative editor`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.tagline,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.author.name }],
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.tagline,
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbfaf8' },
    { media: '(prefers-color-scheme: dark)', color: '#0d0d12' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
        <CommandPalette />
      </body>
    </html>
  )
}
