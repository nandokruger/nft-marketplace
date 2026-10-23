export function MobileCheckoutSkeleton() {
  return (
    <div
      className="w-full min-w-[390px] max-w-[1024px] mx-auto min-h-screen flex flex-col font-mono text-foreground bg-ink relative pb-8"
      data-testid="mobile-checkout-skeleton"
    >
      {/* Top Header Skeleton */}
      <div className="sticky top-0 z-30 w-full px-4 sm:px-6 md:px-8 py-3.5 flex items-center justify-between bg-ink/95 backdrop-blur-md border-b border-white/5">
        <div className="w-10 h-10 rounded-full skeleton-shimmer shrink-0" />
        <div className="h-6 w-48 sm:w-56 rounded skeleton-shimmer" />
        <div className="w-10 h-10 opacity-0 shrink-0" />
      </div>

      <div className="px-4 sm:px-6 md:px-8 pt-4 flex flex-col gap-6 flex-1 w-full">
        {/* Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start w-full">
          {/* Section 1: Carteira conectada skeleton */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-36 rounded skeleton-shimmer" />
              <div className="h-3.5 w-24 rounded skeleton-shimmer" />
            </div>

            <div className="flex flex-col gap-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-[#1C1714] border border-[#2D241E] rounded-2xl p-4 flex items-start justify-between gap-3 shadow-md"
                >
                  <div className="w-4 h-4 rounded-full skeleton-shimmer shrink-0 mt-0.5" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="h-4 w-24 rounded skeleton-shimmer" />
                    <div className="h-3 w-32 rounded skeleton-shimmer" />
                    <div className="h-3 w-28 rounded skeleton-shimmer" />
                  </div>
                  <div className="w-6 h-6 rounded-full skeleton-shimmer shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Carteira e rede skeleton */}
          <div className="flex flex-col gap-3">
            <div className="h-4 w-32 rounded skeleton-shimmer" />

            <div className="flex flex-col gap-2.5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-[#1C1714] border border-[#2D241E] rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full skeleton-shimmer shrink-0" />
                    <div className="h-4 w-28 rounded skeleton-shimmer" />
                  </div>
                  <div className="w-4 h-4 rounded-full skeleton-shimmer shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Action Area Skeleton */}
        <div className="mt-auto pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
          <div className="flex items-baseline gap-3 self-end sm:self-auto">
            <div className="h-5 w-16 rounded skeleton-shimmer" />
            <div className="h-6 w-24 rounded skeleton-shimmer" />
          </div>

          <div className="w-full sm:w-auto sm:min-w-[280px] h-[52px] rounded-full skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}
