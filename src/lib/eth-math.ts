/**
 * eth-math — aritmética decimal exata para valores em ETH.
 *
 * Regras (ver `.agents/rules/01-governance-and-constraints.md`):
 * - Valores em ETH trafegam SEMPRE como `string` decimal (ex.: "0.125") nos contratos.
 * - Todo cálculo usa `BigInt` escalado em 18 casas (Wei). Nunca `number`/`parseFloat`.
 * - Arredondamento acontece apenas onde explicitamente pedido (divisões, `toFixed`, `format`).
 */

export const ETH_DECIMALS = 18;
const SCALE = 10n ** BigInt(ETH_DECIMALS);

/** Valor ETH não-negativo, até 18 casas. Use em schemas zod de contratos (`z.string().regex(...)`). */
export const ETH_AMOUNT_PATTERN = /^\d+(?:\.\d{1,18})?$/;
/** Valor ETH com sinal opcional, até 18 casas. */
export const ETH_SIGNED_PATTERN = /^-?\d+(?:\.\d{1,18})?$/;

const PARSE_PATTERN = /^(-)?(\d+)(?:\.(\d{1,18}))?$/;

export type RoundingMode =
  /** Trunca em direção a zero. */
  | 'down'
  /** Afasta de zero. */
  | 'up'
  /** Em direção a -∞. */
  | 'floor'
  /** Em direção a +∞. */
  | 'ceil'
  /** Meio afasta de zero (arredondamento comercial). */
  | 'half-up'
  /** Meio para o par (banker's rounding). */
  | 'half-even';

export type EthInput = EthDecimal | string;

export class EthDecimalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EthDecimalError';
  }
}

/** Divide `num / den` aplicando o modo de arredondamento informado. */
export function divRound(num: bigint, den: bigint, mode: RoundingMode = 'half-up'): bigint {
  if (den === 0n) throw new EthDecimalError('Divisão por zero');
  let n = num;
  let d = den;
  if (d < 0n) {
    n = -n;
    d = -d;
  }
  const q = n / d; // trunca em direção a zero
  const r = n % d; // mesmo sinal de n
  if (r === 0n) return q;

  const sign = n < 0n ? -1n : 1n;
  const twiceRemainder = (r < 0n ? -r : r) * 2n;

  switch (mode) {
    case 'down':
      return q;
    case 'up':
      return q + sign;
    case 'floor':
      return sign < 0n ? q - 1n : q;
    case 'ceil':
      return sign > 0n ? q + 1n : q;
    case 'half-up':
      return twiceRemainder >= d ? q + sign : q;
    case 'half-even':
      if (twiceRemainder > d) return q + sign;
      if (twiceRemainder < d) return q;
      return q % 2n === 0n ? q : q + sign;
  }
}

/** Renderiza um inteiro escalado em `decimals` casas como string decimal com exatamente `decimals` casas. */
function renderScaled(scaled: bigint, decimals: number): { negative: boolean; int: string; frac: string } {
  const negative = scaled < 0n;
  const abs = negative ? -scaled : scaled;
  if (decimals === 0) return { negative, int: abs.toString(), frac: '' };
  const digits = abs.toString().padStart(decimals + 1, '0');
  return {
    negative,
    int: digits.slice(0, -decimals),
    frac: digits.slice(-decimals),
  };
}

function assertDecimals(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0 || value > ETH_DECIMALS) {
    throw new EthDecimalError(`${label} deve ser um inteiro entre 0 e ${ETH_DECIMALS}`);
  }
}

export interface EthFormatOptions {
  /** Máximo de casas decimais exibidas (padrão 4). */
  maxDecimals?: number;
  /** Mínimo de casas decimais exibidas (padrão 0). */
  minDecimals?: number;
  /** Modo de arredondamento (padrão `half-up`). */
  rounding?: RoundingMode;
  /** Locale para separadores (padrão `pt-BR`). */
  locale?: string;
  /** Acrescenta o sufixo " ETH" (padrão `false`). */
  withSymbol?: boolean;
}

/**
 * Decimal imutável com 18 casas de precisão, armazenado como Wei (`bigint`).
 *
 * @example
 * EthDecimal.from('0.1').add('0.2').toString(); // "0.3"
 * EthDecimal.sum(['1.5', '0.25']).percent('10').toString(); // "0.175"
 */
export class EthDecimal {
  static readonly ZERO = new EthDecimal(0n);

  /** Valor em Wei (10^-18 ETH). */
  readonly wei: bigint;

  private constructor(wei: bigint) {
    this.wei = wei;
  }

