import { BigNumber, ethers } from "ethers";
import { ERC20_ABI } from "../../constants/abis";
import { estimateSwapOutput } from "../../utils/estimateOutput";
import { buildSwapTransaction } from "../../shared/build/buildSwap";
import { DexType, CallData, SwapStep } from "../../utils/types";
import { DEX_ROUTER } from "../../constants/addresses";
import { RouteElement } from "../../utils/mirrowedtransactions";

const erc20Interface = new ethers.utils.Interface(ERC20_ABI);

type Token = {
  address: string;
  symbol: string;
  decimals: number;
};

type BuildOrchestrationOptions = {
  steps: RouteElement[];
  flashLoanToken: string;
  flashLoanAmount: BigNumber;
  slippageBps?: number;
};

export async function buildDynamicOrchestration({
  steps,
  flashLoanToken,
  flashLoanAmount,
  slippageBps = 30,
}: BuildOrchestrationOptions): Promise<{
  approveCalls: CallData[];
  swapCalls: CallData[];
}> {
  if (steps.length === 0) {
    throw new Error("No swap steps provided");
  }

  const approveCache = new Set<string>();
  const approveCalls: CallData[] = [];
  const swapCalls: CallData[] = [];
  const outputEstimates: BigNumber[] = [];

  // --- Pré-swap (step 0) se necessário ---
  const firstStep = steps[0];
  const firstDexRouter = DEX_ROUTER[firstStep.dex.toLowerCase()];
  if (!firstDexRouter) throw new Error(`Dex router not found for ${firstStep.dex}`);

  if (flashLoanToken.toLowerCase() !== firstStep.tokenIn.toLowerCase()) {
    const estimated = await estimateSwapOutput(
      flashLoanToken,
      firstStep.tokenIn,
      flashLoanAmount,
      firstStep.dex
    );

    const minOut = estimated.mul(10_000 - slippageBps).div(10_000);

    const tokenKey = `${flashLoanToken.toLowerCase()}-${firstStep.dex.toLowerCase()}`;
    if (!approveCache.has(tokenKey)) {
      approveCache.add(tokenKey);
      approveCalls.push({
        to: flashLoanToken,
        data: erc20Interface.encodeFunctionData("approve", [firstDexRouter, flashLoanAmount]),
        dex: firstStep.dex,
        requiresApproval: true,
        approvalToken: flashLoanToken,
        approvalAmount: flashLoanAmount,
        value: BigNumber.from(0),
      });
    }

    const preSwap = await buildSwapTransaction({
      tokenIn: flashLoanToken,
      tokenOut: firstStep.tokenIn,
      amountIn: flashLoanAmount,
      amountOutMin: minOut,
      dex: firstStep.dex,
    });

    swapCalls.push(preSwap);
  }

  // --- Swaps principais (steps 1, 2, ...) ---
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const dexRouter = DEX_ROUTER[step.dex.toLowerCase()];
    if (!dexRouter) throw new Error(`Dex router not found for ${step.dex}`);

    const expectedOut = await estimateSwapOutput(
      step.tokenIn,
      step.tokenOut,
      step.amountIn,
      step.dex
    );

    outputEstimates.push(expectedOut);

    const minOut = expectedOut.mul(10_000 - slippageBps).div(10_000);

    const tokenKey = `${step.tokenIn.toLowerCase()}-${step.dex.toLowerCase()}`;
    if (!approveCache.has(tokenKey)) {
      approveCache.add(tokenKey);
      approveCalls.push({
        to: step.tokenIn,
        data: erc20Interface.encodeFunctionData("approve", [dexRouter, step.amountIn]),
        dex: step.dex,
        requiresApproval: true,
        approvalToken: step.tokenIn,
        approvalAmount: step.amountIn,
        value: BigNumber.from(0),
      });
    }

    const swapTx = await buildSwapTransaction({
      tokenIn: step.tokenIn,
      tokenOut: step.tokenOut,
      amountIn: step.amountIn,
      amountOutMin: minOut,
      dex: step.dex,
    });

    swapCalls.push(swapTx);
  }

  // --- Pós-swap se necessário ---
  const lastStep = steps[steps.length - 1];
  const lastDexRouter = DEX_ROUTER[lastStep.dex.toLowerCase()];
  if (!lastDexRouter) throw new Error(`Dex router not found for ${lastStep.dex}`);

  // Garante que outputEstimates não está vazio
  if (
    flashLoanToken.toLowerCase() !== lastStep.tokenOut.toLowerCase() &&
    outputEstimates.length > 0
  ) {
    const lastOutput = outputEstimates[outputEstimates.length - 1];

    const estimated = await estimateSwapOutput(
      lastStep.tokenOut,
      flashLoanToken,
      lastOutput,
      lastStep.dex
    );

    const minOut = estimated.mul(10_000 - slippageBps).div(10_000);

    const tokenKey = `${lastStep.tokenOut.toLowerCase()}-${lastStep.dex.toLowerCase()}`;
    if (!approveCache.has(tokenKey)) {
      approveCache.add(tokenKey);
      approveCalls.push({
        to: lastStep.tokenOut,
        data: erc20Interface.encodeFunctionData("approve", [lastDexRouter, lastOutput]),
        dex: lastStep.dex,
        requiresApproval: true,
        approvalToken: lastStep.tokenOut,
        approvalAmount: lastOutput,
        value: BigNumber.from(0),
      });
    }

    const postSwap = await buildSwapTransaction({
      tokenIn: lastStep.tokenOut,
      tokenOut: flashLoanToken,
      amountIn: lastOutput,
      amountOutMin: minOut,
      dex: lastStep.dex,
    });

    swapCalls.push(postSwap);
  }

  return {
    approveCalls,
    swapCalls,
  };
}
