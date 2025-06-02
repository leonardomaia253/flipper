import { ethers } from "ethers";
import { CallData, DexSwap, BuiltSwapCall, DexType } from "../../utils/types";
import { enhancedLogger } from "../../utils/enhancedLogger";
import { BigNumberish } from "ethers";

// Importa os builders individuais
import {
  buildUniswapV3Swap,
  buildVelodromeslipstreamSwap,
  buildVelodromefinanceV2Swap,
  buildSolidlyV3Swap,
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
  } else if (dex === 'velodromeslipstream') {
    return buildVelodromeslipstreamSwap({ tokenIn, tokenOut, amountIn, amountOutMin, dex });
  } else if (dex === 'velodromefinancev2') {
    return buildVelodromefinanceV2Swap({ tokenIn, tokenOut, amountIn, amountOutMin, dex });
  } else if (dex === 'solidlyv3') {
    return buildSolidlyV3Swap({ tokenIn, tokenOut, amountIn, amountOutMin, dex });
  } else {
    throw new Error(`DEX '${dex}' não suportada`);
  }
}
