import { DexType } from '../../constants/enums';
import { sleep } from '../../utils/utility.service';
import { DexQuote } from './types/dex.types';

export async function getRaydiumQuote(
  tokenIn: string,
  tokenOut: string,
  amount: number
): Promise<DexQuote> {
  await sleep(200);

  const basePrice = 100;
  return {
    dex: DexType.RAYDIUM,
    price: basePrice * (0.98 + Math.random() * 0.04),
    fee: 0.003,
    liquidity: 1_000_000,
  };
}
