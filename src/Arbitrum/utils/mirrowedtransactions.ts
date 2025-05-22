import { BigNumber } from 'ethers'; 
import { DexType,DecodedSwapTransaction, SwapStep } from './types';// ou 'viem'


/**
 * Espelha uma DecodedSwapTransaction para criar um SwapStep de retorno.
 */

export type RouteElement = {
  tokenIn: string;
  tokenOut: string;
  amountIn: BigNumber;
  amountOut: BigNumber;
  dex: DexType;
};

export function mirrorSwapTransactionToRoute(
  original: DecodedSwapTransaction,
  expectedProfitPercent: BigNumber
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
      amountIn: original.amountOutMin,
      amountOut: original.amountIn.add(original.amountIn.mul(expectedProfitPercent).div(100)),
      dex: original.dex
    }
  ];

  return { route };
}
