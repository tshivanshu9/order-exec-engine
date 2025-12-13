import { DexType } from '../../../constants/enums';

export type DexQuote = {
  dex: DexType;
  price: number;
  fee: number;
  liquidity: number;
};

export type RouteDecision = {
  bestDex: DexType;
  bestQuote: DexQuote;
  allQuotes: DexQuote[];
};
