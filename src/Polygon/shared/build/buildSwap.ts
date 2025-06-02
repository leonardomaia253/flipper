import { ethers } from "ethers";
import { CallData, DexSwap, BuiltSwapCall, DexType } from "../../utils/types";
import { enhancedLogger } from "../../utils/enhancedLogger";
import { BigNumberish } from "ethers";

// Importa os builders individuais
import {
  buildUniswapV3Swap,
  buildSushiswapV2Swap,
  buildQuickswapSwap,
  buildQuickswapV3Swap,
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
  if (dex === 'quickswap') {
    return buildQuickswapSwap({ tokenIn, tokenOut, amountIn, amountOutMin, dex});
  } else if (dex === 'quickswapv3') {
    return buildQuickswapV3Swap({ tokenIn, tokenOut, amountIn, amountOutMin, dex });
  } else if (dex === 'uniswapv3') {
    return buildUniswapV3Swap({ tokenIn, tokenOut, amountIn, amountOutMin, dex });
  } else if (dex === 'sushiswapv2') {
    return buildSushiswapV2Swap({ tokenIn, tokenOut, amountIn, amountOutMin, dex });
  } else {
    throw new Error(`DEX '${dex}' não suportada`);
  }
}
