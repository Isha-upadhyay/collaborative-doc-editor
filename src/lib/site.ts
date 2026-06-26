/**
 * Single source of truth for product + author identity.
 *
 * SUBMISSION REQUIREMENT: your name, GitHub and LinkedIn must appear in the footer.
 * Edit the defaults below (or set the matching NEXT_PUBLIC_* env vars) before deploying.
 */
export const siteConfig = {
  name: 'Collaborativa',
  tagline: 'Local-first collaborative documents with deterministic offline sync.',
  author: {
    name: process.env.NEXT_PUBLIC_AUTHOR_NAME || 'Isha Upadhyay',
    github: process.env.NEXT_PUBLIC_AUTHOR_GITHUB || 'https://github.com/Isha-upadhyay',
    linkedin: process.env.NEXT_PUBLIC_AUTHOR_LINKEDIN || 'https://www.linkedin.com/in/isha-upadhyay-b974a528b',
  },
} as const

export type SiteConfig = typeof siteConfig
