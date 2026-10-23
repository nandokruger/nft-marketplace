import { cn } from '@/lib/utils';
import {
  DESKTOP_CARD_TEXT_HEIGHT,
  DESKTOP_GRID_CLASS,
  MOBILE_CARD_TEXT_HEIGHT,
  MOBILE_GRID_CLASS
} from '@/components/catalog/catalog-layout';

function DesktopCardSkeleton() {
  return (
    <div
      className="flex w-[258px] flex-col gap-3 rounded-[8px] bg-surface-card p-2 pb-4"
      aria-hidden="true"
    >
      <div className="mx-auto h-[242px] w-[242px] rounded-[15px] skeleton-shimmer" />
      <div className={cn('flex flex-col gap-1 px-1', DESKTOP_CARD_TEXT_HEIGHT)}>
        <div className="h-6 w-3/4 rounded skeleton-shimmer" />
        <div className="h-7 w-1/3 rounded skeleton-shimmer" />
        <div className="h-4 w-1/2 rounded skeleton-shimmer" />
      </div>
    </div>
  );
}

function MobileCardSkeleton() {
  return (
    <div className="flex flex-col gap-2.5" aria-hidden="true">
      <div className="rounded-[15px] bg-surface-card p-1.5">
        <div className="aspect-square w-full rounded-[12px] skeleton-shimmer" />
      </div>
      <div className={cn('flex flex-col gap-0.5 px-1', MOBILE_CARD_TEXT_HEIGHT)}>
        <div className="h-5 w-3/4 rounded skeleton-shimmer" />
        <div className="h-6 w-1/2 rounded skeleton-shimmer" />
      </div>
    </div>
  );
}

interface CatalogGridSkeletonProps {
  variant: 'desktop' | 'mobile';
  count?: number;
}

export function CatalogGridSkeleton({ variant, count = 9 }: CatalogGridSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Carregando catálogo de NFTs..."
      className={variant === 'desktop' ? DESKTOP_GRID_CLASS : MOBILE_GRID_CLASS}
    >
      {Array.from({ length: count }).map((_, index) =>
        variant === 'desktop' ? (
          <DesktopCardSkeleton key={index} />
        ) : (
          <MobileCardSkeleton key={index} />
        )
      )}
      <span className="sr-only">Carregando catálogo de NFTs...</span>
    </div>
  );
}
