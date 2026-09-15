export default function CatalogueLoading() {
  return (
    <div
      className="mx-auto max-w-350 px-4 md:px-16 py-8 md:py-12 animate-pulse space-y-10"
      role="status"
      aria-label="Memuat konten..."
    >
      {/* Editorial Heading Shimmer */}
      <div className="space-y-3">
        <div className="h-3 w-20 bg-(--cat-surface-container-low)" />
        <div className="h-9 w-60 bg-(--cat-surface-container-low)" />
        <div className="h-4 w-80 max-w-full bg-(--cat-surface-container-low)" />
      </div>

      {/* Editorial Grid (4:5 Product Ratio) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 pt-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-4/5 w-full bg-(--cat-surface-container-low)" />
            <div className="space-y-2 pt-1">
              <div className="h-4 w-3/4 bg-(--cat-surface-container-low)" />
              <div className="h-3 w-1/3 bg-(--cat-surface-container-low)" />
              <div className="h-4 w-1/4 bg-(--cat-surface-container-low)" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
