import { cn } from '@/lib/utils';

export function BannerSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'w-full max-w-[1200px] h-[250px] rounded-[8px] border border-border bg-surface-card p-6 sm:p-8 flex items-center justify-between overflow-hidden shadow-sm',
        className
      )}
      aria-hidden="true"
    >
      <div className="flex flex-col gap-4 max-w-md w-full">
        <div className="h-4 w-24 rounded skeleton-shimmer" />
        <div className="h-8 w-3/4 rounded skeleton-shimmer" />
        <div className="h-4 w-full rounded skeleton-shimmer" />
        <div className="h-10 w-32 rounded-[6px] skeleton-shimmer mt-2" />
      </div>
      <div className="hidden md:block w-[250px] h-[200px] rounded-[15px] skeleton-shimmer" />
    </div>
  );
}
