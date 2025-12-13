import { getRaydiumQuote } from './raydium.mock';
import { getMeteoraQuote } from './meteora.mock';
import { RouteDecision } from './types/dex.types';

export async function routeOrder(
  tokenIn: string,
  tokenOut: string,
  amount: number
): Promise<RouteDecision> {
  const [raydium, meteora] = await Promise.all([
    getRaydiumQuote(tokenIn, tokenOut, amount),
    getMeteoraQuote(tokenIn, tokenOut, amount),
  ]);

  const best = raydium.price > meteora.price ? raydium : meteora;

  console.log(
    `[ROUTER] Selected ${best.dex} | Raydium=${raydium.price.toFixed(
      2
    )} Meteora=${meteora.price.toFixed(2)}`
  );

  return {
    bestDex: best.dex,
    bestQuote: best,
    allQuotes: [raydium, meteora],
  };
}
