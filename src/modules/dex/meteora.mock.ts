import { DexType } from '../../constants/enums';
import { sleep } from '../../utils/utility.service';
import { DexQuote } from './types/dex.types';

export async function getMeteoraQuote(
  tokenIn: string,
  tokenOut: string,
  amount: number
): Promise<DexQuote> {
  await sleep(200);

  const basePrice = 100;
  return {
    dex: DexType.METEORA,
    price: basePrice * (0.97 + Math.random() * 0.05),
    fee: 0.002,
    liquidity: 800_000,
  };
}
