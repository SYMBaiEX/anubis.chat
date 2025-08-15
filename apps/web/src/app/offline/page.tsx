'use client';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted to-accent/20">
      <div className="mx-4 w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card/80 p-8 shadow-2xl backdrop-blur-lg">
          <div className="text-center">
            {/* Offline Icon */}
            <div className="relative mx-auto mb-6 h-24 w-24">
              <svg
                className="h-full w-full text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a4.977 4.977 0 011.414 2.83m-1.414-2.83L3 3m8.364 8.364L3 3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
              <div className="-bottom-2 -right-2 absolute flex h-8 w-8 items-center justify-center rounded-full bg-red-500">
                <svg
                  className="h-5 w-5 text-primary-foreground"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    clipRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    fillRule="evenodd"
                  />
                </svg>
              </div>
            </div>

            <h1 className="mb-3 font-bold text-3xl text-foreground">
              You're Offline
            </h1>

            <p className="mb-8 text-muted-foreground">
              It looks like you've lost your internet connection. Please check
              your connection and try again.
            </p>

            <div className="space-y-4">
              <button
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors duration-200 hover:bg-primary/90"
                onClick={() => window.location.reload()}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
                Try Again
              </button>

              <button
                className="w-full rounded-lg border border-border bg-muted px-6 py-3 font-medium text-foreground transition-colors duration-200 hover:bg-muted/80"
                onClick={() => window.history.back()}
              >
                Go Back
              </button>
            </div>

            <div className="mt-8 border-border border-t pt-8">
              <h2 className="mb-3 font-semibold text-foreground text-lg">
                What you can do offline:
              </h2>
              <ul className="space-y-2 text-left text-muted-foreground">
                <li className="flex items-start gap-2">
                  <svg
                    className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      clipRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      fillRule="evenodd"
                    />
                  </svg>
                  <span>View cached pages and content</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg
                    className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      clipRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      fillRule="evenodd"
                    />
                  </svg>
                  <span>Read previously loaded messages</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg
                    className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      clipRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      fillRule="evenodd"
                    />
                  </svg>
                  <span>Draft messages (will sync when online)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-sm">
            Your messages will be synced automatically when you're back online.
          </p>
        </div>
      </div>
    </div>
  );
}
