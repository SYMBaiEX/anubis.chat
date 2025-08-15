export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
          <div className="h-10 w-32 animate-pulse rounded-lg bg-muted" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div className="rounded-lg border bg-card p-6" key={i}>
              <div className="flex items-center justify-between space-x-4">
                <div className="space-y-2">
                  <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                  <div className="h-8 w-32 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Skeleton */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Chart Skeleton */}
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-4 h-6 w-32 animate-pulse rounded bg-muted" />
            <div className="h-64 animate-pulse rounded bg-muted" />
          </div>

          {/* List Skeleton */}
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-4 h-6 w-32 animate-pulse rounded bg-muted" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div className="flex items-center gap-3" key={i}>
                  <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
