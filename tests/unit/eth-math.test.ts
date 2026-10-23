import { describe, expect, it } from 'vitest';
import { EthDecimal, EthDecimalError, divRound, eth, ETH_AMOUNT_PATTERN } from '@/lib/eth-math';

describe('EthDecimal — parsing', () => {
  it('aceita strings decimais estritas', () => {
    expect(eth('0').toString()).toBe('0');
    expect(eth('1').toString()).toBe('1');
    expect(eth('0.125').toString()).toBe('0.125');
    expect(eth('-2.50').toString()).toBe('-2.5');
    expect(eth('0.000000000000000001').wei).toBe(1n);
  });

  it('normaliza "-0" para zero', () => {
    expect(eth('-0').toString()).toBe('0');
    expect(eth('-0').isNegative()).toBe(false);
  });

  it.each(['', ' 1', '1 ', '.5', '1.', '1e18', '0x10', '1,5', 'abc', '1.0000000000000000001', '+1', 'NaN'])(
    'rejeita entrada inválida %j',
    (input) => {
      expect(() => eth(input)).toThrow(EthDecimalError);
      expect(EthDecimal.safeFrom(input)).toBeNull();
      expect(EthDecimal.isValid(input)).toBe(false);
    },
  );

  it('rejeita number em runtime', () => {
    // Simula um contrato quebrado vindo de JSON não validado.
    const untrusted: unknown = 0.1;
    expect(() => EthDecimal.from(untrusted as string)).toThrow(EthDecimalError);
    expect(EthDecimal.safeFrom(untrusted)).toBeNull();
  });

  it('ETH_AMOUNT_PATTERN não aceita negativos', () => {
    expect(ETH_AMOUNT_PATTERN.test('1.5')).toBe(true);
    expect(ETH_AMOUNT_PATTERN.test('-1.5')).toBe(false);
  });
});

describe('EthDecimal — aritmética exata', () => {
  it('0.1 + 0.2 === 0.3 (sem erro de ponto flutuante)', () => {
    expect(eth('0.1').add('0.2').toString()).toBe('0.3');
    expect(eth('0.1').add('0.2').eq('0.3')).toBe(true);
  });

  it('soma valores grandes sem perda de precisão', () => {
    const big = eth('123456789012345678.123456789012345678');
    expect(big.add('0.000000000000000001').toString()).toBe('123456789012345678.123456789012345679');
  });

  it('subtrai e produz negativos', () => {
    expect(eth('1').sub('1.5').toString()).toBe('-0.5');
  });

  it('sum agrega iteráveis', () => {
    expect(EthDecimal.sum(['0.1', '0.2', '0.3', eth('0.4')]).toString()).toBe('1');
    expect(EthDecimal.sum([]).toString()).toBe('0');
  });

  it('mulInt multiplica por quantidade inteira', () => {
    expect(eth('0.333').mulInt(3).toString()).toBe('0.999');
    expect(eth('0.1').mulInt(3n).toString()).toBe('0.3');
    expect(() => eth('1').mulInt(1.5)).toThrow(EthDecimalError);
  });

  it('mul multiplica por fator decimal (cotação)', () => {
    expect(eth('1.5').mul('3200.25').toString()).toBe('4800.375');
  });

  it('div com arredondamento em 18 casas', () => {
    expect(eth('1').div('3').toString()).toBe('0.333333333333333333');
    expect(eth('2').div('3').toString()).toBe('0.666666666666666667');
    expect(eth('2').div('3', 'down').toString()).toBe('0.666666666666666666');
    expect(() => eth('1').div('0')).toThrow(EthDecimalError);
  });

  it('percent aplica cupom em etapa única', () => {
    expect(eth('1.75').percent('10').toString()).toBe('0.175');
    expect(eth('1.75').sub(eth('1.75').percent('12.5')).toString()).toBe('1.53125');
  });

  it('é imutável', () => {
    const a = eth('1');
    a.add('1');
    expect(a.toString()).toBe('1');
  });
});

describe('EthDecimal — comparação', () => {
  it('compara corretamente', () => {
    expect(eth('1').gt('0.999999999999999999')).toBe(true);
    expect(eth('1').lte('1.0')).toBe(true);
    expect(EthDecimal.compare('2', '10')).toBe(-1);
    expect(EthDecimal.min('3', '1.5', '2').toString()).toBe('1.5');
    expect(EthDecimal.max('3', '1.5', '20').toString()).toBe('20');
  });
});

describe('divRound — modos de arredondamento', () => {
  const cases: Array<[bigint, bigint, Record<string, bigint>]> = [
    [5n, 2n, { down: 2n, up: 3n, floor: 2n, ceil: 3n, 'half-up': 3n, 'half-even': 2n }],
    [-5n, 2n, { down: -2n, up: -3n, floor: -3n, ceil: -2n, 'half-up': -3n, 'half-even': -2n }],
    [7n, 2n, { 'half-even': 4n }],
    [7n, 3n, { down: 2n, up: 3n, 'half-up': 2n }],
    [5n, -2n, { down: -2n, floor: -3n }],
  ];

  it.each(cases)('%s / %s', (num, den, expected) => {
    for (const [mode, value] of Object.entries(expected)) {
      expect(divRound(num, den, mode as Parameters<typeof divRound>[2])).toBe(value);
    }
  });
});

describe('EthDecimal — serialização e exibição', () => {
  it('toFixed arredonda e preenche casas', () => {
    expect(eth('1.23456').toFixed(4)).toBe('1.2346');
    expect(eth('1.23455').toFixed(4, 'half-even')).toBe('1.2346');
    expect(eth('1.23445').toFixed(4, 'half-even')).toBe('1.2344');
    expect(eth('1').toFixed(2)).toBe('1.00');
    expect(eth('-0.001').toFixed(2)).toBe('0.00');
    expect(eth('9.999').toFixed(0)).toBe('10');
  });

  it('round mantém EthDecimal', () => {
    expect(eth('1.23456').round(2).toString()).toBe('1.23');
  });

  it('format usa separadores do locale e remove zeros', () => {
    expect(eth('1234567.5').format()).toBe('1.234.567,5');
    expect(eth('1234567.5').format({ locale: 'en-US' })).toBe('1,234,567.5');
    expect(eth('0.123456').format({ withSymbol: true })).toBe('0,1235 ETH');
    expect(eth('2').format({ minDecimals: 2 })).toBe('2,00');
    expect(eth('-1.5').format()).toBe('-1,5');
  });

  it('JSON.stringify serializa como string', () => {
    expect(JSON.stringify({ price: eth('0.5') })).toBe('{"price":"0.5"}');
  });

  it('bloqueia coerção implícita para number', () => {
    const value = eth('1');
    expect(() => +(value as unknown as number)).toThrow(EthDecimalError);
    expect(`${value}`).toBe('1');
  });
});
