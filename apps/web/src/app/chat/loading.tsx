export default function ChatLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 animate-pulse rounded-full bg-primary/20" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <h2 className="animate-pulse font-semibold text-foreground text-lg">
            Loading Chat...
          </h2>
          <div className="flex gap-1">
            <div className="h-2 w-2 animate-bounce rounded-full bg-primary delay-0" />
            <div className="h-2 w-2 animate-bounce rounded-full bg-primary delay-150" />
            <div className="h-2 w-2 animate-bounce rounded-full bg-primary delay-300" />
          </div>
        </div>
      </div>
    </div>
  );
}
