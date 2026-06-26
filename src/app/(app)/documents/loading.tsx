import { Skeleton } from "@/components/ui/skeleton"

/**
 * Instant route-level fallback shown by Next.js while the Documents server
 * component fetches data. Mirrors the real page layout so the transition
 * doesn't shift content once data arrives.
 */
export default function DocumentsLoading() {
  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-y-auto">
      <div className="max-w-6xl w-full mx-auto px-4 pt-16 pb-8 sm:px-8 md:p-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <Skeleton className="h-8 w-44 mb-3 rounded-lg" />
            <Skeleton className="h-4 w-72 rounded-md" />
          </div>
        </header>

        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-10 w-full max-w-md rounded-lg" />
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col p-5 bg-card border border-border rounded-xl"
            >
              <Skeleton className="h-10 w-10 rounded-lg mb-4" />
              <Skeleton className="h-4 w-3/4 rounded-md mb-2" />
              <div className="flex items-center justify-between mt-auto pt-4">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
