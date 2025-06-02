import { BigNumberish, formatUnits } from "ethers";
import { DexType } from "./types";
import { estimateSwapOutput } from "./estimateOutput";

type SandwichParams = {
  tokenIn: string;
  tokenOut: string;
  amountIn: BigNumberish;
  dex: DexType;
  fee?: number;
  extraParams?: any;
};

export async function estimatePriceImpactAndProfit(
  params: SandwichParams
): Promise<{
  priceImpact: number;
  estimatedProfit: bigint;
} | null> {
  const { tokenIn, tokenOut, amountIn, dex, fee = 3000, extraParams } = params;

  const amountInBigInt = BigInt(amountIn);

  // 1. Simula o swap de entrada (frontrun) -> tokenIn -> tokenOut
  const amountOutBN = await estimateSwapOutput(
    tokenIn,
    tokenOut,
    amountInBigInt,
    dex,
    fee,
    extraParams
  );

  const amountOut = BigInt(amountOutBN);

  if (amountOut === 0n) {
    console.warn("Frontrun simulation returned 0");
    return null;
  }

  // 2. Simula o swap de saída (backrun) -> tokenOut -> tokenIn
  const amountRecoveredBN = await estimateSwapOutput(
    tokenOut,
    tokenIn,
    amountOut,
    dex,
    fee,
    extraParams
  );

  const amountRecovered = BigInt(amountRecoveredBN);

  if (amountRecovered === 0n) {
    console.warn("Backrun simulation returned 0");
    return null;
  }

  const amountOutDecimal = parseFloat(formatUnits(amountOut, 18));
  const amountInDecimal = parseFloat(formatUnits(amountInBigInt, 18));

  // 3. Calcula o price impact
  const priceImpact = ((amountOutDecimal / amountInDecimal) - 1) * 100;

  // 4. Calcula o estimated profit
  const estimatedProfit = amountRecovered - amountInBigInt;

  return {
    priceImpact,
    estimatedProfit,
  };
}
