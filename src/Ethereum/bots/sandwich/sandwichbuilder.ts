import WebSocket from 'ws';
// @ts-ignore
global.WebSocket = WebSocket as any;

import { ethers, BigNumberish } from "ethers";
import { ERC20_ABI } from "../../constants/abis";
import { estimateSwapOutput } from "../../utils/estimateOutput";
import { buildSwapTransaction } from "../../shared/build/buildSwap";
import { DexType, CallData, SwapStep } from "../../utils/types";
import { DEX_ROUTER } from "../../constants/addresses";
import { RouteElement } from "../../utils/mirrowedtransactions";
import { normalizeDex } from "../../utils/formallizedDEX";

const erc20Interface = new ethers.Interface(ERC20_ABI);

type Token = {
  address: string;
  symbol: string;
  decimals: number;
};

type BuildOrchestrationOptions = {
  steps: RouteElement[];
  flashLoanToken: string;
  flashLoanAmount: BigNumberish;
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
  const outputEstimates: BigNumberish[] = [];

  // --- Validação inicial dos passos ---
  steps.forEach((step, i) => {
    if (!step.tokenIn || !step.tokenOut || !step.amountIn || !step.dex) {
      throw new Error(
        `Step ${i} inválido: campos tokenIn, tokenOut, amountIn e dex são obrigatórios`
      );
    }
  });

  // --- Pré-swap (step 0) se necessário ---
  const firstStep = steps[0];
  const firstDexRouter = DEX_ROUTER[normalizeDex(firstStep.dex)];
  if (!firstDexRouter) throw new Error(`Dex router not found for ${firstStep.dex}`);

  if (flashLoanToken.toLowerCase() !== firstStep.tokenIn.toLowerCase()) {
    // Estima output para swap inicial do flashLoanToken para tokenIn do primeiro passo
    let estimated: BigNumberish;
    try {
      estimated = await estimateSwapOutput(
        flashLoanToken,
        firstStep.tokenIn,
        flashLoanAmount,
        firstStep.dex
      );
    } catch (err) {
      throw new Error(`Falha na estimativa do pré-swap: ${(err as Error).message}`);
    }

    const minOut = (BigInt(estimated) * BigInt(10_000 - slippageBps)) / BigInt(10_000);

    // Aprovação do token flashLoanToken para o router do primeiro DEX, se ainda não aprovada
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
        value: BigInt(0),
      });
    }

    // Construção da chamada de swap para pré-swap
    const preSwap = await buildSwapTransaction({
      tokenIn: flashLoanToken,
      tokenOut: firstStep.tokenIn,
      amountIn: flashLoanAmount,
      amountOutMin: minOut,
      dex: firstStep.dex,
    });

    swapCalls.push(preSwap);
  }

  // --- Swaps principais (steps 0 até o final) ---
  // (Aqui inclui o primeiro passo, porque ele pode ser diferente do pré-swap)
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const dexRouter = DEX_ROUTER[normalizeDex(step.dex)];
    if (!dexRouter) throw new Error(`Dex router not found for ${step.dex}`);

    // Estima output para o swap
    let expectedOut: BigNumberish;
    try {
      expectedOut = await estimateSwapOutput(
        step.tokenIn,
        step.tokenOut,
        step.amountIn,
        step.dex
      );
    } catch (err) {
      throw new Error(`Falha na estimativa para step ${i}: ${(err as Error).message}`);
    }

    outputEstimates.push(expectedOut);

    const minOut = (BigInt(expectedOut) * BigInt(10_000 - slippageBps)) / BigInt(10_000);

    // Aprovação do token tokenIn para o router do DEX, se ainda não aprovada
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
        value: BigInt(0),
      });
    }

    // Construção da chamada de swap para este passo
    const swapTx = await buildSwapTransaction({
      tokenIn: step.tokenIn,
      tokenOut: step.tokenOut,
      amountIn: step.amountIn,
      amountOutMin: minOut,
      dex: step.dex,
    });

    swapCalls.push(swapTx);
  }

  // --- Pós-swap para retornar ao token do flashloan, se necessário ---
  const lastStep = steps[steps.length - 1];
  const lastDexRouter = DEX_ROUTER[normalizeDex(lastStep.dex)];
  if (!lastDexRouter) throw new Error(`Dex router not found for ${lastStep.dex}`);

  if (
    flashLoanToken.toLowerCase() !== lastStep.tokenOut.toLowerCase() &&
    outputEstimates.length > 0
  ) {
    const lastOutput = outputEstimates[outputEstimates.length - 1];

    // Estima output para o pós-swap
    let estimated: BigNumberish;
    try {
      estimated = await estimateSwapOutput(
        lastStep.tokenOut,
        flashLoanToken,
        lastOutput,
        lastStep.dex
      );
    } catch (err) {
      throw new Error(`Falha na estimativa do pós-swap: ${(err as Error).message}`);
    }

    const minOut = (BigInt(estimated) * BigInt(10_000 - slippageBps)) / BigInt(10_000);

    // Aprovação do token lastStep.tokenOut para o router do último DEX, se ainda não aprovada
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
        value: BigInt(0),
      });
    }

    // Construção da chamada de swap para o pós-swap
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
