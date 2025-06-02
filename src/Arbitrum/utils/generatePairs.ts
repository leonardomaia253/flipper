import { TokenInfo } from "./types";

export type DexPair = {
  tokenIn: TokenInfo;
  tokenOut: TokenInfo;
};

export function generateTokenPairs(tokens: TokenInfo[]): DexPair[] {
  const pairs: DexPair[] = [];

  for (let i = 0; i < tokens.length; i++) {
    for (let j = 0; j < tokens.length; j++) {
      if (i === j) continue; // Ignora tokenIn == tokenOut

      pairs.push({
        tokenIn: tokens[i],
        tokenOut: tokens[j],
      });
    }
  }

  return pairs;
}
