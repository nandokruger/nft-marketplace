import { cn } from '@/lib/utils';

export function NftCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'w-full max-w-[268px] rounded-[8px] border border-border bg-surface-card p-3 flex flex-col gap-3 overflow-hidden shadow-sm',
        className
      )}
      style={{ minHeight: '430px' }}
      aria-hidden="true"
    >
      {/* 300px image */}
      <div className="w-full h-[260px] sm:h-[300px] rounded-[6px] skeleton-shimmer" />

      {/* Info rows */}
      <div className="flex flex-col gap-2 pt-1">
        <div className="h-4 w-3/4 rounded skeleton-shimmer" />
        <div className="h-3 w-1/2 rounded skeleton-shimmer" />
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-3">
        <div className="flex flex-col gap-1">
          <div className="h-3 w-10 rounded skeleton-shimmer" />
          <div className="h-4 w-16 rounded skeleton-shimmer" />
        </div>
        <div className="h-8 w-20 rounded-[5px] skeleton-shimmer" />
      </div>
    </div>
  );
}

export function NftGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 justify-items-center"
      aria-label="Carregando catálogo de NFTs..."
      role="status"
    >
      {Array.from({ length: count }).map((_, i) => (
        <NftCardSkeleton key={i} />
      ))}
      <span className="sr-only">Carregando catálogo de NFTs...</span>
    </div>
  );
}
