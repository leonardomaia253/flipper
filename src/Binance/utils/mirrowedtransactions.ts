import { BigNumberish } from 'ethers'; 
import { DexType,DecodedSwapTransaction, SwapStep } from './types';// ou 'viem'


/**
 * Espelha uma DecodedSwapTransaction para criar um SwapStep de retorno.
 */

export type RouteElement = {
  tokenIn: string;
  tokenOut: string;
  amountIn: BigNumberish;
  amountOut: BigNumberish;
  dex: DexType;
};

export function mirrorSwapTransactionToRoute(
  original: DecodedSwapTransaction,
  expectedProfitPercent: BigNumberish
): { route: [RouteElement, RouteElement] } {
  
    
  if (
    !original ||
    !original.tokenIn ||
    !original.tokenOut ||
    !original.amountIn ||
    !original.amountOutMin
  ) {
    throw new Error("❌ Dados inválidos para gerar mirror swap");
  }
  

  const route: [RouteElement, RouteElement] = [
    {
      tokenIn: original.tokenIn,
      tokenOut: original.tokenOut,
      amountIn: original.amountIn,
      amountOut: original.amountOutMin,
      dex: original.dex
    },
    {
      tokenIn: original.tokenOut,
      tokenOut: original.tokenIn,
      amountIn: BigInt(original.amountOutMin),
      amountOut: BigInt(original.amountIn) + (BigInt(original.amountIn) * BigInt(expectedProfitPercent)) / 100n,
      dex: original.dex
    }
  ];

  return { route };
}
