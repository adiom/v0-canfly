export default function Loading() {
  return (
    <main className="min-h-screen bg-cf-bg text-cf-text-1">
      <header className="sticky top-0 z-[60] border-b border-cf-text-1/10 bg-cf-bg/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl h-14 items-center justify-between px-4 md:px-8">
          <div className="animate-pulse flex h-9 w-16 bg-cf-accent/40" />
          <div className="hidden lg:flex items-center gap-2">
            {[80, 64, 96, 72, 80].map((w, i) => (
              <div key={i} className={`animate-pulse h-4 bg-cf-text-1/10 rounded`} style={{ width: w }} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="animate-pulse h-9 w-9 bg-cf-text-1/10 rounded" />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 md:px-8 py-12 space-y-8">
        <div className="space-y-3">
          <div className="animate-pulse h-3 w-32 bg-cf-accent/20 rounded" />
          <div className="animate-pulse h-10 w-3/4 bg-cf-text-1/10 rounded" />
          <div className="animate-pulse h-10 w-1/2 bg-cf-text-1/10 rounded" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-cf-text-1/10 bg-cf-bg-2 p-6 space-y-3">
              <div className="animate-pulse h-40 bg-cf-text-1/10 rounded" />
              <div className="animate-pulse h-4 w-2/3 bg-cf-text-1/10 rounded" />
              <div className="animate-pulse h-3 w-full bg-cf-text-1/8 rounded" />
              <div className="animate-pulse h-3 w-4/5 bg-cf-text-1/8 rounded" />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