  // ---------------------------------------------------------------------------
  // Construção / parsing
  // ---------------------------------------------------------------------------

  /** Converte uma string decimal estrita (`"1"`, `"0.125"`, `"-2.5"`) ou outro `EthDecimal`. */
  static from(value: EthInput): EthDecimal {
    if (value instanceof EthDecimal) return value;
    if (typeof value !== 'string') {
      throw new EthDecimalError('EthDecimal aceita apenas string decimal ou EthDecimal (number é proibido)');
    }
    const match = PARSE_PATTERN.exec(value);
    if (!match) {
      throw new EthDecimalError(`Valor ETH inválido: "${value}" (esperado string decimal com até 18 casas)`);
    }
    const [, sign, intPart = '0', fracPart = ''] = match;
    const wei = BigInt(intPart) * SCALE + BigInt(fracPart.padEnd(ETH_DECIMALS, '0'));
    return new EthDecimal(sign && wei !== 0n ? -wei : wei);
  }

  /** Igual a `from`, mas retorna `null` em vez de lançar erro. */
  static safeFrom(value: unknown): EthDecimal | null {
    if (value instanceof EthDecimal) return value;
    if (typeof value !== 'string' || !PARSE_PATTERN.test(value)) return null;
    return EthDecimal.from(value);
  }

  static fromWei(wei: bigint): EthDecimal {
    return wei === 0n ? EthDecimal.ZERO : new EthDecimal(wei);
  }

  static isValid(value: unknown): value is string {
    return typeof value === 'string' && PARSE_PATTERN.test(value);
  }

  static sum(values: Iterable<EthInput>): EthDecimal {
    let total = 0n;
    for (const v of values) total += EthDecimal.from(v).wei;
    return EthDecimal.fromWei(total);
  }

  static compare(a: EthInput, b: EthInput): -1 | 0 | 1 {
    return EthDecimal.from(a).cmp(b);
  }

  static min(first: EthInput, ...rest: EthInput[]): EthDecimal {
    return rest.reduce<EthDecimal>((acc, v) => (acc.lte(v) ? acc : EthDecimal.from(v)), EthDecimal.from(first));
  }

  static max(first: EthInput, ...rest: EthInput[]): EthDecimal {
    return rest.reduce<EthDecimal>((acc, v) => (acc.gte(v) ? acc : EthDecimal.from(v)), EthDecimal.from(first));
  }

  // ---------------------------------------------------------------------------
  // Aritmética
  // ---------------------------------------------------------------------------

  add(other: EthInput): EthDecimal {
    return EthDecimal.fromWei(this.wei + EthDecimal.from(other).wei);
  }

  sub(other: EthInput): EthDecimal {
    return EthDecimal.fromWei(this.wei - EthDecimal.from(other).wei);
  }

  /** Multiplica por outro decimal (ex.: cotação, fator). */
  mul(other: EthInput, rounding: RoundingMode = 'half-up'): EthDecimal {
    return EthDecimal.fromWei(divRound(this.wei * EthDecimal.from(other).wei, SCALE, rounding));
  }

  /** Multiplica por uma quantidade inteira (ex.: nº de edições). */
  mulInt(quantity: bigint | number): EthDecimal {
    if (typeof quantity === 'number' && !Number.isSafeInteger(quantity)) {
      throw new EthDecimalError(`Quantidade deve ser inteira: ${quantity}`);
    }
    return EthDecimal.fromWei(this.wei * BigInt(quantity));
  }

  div(other: EthInput, rounding: RoundingMode = 'half-up'): EthDecimal {
    const divisor = EthDecimal.from(other).wei;
    if (divisor === 0n) throw new EthDecimalError('Divisão por zero');
    return EthDecimal.fromWei(divRound(this.wei * SCALE, divisor, rounding));
  }

  /** Retorna `pct`% deste valor (ex.: `percent('10')` → 10%). Uma única etapa de arredondamento. */
  percent(pct: EthInput, rounding: RoundingMode = 'half-up'): EthDecimal {
    return EthDecimal.fromWei(divRound(this.wei * EthDecimal.from(pct).wei, SCALE * 100n, rounding));
  }

  neg(): EthDecimal {
    return EthDecimal.fromWei(-this.wei);
  }

  abs(): EthDecimal {
    return this.wei < 0n ? this.neg() : this;
  }

