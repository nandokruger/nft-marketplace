export function MobileCartSkeleton() {
  return (
    <div
      className="w-full min-w-[390px] max-w-[1024px] mx-auto min-h-screen flex flex-col font-mono text-foreground bg-ink relative pb-6"
      data-testid="mobile-cart-skeleton"
    >
      {/* Top Header Skeleton */}
      <div className="sticky top-0 z-30 w-full px-4 sm:px-6 md:px-8 py-3.5 flex items-center justify-between bg-ink/95 backdrop-blur-md border-b border-primary/20">
        <div className="w-10 h-10 rounded-full skeleton-shimmer shrink-0" />
        <div className="h-6 w-36 sm:w-44 rounded skeleton-shimmer" />
        <div className="w-10 h-10 opacity-0 shrink-0" />
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start w-full px-4 sm:px-6 md:px-8 pt-3 flex-1 pb-[380px] md:pb-6">
        {/* Cart Items List Skeletons */}
        <div className="w-full md:flex-1 flex flex-col gap-3.5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-[#1C1714] border border-[#2D241E] rounded-2xl p-2.5 sm:p-3.5 flex items-center justify-between gap-2.5 sm:gap-4 shadow-md"
            >
              {/* Thumbnail skeleton */}
              <div className="w-[72px] h-[72px] sm:w-[80px] sm:h-[80px] rounded-xl skeleton-shimmer shrink-0" />

              {/* Info skeleton */}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 h-[72px] sm:h-[80px]">
                <div className="h-3.5 w-3/4 rounded skeleton-shimmer" />
                <div className="h-3 w-1/2 rounded skeleton-shimmer mt-1" />
                <div className="h-3.5 w-20 rounded skeleton-shimmer mt-2" />
              </div>

              {/* Stepper skeleton */}
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 self-center">
                <div className="w-[26px] h-[26px] sm:w-[28px] sm:h-[28px] rounded-full skeleton-shimmer" />
                <div className="w-3.5 sm:w-5 h-3.5 rounded skeleton-shimmer" />
                <div className="w-[26px] h-[26px] sm:w-[28px] sm:h-[28px] rounded-full skeleton-shimmer" />
                <div className="w-[26px] h-[26px] sm:w-[28px] sm:h-[28px] rounded-full skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Summary Card Skeleton */}
        <div className="w-full fixed bottom-0 inset-x-0 z-20 max-w-[1024px] mx-auto md:static md:sticky md:top-20 md:bottom-auto md:z-auto md:w-[340px] lg:w-[380px] shrink-0 rounded-t-[2.5rem] md:rounded-2xl bg-[#181310] border-t md:border border-[#3F2319]/40 p-5 sm:p-6 pt-6 sm:pt-7 md:p-6 flex flex-col gap-4 sm:gap-5 shadow-[0_-12px_32px_rgba(0,0,0,0.85)] md:shadow-2xl">
          {/* Coupon Pill Skeleton */}
          <div className="h-11 w-full rounded-full skeleton-shimmer" />

          {/* Breakdown rows skeleton */}
          <div className="flex flex-col gap-3 pt-1">
            <div className="flex justify-between items-center">
              <div className="h-3.5 w-16 rounded skeleton-shimmer" />
              <div className="h-3.5 w-20 rounded skeleton-shimmer" />
            </div>
            <div className="flex justify-between items-center">
              <div className="h-3.5 w-36 rounded skeleton-shimmer" />
              <div className="h-3.5 w-16 rounded skeleton-shimmer" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <div className="h-3.5 w-20 rounded skeleton-shimmer" />
                <div className="h-3.5 w-16 rounded skeleton-shimmer" />
              </div>
              <div className="h-2.5 w-20 rounded skeleton-shimmer self-end" />
            </div>
            <div className="flex justify-between items-baseline pt-2">
              <div className="h-5 w-14 rounded skeleton-shimmer" />
              <div className="h-6 w-24 rounded skeleton-shimmer" />
            </div>
          </div>

          {/* Primary CTA Skeleton */}
          <div className="w-full h-[52px] rounded-full skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}
