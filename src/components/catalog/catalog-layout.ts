/**
 * Classes de layout compartilhadas entre a grelha real e o skeleton: as duas usam exatamente
 * as mesmas colunas/gaps para garantir CLS = 0 na troca skeleton → conteúdo.
 */
export const DESKTOP_GRID_CLASS =
  'grid grid-cols-3 gap-x-6 gap-y-6 justify-items-center';

export const MOBILE_GRID_CLASS =
  'grid grid-cols-2 items-start gap-x-4 gap-y-6 [&>*:nth-child(even)]:mt-8';

/** Altura fixa do bloco de texto do card desktop (nome 24 + preço 28 + disponibilidade 16 + gaps 8). */
export const DESKTOP_CARD_TEXT_HEIGHT = 'h-[76px]';
/** Altura mínima da linha de texto do card mobile (nome 20 + preço 24 + gap 2). */
export const MOBILE_CARD_TEXT_HEIGHT = 'min-h-[46px]';
