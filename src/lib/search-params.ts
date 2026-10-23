/**
 * Serialização de search params como query string "plana" (`?category=music&page=2`),
 * em vez do JSON padrão do TanStack Router (`?page=2&minPrice="0.5"`). Todos os valores
 * chegam como string e cada rota os valida/coage com zod em `validateSearch`.
 * Valores monetários (ETH) permanecem strings decimais intactas.
 */
export function parseSearch(searchStr: string): Record<string, string> {
  const params = new URLSearchParams(searchStr.startsWith('?') ? searchStr.slice(1) : searchStr);
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

export function stringifySearch(search: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, typeof value === 'string' ? value : String(value));
  }
  const str = params.toString();
  return str ? `?${str}` : '';
}
