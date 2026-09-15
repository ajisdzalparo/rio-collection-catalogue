export default function RootLoading() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-background"
      role="status"
      aria-label="Memuat..."
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
          RIO COLLECTION
        </span>
      </div>
    </div>
  );
}
