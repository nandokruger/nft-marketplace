export function MobileNftDetailSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando detalhes do NFT..."
      className="w-full max-w-[390px] mx-auto min-h-screen flex flex-col font-mono text-foreground bg-ink pb-36 px-4 pt-3 gap-4"
    >
      {/* Top Header Floating Skeleton */}
      <div className="flex items-center justify-between w-full py-1" aria-hidden="true">
        <div className="w-10 h-10 rounded-full skeleton-shimmer" />
        <div className="w-10 h-10 rounded-full skeleton-shimmer" />
      </div>

      {/* Main Artwork Skeleton (aspect-square with rounded-[2rem]) */}
      <div className="w-full aspect-square rounded-[2rem] skeleton-shimmer" aria-hidden="true" />

      {/* Info Card Skeleton */}
      <div className="w-full rounded-[2rem] bg-surface-card p-5 flex flex-col gap-4 border border-border/40" aria-hidden="true">
        <div className="flex items-center justify-between gap-3">
          <div className="h-6 w-1/2 rounded skeleton-shimmer" />
          <div className="h-6 w-20 rounded-full skeleton-shimmer" />
        </div>
        <div className="h-12 w-full rounded skeleton-shimmer" />
        <div className="flex flex-col gap-2 pt-1">
          <div className="h-4 w-16 rounded skeleton-shimmer" />
          <div className="flex gap-2">
            <div className="h-6 w-14 rounded-full skeleton-shimmer" />
            <div className="h-6 w-14 rounded-full skeleton-shimmer" />
            <div className="h-6 w-14 rounded-full skeleton-shimmer" />
            <div className="h-6 w-16 rounded-full skeleton-shimmer" />
          </div>
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <div className="h-4 w-32 rounded skeleton-shimmer" />
          <div className="h-4 w-40 rounded skeleton-shimmer" />
          <div className="h-4 w-52 rounded skeleton-shimmer" />
        </div>
      </div>

      {/* Sticky Bottom Bar Skeleton */}
      <div className="fixed bottom-0 inset-x-0 z-40 max-w-[390px] mx-auto bg-surface-card border-t border-border/40 p-5 flex flex-col gap-3" aria-hidden="true">
        <div className="flex items-center justify-between">
          <div className="h-6 w-24 rounded skeleton-shimmer" />
          <div className="h-6 w-24 rounded skeleton-shimmer" />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-12 rounded-[24px] skeleton-shimmer" />
          <div className="w-12 h-12 rounded-full skeleton-shimmer" />
        </div>
      </div>

      <span className="sr-only">Carregando detalhes do NFT...</span>
    </div>
  );
}
