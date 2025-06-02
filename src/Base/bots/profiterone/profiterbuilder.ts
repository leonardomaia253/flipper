import WebSocket from 'ws';
// @ts-ignore
global.WebSocket = WebSocket as any;

import { Interface } from "ethers";
import { ERC20_ABI } from "../../constants/abis";
import { estimateSwapOutput } from "../../utils/estimateOutput";
import { buildSwapTransaction } from "../../shared/build/buildSwap";
import { CallData, DexType } from "../../utils/types";
import { DEX_ROUTER } from "../../constants/addresses";
import { normalizeDex } from "../../utils/formallizedDEX";
import { BigNumberish } from 'ethers';

const erc20Interface = new Interface(ERC20_ABI);

type RouteStep = {
  tokenIn: string;
  tokenOut: string;
  dex: DexType;
  amountIn: BigNumberish;
  amountOut: BigNumberish;
};

type BuildOrchestrationOptions = {
  route: RouteStep[];
  flashLoanToken: string;
  flashLoanAmount: BigNumberish;
  slippageBps?: number;
};

export async function buildDynamicOrchestration({
  route,
  flashLoanToken,
  flashLoanAmount,
  slippageBps = 30,
}: BuildOrchestrationOptions): Promise<{
  approveCalls: CallData[];
  swapCalls: CallData[];
}> {
  if (route.length === 0) {
    throw new Error("No route steps provided");
  }

  const approveCache = new Set<string>();
  const approveCalls: CallData[] = [];
  const swapCalls: CallData[] = [];

  const firstStep = route[0];
  const firstDexRouter = DEX_ROUTER[normalizeDex(firstStep.dex)];
  if (!firstDexRouter) throw new Error(`Dex router not found for ${firstStep.dex}`);

  // --- Pré-swap se necessário ---
  if (flashLoanToken.toLowerCase() !== firstStep.tokenIn.toLowerCase()) {
    const estimated = await estimateSwapOutput(
      flashLoanToken,
      firstStep.tokenIn,
      flashLoanAmount,
      firstStep.dex
    );

    const estimatedBigInt = BigInt(estimated);
    const minOut = (estimatedBigInt * BigInt(10_000 - slippageBps)) / BigInt(10_000);

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
        value: 0n,
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

  // --- Swaps principais ---
  for (const step of route) {
    const dexRouter = DEX_ROUTER[normalizeDex(step.dex)];
    if (!dexRouter) throw new Error(`Dex router not found for ${step.dex}`);

    const minOut = (BigInt(step.amountOut) * BigInt(10_000 - slippageBps)) / BigInt(10_000);

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
        value: 0n,
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
  const lastStep = route[route.length - 1];
  const lastDexRouter = DEX_ROUTER[normalizeDex(lastStep.dex)];
  if (!lastDexRouter) throw new Error(`Dex router not found for ${lastStep.dex}`);

  if (flashLoanToken.toLowerCase() !== lastStep.tokenOut.toLowerCase()) {
    const estimated = await estimateSwapOutput(
      lastStep.tokenOut,
      flashLoanToken,
      lastStep.amountOut,
      lastStep.dex
    );

    const estimatedBigInt = BigInt(estimated);
    const minOut = (estimatedBigInt * BigInt(10_000 - slippageBps)) / BigInt(10_000);

    const tokenKey = `${lastStep.tokenOut.toLowerCase()}-${lastStep.dex.toLowerCase()}`;
    if (!approveCache.has(tokenKey)) {
      approveCache.add(tokenKey);
      approveCalls.push({
        to: lastStep.tokenOut,
        data: erc20Interface.encodeFunctionData("approve", [lastDexRouter, lastStep.amountOut]),
        dex: lastStep.dex,
        requiresApproval: true,
        approvalToken: lastStep.tokenOut,
        approvalAmount: lastStep.amountOut,
        value: 0n,
      });
    }

    const postSwap = await buildSwapTransaction({
      tokenIn: lastStep.tokenOut,
      tokenOut: flashLoanToken,
      amountIn: lastStep.amountOut,
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
