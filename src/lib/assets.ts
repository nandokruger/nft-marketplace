/**
 * Resolve caminhos de assets locais garantindo compatibilidade com
 * qualquer `base` configurado no Vite (raiz `/` ou subpastas como `/nft-marketplace/`).
 */
export function resolveAssetUrl(url: string | undefined | null): string {
  if (!url) return '';
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }
  const base = import.meta.env.BASE_URL || '/';
  if (base !== '/' && url.startsWith(base)) {
    return url;
  }
  const cleanPath = url.startsWith('/') ? url.slice(1) : url;
  return `${base}${cleanPath}`;
}
