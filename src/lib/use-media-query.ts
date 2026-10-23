import { useSyncExternalStore } from 'react';

/** Breakpoint `lg` do Tailwind: a partir daqui o layout é Desktop; abaixo, Mobile/Tablet. */
export const DESKTOP_QUERY = '(min-width: 1024px)';

/**
 * Assina uma media query via `matchMedia` (não lê `offsetWidth`/`getBoundingClientRect`,
 * portanto não força reflow). O snapshot inicial já é o valor real, evitando CLS por troca de layout.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}

export function useIsDesktop(): boolean {
  return useMediaQuery(DESKTOP_QUERY);
}
