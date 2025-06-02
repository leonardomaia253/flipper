import { ethers } from "ethers";
import { CallData, DexSwap, BuiltSwapCall, DexType } from "../../utils/types";
import { enhancedLogger } from "../../utils/enhancedLogger";
import { BigNumberish } from "ethers";

// Importa os builders individuais
import {
  buildUniswapV2Swap,
  buildUniswapV3Swap,
  buildNomiswapSwap,
  buildPancakeswapV3Swap,
  buildPancakeswapV2Swap,
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
  if (dex === 'uniswapv2') {
    return buildUniswapV2Swap({ tokenIn, tokenOut, amountIn, amountOutMin, dex});
  } else if (dex === 'uniswapv3') {
    return buildUniswapV3Swap({ tokenIn, tokenOut, amountIn, amountOutMin, dex });
  } else if (dex === 'pancakeswapv2') {
    return buildPancakeswapV2Swap({ tokenIn, tokenOut, amountIn, amountOutMin, dex });
    } else if (dex === 'pancakeswapv3') {
    return buildPancakeswapV3Swap({ tokenIn, tokenOut, amountIn, amountOutMin, dex });
    } else if (dex === 'nomiswap') {
    return buildNomiswapSwap({ tokenIn, tokenOut, amountIn, amountOutMin, dex });
  } else {
    throw new Error(`DEX '${dex}' não suportada`);
  }
}
