import { Skeleton } from "@/components/ui/skeleton"

/**
 * Instant route-level fallback shown while the editor page authorizes access
 * and loads the document on the server. Mirrors the EditorShell chrome so the
 * jump to the real editor feels seamless.
 */
export default function DocumentEditorLoading() {
  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-background">
      {/* Top bar */}
      <header className="z-20 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-background/70 pl-14 pr-3 backdrop-blur md:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Skeleton className="h-6 w-56 rounded-md" />
          <Skeleton className="hidden h-6 w-20 rounded-md sm:block" />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        <div className="flex-1 overflow-hidden px-4 py-8 sm:px-8 sm:py-12">
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            <Skeleton className="h-10 w-2/3 rounded-lg" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-11/12 rounded-md" />
            <Skeleton className="h-4 w-4/5 rounded-md" />
            <Skeleton className="mt-4 h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-3/4 rounded-md" />
            <Skeleton className="mt-6 h-48 w-full rounded-xl" />
          </div>
        </div>

        {/* Desktop side panel */}
        <aside className="hidden w-[360px] shrink-0 flex-col gap-4 border-l border-border bg-secondary/30 p-4 lg:flex">
          <Skeleton className="h-7 w-32 rounded-md" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="mt-auto h-7 w-36 rounded-md" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </aside>
      </div>
    </div>
  )
}
