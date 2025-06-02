import { ethers } from "ethers";
import { CallData, DexSwap, BuiltSwapCall, DexType } from "../../utils/types";
import { enhancedLogger } from "../../utils/enhancedLogger";
import { BigNumberish } from "ethers";

// Importa os builders individuais
import {
  buildUniswapV3Swap,
  buildLfjSwap,
  buildLfjv21Swap,
  buildLfjv22Swap,
} from "../../utils/encodeSwap";



export async function buildSwapTransaction({
  tokenIn,
  amountIn,
  tokenOut,
  amountOutMin,
  dex,
}: {
  tokenIn: string;
  tokenOut: string;
  amountIn: BigNumberish;
  amountOutMin: BigNumberish;
  dex: DexType;
}): Promise<BuiltSwapCall> {
  if (dex === 'uniswapv3') {
    return buildUniswapV3Swap({ tokenIn, tokenOut, amountIn, amountOutMin, dex});
  } else if (dex === 'lfjv22') {
    return buildLfjv22Swap({ tokenIn, tokenOut, amountIn, amountOutMin, dex });
  } else if (dex === 'lfj') {
    return buildLfjSwap({ tokenIn, tokenOut, amountIn, amountOutMin, dex });
  } else if (dex === 'lfjv21') {
    return buildLfjv21Swap({ tokenIn, tokenOut, amountIn, amountOutMin, dex });
  } else {
    throw new Error(`DEX '${dex}' não suportada`);
  }
}