  /** Arredonda para `decimals` casas, mantendo-se um `EthDecimal`. */
  round(decimals: number, rounding: RoundingMode = 'half-up'): EthDecimal {
    assertDecimals(decimals, 'decimals');
    const factor = 10n ** BigInt(ETH_DECIMALS - decimals);
    return EthDecimal.fromWei(divRound(this.wei, factor, rounding) * factor);
  }

  // ---------------------------------------------------------------------------
  // Comparação
  // ---------------------------------------------------------------------------

  cmp(other: EthInput): -1 | 0 | 1 {
    const o = EthDecimal.from(other).wei;
    return this.wei < o ? -1 : this.wei > o ? 1 : 0;
  }

  eq(other: EthInput): boolean {
    return this.cmp(other) === 0;
  }

  lt(other: EthInput): boolean {
    return this.cmp(other) < 0;
  }

  lte(other: EthInput): boolean {
    return this.cmp(other) <= 0;
  }

  gt(other: EthInput): boolean {
    return this.cmp(other) > 0;
  }

  gte(other: EthInput): boolean {
    return this.cmp(other) >= 0;
  }

  isZero(): boolean {
    return this.wei === 0n;
  }

  isNegative(): boolean {
    return this.wei < 0n;
  }

  isPositive(): boolean {
    return this.wei > 0n;
  }

  // ---------------------------------------------------------------------------
  // Serialização / exibição
  // ---------------------------------------------------------------------------

  /** String decimal canônica (sem zeros à direita). Formato usado nos contratos. */
  toString(): string {
    const { negative, int, frac } = renderScaled(this.wei, ETH_DECIMALS);
    const trimmed = frac.replace(/0+$/, '');
    return `${negative ? '-' : ''}${int}${trimmed ? `.${trimmed}` : ''}`;
  }

  /** Serializa como string em `JSON.stringify` — contratos nunca recebem `number`. */
  toJSON(): string {
    return this.toString();
  }

  /** String com exatamente `decimals` casas (sem separador de milhar). */
  toFixed(decimals: number, rounding: RoundingMode = 'half-up'): string {
    assertDecimals(decimals, 'decimals');
    const scaled = divRound(this.wei, 10n ** BigInt(ETH_DECIMALS - decimals), rounding);
    const { negative, int, frac } = renderScaled(scaled, decimals);
    return `${negative ? '-' : ''}${int}${decimals > 0 ? `.${frac}` : ''}`;
  }

  /** Formatação para UI com separadores do locale. Única camada onde há arredondamento de exibição. */
  format(options: EthFormatOptions = {}): string {
    const { maxDecimals = 4, minDecimals = 0, rounding = 'half-up', locale = 'pt-BR', withSymbol = false } = options;
    assertDecimals(maxDecimals, 'maxDecimals');
    assertDecimals(minDecimals, 'minDecimals');
    if (minDecimals > maxDecimals) throw new EthDecimalError('minDecimals não pode exceder maxDecimals');

    const scaled = divRound(this.wei, 10n ** BigInt(ETH_DECIMALS - maxDecimals), rounding);
    const { negative, int, frac } = renderScaled(scaled, maxDecimals);

    let visibleFrac = frac;
    while (visibleFrac.length > minDecimals && visibleFrac.endsWith('0')) {
      visibleFrac = visibleFrac.slice(0, -1);
    }

    const intFormatted = new Intl.NumberFormat(locale, { useGrouping: true }).format(BigInt(int));
    const decimalSeparator = getDecimalSeparator(locale);
    const body = `${intFormatted}${visibleFrac ? `${decimalSeparator}${visibleFrac}` : ''}`;
    return `${negative ? '-' : ''}${body}${withSymbol ? ' ETH' : ''}`;
  }

  /** Impede coerção implícita para `number` (`+eth`, `eth * 2`, `Number(eth)`). */
  [Symbol.toPrimitive](hint: string): string {
    if (hint === 'number') {
      throw new EthDecimalError('Coerção de EthDecimal para number é proibida; use os métodos aritméticos');
    }
    return this.toString();
  }
}

const decimalSeparatorCache = new Map<string, string>();

function getDecimalSeparator(locale: string): string {
  const cached = decimalSeparatorCache.get(locale);
  if (cached) return cached;
  // Usado apenas para descobrir o símbolo do locale — não participa de cálculo monetário.
  const separator =
    new Intl.NumberFormat(locale).formatToParts(1.5).find((part) => part.type === 'decimal')?.value ?? '.';
  decimalSeparatorCache.set(locale, separator);
  return separator;
}

/** Atalho funcional: `eth('0.1').add('0.2')`. */
export const eth = (value: EthInput): EthDecimal => EthDecimal.from(value);
