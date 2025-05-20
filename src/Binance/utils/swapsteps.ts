
import { buildOrchestrationFromRoute } from "../bots/arbitrage/arbitragebuilder";
import { SwapStep, TokenInfo, DexType } from "./types";
import { ethers } from 'ethers';
import { buildSwapTransaction } from "../shared/build/buildSwap";

// Um mapeamento dos dex para seus routers
const DEX_ROUTERS: Record<string, string> = {
   "uniswapv2": "0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24",
   "uniswapv3": "0xE592427A0AEce92De3Edee1F18E0157C05861564", 
   "sushiswapv3": "0xA7caC4207579A179c1069435d032ee0F9F150e5c", 
   "uniswapv4": "0xA51afAFe0263b40EdaEf0Df8781eA9aa03E381a3", 
   "camelot": "0xc873fEcbd354f5A56E00E710B90EF4201db2448d", 
   "maverickv2": "0x5c3b380e5Aeec389d1014Da3Eb372FA2C9e0fc76",
   "curve": "0x2191718cd32d02b8e60badffea33e4b5dd9a0a0d", 
   "sushiswapv2": "0xA7caC4207579A179c1069435d032ee0F9F150e5c",
   "pancakeswapv3": "0x13f4ea83d0bd40e75c8222255bc855a974568dd4",
   "ramsesv2": "0xaa273216cc9201a1e4285ca623f584badc736944",
};

export async function convertRouteToSwapSteps(
  simpleRoute: {
    tokenIn: TokenInfo;
    tokenOut: TokenInfo;
    dex: DexType;  // Tipo literal, para ter segurança
    amountIn: ethers.BigNumber;
    amountOut: ethers.BigNumber;
  }[],
  recipient: string // adiciona recipient para passar no buildSwapTransaction
): Promise<SwapStep[]> {
  const steps: SwapStep[] = [];

  for (const swap of simpleRoute) {
    const router = DEX_ROUTERS[swap.dex];
    if (!router) throw new Error(`Router para DEX ${swap.dex} não encontrado`);

    // Aqui você pode definir o amountOutMin com uma margem de segurança
    const slippageTolerance = 0.005; // 0.5%
    const amountOutMin = swap.amountOut
      .mul(1000 - slippageTolerance * 1000) // subtraindo a slippage
      .div(1000);

    const call = await buildSwapTransaction({
      tokenIn: swap.tokenIn.address,
      tokenOut: swap.tokenOut.address,
      amountIn: swap.amountIn,
      amountOutMin,
      dex: swap.dex,
      recipient
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

