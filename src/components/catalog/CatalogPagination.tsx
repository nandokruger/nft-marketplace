interface CatalogPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function CatalogPagination({
  currentPage,
  totalPages,
  onPageChange
}: CatalogPaginationProps) {
  if (totalPages <= 1) return null;

  // Window of at most 5 page numbers around currentPage
  const maxButtons = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let endPage = startPage + maxButtons - 1;
  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  const pages: number[] = [];
  for (let p = startPage; p <= endPage; p++) {
    pages.push(p);
  }

  return (
    <nav
      aria-label="Paginação do catálogo"
      className="flex items-center justify-center lg:justify-end gap-2 pt-6 w-full"
    >
      {currentPage > 1 && (
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          className="min-h-[44px] min-w-[44px] lg:h-9 lg:w-9 rounded-[4px] border border-border bg-surface-card text-foreground flex items-center justify-center hover:border-primary/50 transition-colors cursor-pointer text-base font-bold"
          aria-label="Página anterior"
        >
          ‹
        </button>
      )}

      {pages.map((pageNum) => {
        const isActive = currentPage === pageNum;
        return (
          <button
            key={pageNum}
            type="button"
            onClick={() => onPageChange(pageNum)}
            aria-current={isActive ? 'page' : undefined}
            className={`min-h-[44px] min-w-[44px] lg:h-9 lg:w-9 rounded-[4px] font-bold text-base flex items-center justify-center transition-colors cursor-pointer ${isActive
              ? 'bg-primary text-ink'
              : 'border border-border bg-surface-card text-foreground hover:border-primary/50'
              }`}
          >
            {pageNum}
          </button>
        );
      })}

      {currentPage < totalPages && (
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          className="min-h-[44px] min-w-[44px] lg:h-9 lg:w-9 rounded-[4px] border border-border bg-surface-card text-foreground flex items-center justify-center hover:border-primary transition-colors cursor-pointer text-base font-bold"
          aria-label="Próxima página"
        >
          ›
        </button>
      )}
    </nav>
  );
}
