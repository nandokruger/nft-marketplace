import { EthDecimal, eth } from './eth-math';

/**
 * O componente Slider (Radix) opera com inteiros. A posição do slider é um **índice**
 * (1 passo = 0.01 ETH), nunca um valor monetário: toda conversão de/para ETH passa pelo
 * `EthDecimal` (BigInt/Wei) e os valores trafegam como string decimal.
 */
const WEI_PER_STEP = 10n ** 16n; // 0.01 ETH

export const PRICE_SLIDER_MIN_STEP = 1; // 0.01 ETH
export const PRICE_SLIDER_MAX_STEP = 1500; // 15.00 ETH

/** Índice inteiro do slider → string ETH com 2 casas (ex.: 119 → "1.19"). */
export function stepToEth(step: number): string {
  return EthDecimal.fromWei(BigInt(step) * WEI_PER_STEP).toFixed(2);
}

/**
 * String ETH → índice do slider, truncando abaixo de 0.01 e limitando ao intervalo do slider.
 * Retorna `fallback` se a string não for um decimal válido.
 */
export function ethToStep(value: string | undefined, fallback: number): number {
  if (value === undefined || !EthDecimal.isValid(value)) return fallback;
  const steps = eth(value).wei / WEI_PER_STEP;
  const clamped =
    steps < BigInt(PRICE_SLIDER_MIN_STEP)
      ? BigInt(PRICE_SLIDER_MIN_STEP)
      : steps > BigInt(PRICE_SLIDER_MAX_STEP)
        ? BigInt(PRICE_SLIDER_MAX_STEP)
        : steps;
  return Number.parseInt(clamped.toString(), 10);
}

/** Formata um índice do slider para exibição (ex.: 119 → "1,19"). */
export function formatStep(step: number): string {
  return eth(stepToEth(step)).format({ minDecimals: 2, maxDecimals: 2 });
}
