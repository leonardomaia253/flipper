import { SwapStep, TokenInfo, DexType } from "./types";
import { ethers } from 'ethers';
import { buildSwapTransaction } from "../shared/build/buildSwap";
import { DEX_ROUTER } from "../constants/addresses";

export async function convertRouteToSwapSteps(
  simpleRoute: {
    tokenIn: TokenInfo;
    tokenOut: TokenInfo;
    dex: DexType;  // Tipo literal, para ter segurança
    amountIn: ethers.BigNumberish;
    amountOut: ethers.BigNumberish;
  }[],
  recipient: string // adiciona recipient para passar no buildSwapTransaction
): Promise<SwapStep[]> {
  const steps: SwapStep[] = [];

  for (const swap of simpleRoute) {
    const router = DEX_ROUTER[swap.dex];
    if (!router) throw new Error(`Router para DEX ${swap.dex} não encontrado`);

    // Aqui você pode definir o amountOutMin com uma margem de segurança
    const slippageTolerance = 0.005; // 0.5%
    const amountOut = BigInt(swap.amountOut);
    const slippageMultiplier = BigInt(1000 - slippageTolerance * 1000); // 995n

    const amountOutMin = (amountOut * slippageMultiplier) / 1000n;

    const call = await buildSwapTransaction({
      tokenIn: swap.tokenIn.address,
      tokenOut: swap.tokenOut.address,
      amountIn: swap.amountIn,
      amountOutMin,
      dex: swap.dex,
    });

    steps.push({
      tokenIn: swap.tokenIn.address,
      tokenOut: swap.tokenOut.address,
      dex: swap.dex,
      amountIn: swap.amountIn,
      amountOut: swap.amountOut,
      router,
      to: router,
      data: call.data,
      amountOutMin,
    });
  }

  if (!steps) {
  throw new Error("Não foi possivel a conversão.");
}

return steps;
}

