export default function AgentsLoading() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-2 h-8 w-48 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-96 animate-pulse rounded-lg bg-muted" />
        </div>

        {/* Agents Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...new Array(6)].map((_, i) => (
            <div
              className="group relative overflow-hidden rounded-xl border bg-card p-6 transition-all"
              key={i}
            >
              {/* Agent Icon */}
              <div className="mb-4 flex items-center gap-4">
                <div className="h-12 w-12 animate-pulse rounded-full bg-gradient-to-br from-primary/20 to-primary/10" />
                <div className="flex-1">
                  <div className="mb-2 h-5 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                </div>
              </div>

              {/* Description */}
              <div className="mb-4 space-y-2">
                <div className="h-3 w-full animate-pulse rounded bg-muted" />
                <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
                <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
              </div>

              {/* Tags */}
              <div className="mb-4 flex gap-2">
                {[...new Array(3)].map((_, j) => (
                  <div
                    className="h-6 w-16 animate-pulse rounded-full bg-muted"
                    key={j}
                  />
                ))}
              </div>

              {/* Action Button */}
              <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
