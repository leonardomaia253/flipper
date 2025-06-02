import WebSocket from 'ws';
// @ts-ignore
global.WebSocket = WebSocket as any;

import { ethers, Wallet } from "ethers";
import { buildDynamicOrchestration } from "./arbitragebuilder";
import { mevWatcher } from "./arbitrageScanner";
import { TokenInfo, CallData } from "../../utils/types";
import { buildUnwrapWETHCall } from "../../shared/build/UnwrapWETH";
import { buildSwapToETHCall } from "../../shared/build/buildSwapResidual";
import { simulateTokenProfit } from "../../simulation/simulate";
import { sendSignedTxL2 } from "../../executor/sendBundle";
import * as dotenv from "dotenv";
import * as path from "path";
import { executoraddress, WETH } from "../../constants/addresses";
import { enhancedLogger as log } from "../../utils/enhancedLogger";
import { buildOrchestrateCall } from "../../shared/build/buildOrchestrate";
import { alchemysupport, multiprovider, providersimplehttp } from "../../config/provider";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const MIN_PROFIT_ETH = parseFloat(process.env.MIN_PROFIT_ETH || "0.01");
const DRY_RUN = process.env.DRY_RUN === "false";
export const signer = new Wallet(process.env.PRIVATE_KEY!, alchemysupport);

const MAX_CONCURRENT_CYCLES = 3;
let activeCycles = 0;

let consecutiveErrors = 0;
let baseDelay = 1000;
let maxDelay = 10000;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function jitterDelay(attempt: number) {
  const expBackoff = Math.min(baseDelay * 2 ** attempt, maxDelay);
  return expBackoff / 2 + Math.random() * (expBackoff / 2);
}

async function executeOpportunity(opportunity: any) {
  const cycleStart = Date.now();
  log.info("🔍 Oportunidade de arbitragem recebida...");

  try {
    const currentBaseToken: TokenInfo = {
      address: WETH,
      symbol: "WETH",
      decimals: 18,
    };

    if (!opportunity || opportunity.route.length === 0) {
      log.warn("❌ Oportunidade inválida ou rota vazia.");
      return;
    }

    const profitInETH = parseFloat(ethers.formatUnits(opportunity.netProfit, currentBaseToken.decimals));
    if (profitInETH < MIN_PROFIT_ETH) {
      log.info(`⚠️ Lucro ${profitInETH} ETH abaixo do mínimo (${MIN_PROFIT_ETH}). Ignorando...`);
      return;
    }

    const routeStr = opportunity.route.map((s: { tokenIn: TokenInfo; tokenOut: TokenInfo; dex: string; amountIn: bigint; amountOut: bigint; }) => s.tokenIn.symbol).join(" → ") + " → " + opportunity.route.at(-1)?.tokenOut.symbol;
    log.info(`🚀 Rota: ${routeStr} | Lucro estimado: ${profitInETH} ETH`);

    const flashLoanToken = currentBaseToken.address;
    const flashLoanAmount = ethers.parseUnits("2", currentBaseToken.decimals);

    const formattedRoute = opportunity.route.map((step: any) => ({
      tokenIn: step.tokenIn.address,
      tokenOut: step.tokenOut.address,
      dex: step.dex,
      amountIn: step.amountIn,
      amountOut: step.amountOut,
    }));

    const orchestrationResult = await buildDynamicOrchestration({
      route: formattedRoute,
      flashLoanToken,
      flashLoanAmount,
    });

    if (!orchestrationResult) {
      log.error("❌ Erro ao montar a orquestração.");
      return;
    }

    const profit = await simulateTokenProfit({
      provider: multiprovider,
      executoraddress: executoraddress,
      tokenaddress: currentBaseToken.address,
      orchestrationResult: orchestrationResult,
    });

    const calls: CallData[] = [
      ...orchestrationResult.approveCalls.map(call => ({
        to: call.to,
        data: call.data,
        requiresApproval: true,
        approvalToken: call.approvalToken,
        approvalAmount: call.approvalAmount,
      })),
      ...orchestrationResult.swapCalls.map(call => ({
        to: call.to,
        data: call.data,
        requiresApproval: true,
        approvalToken: call.to,
        approvalAmount: call.approvalAmount,
      })),
    ];

    const atomic = await buildOrchestrateCall({
      token: flashLoanToken,
      amount: flashLoanAmount,
      calls,
    });

    const SwapRemainingTx = await buildSwapToETHCall({
      tokenIn: flashLoanToken,
      amountIn: profit,
      recipient: executoraddress,
    });

    const unwrapCall = buildUnwrapWETHCall({ wethaddress: WETH });



    const txs = [atomic, SwapRemainingTx, unwrapCall];

    const bundleTxs = txs.map((tx) => ({
      signer: signer,
      transaction: {
        to: tx.to,
        data: tx.data,
        gasLimit: 500_000,
      },
    }));

    if (DRY_RUN) {
      log.warn("🧪 DRY-RUN ativado: bundle não será enviado");
      bundleTxs.forEach((tx, i) => {
        log.info(`  ${i + 1}. ${JSON.stringify(tx, null, 2)}`);
      });
    } else {
      await sendSignedTxL2({
        providers: providersimplehttp,
        bundleTxs: bundleTxs,
        flashbotsEndpoint: process.env.FLASHBOTS!,
        mevShareEndpoint: process.env.MEV_SHARE!,
        signerKey: process.env.PRIVATE_KEY!,blocksRouteEndpoint:process.env.BLOXROUTE,
        customHeaders: { Authorization: `Bearer ${process.env.BLOXROUTE_AUTH}` },
      });
      log.info("✅ Bundle enviado com sucesso!");
    }

    consecutiveErrors = 0;
  } catch (err) {
    consecutiveErrors++;
    log.error(`❌ Erro no ciclo: ${err}`);
    const delay = jitterDelay(consecutiveErrors);
    log.warn(`⏳ Aguardando ${delay}ms antes do próximo ciclo (erro consecutivo: ${consecutiveErrors})`);
    await sleep(delay);
  } finally {
    const cycleEnd = Date.now();
    const duration = ((cycleEnd - cycleStart) / 1000).toFixed(2);
    log.info(`⏱️ Oportunidade processada em ${duration}s`);
    activeCycles--;
  }
}

function startListening() {
  mevWatcher.on("opportunity", async (opportunity) => {
    if (activeCycles >= MAX_CONCURRENT_CYCLES) {
      log.warn("⚠️ Limite de ciclos simultâneos atingido. Ignorando oportunidade.");
      return;
    }
    activeCycles++;
    await executeOpportunity(opportunity);
  });
}

process.on("uncaughtException", (err) => {
  if (err instanceof Error) {
    log.error("🔥 Erro fatal não tratado:", { message: err.message, stack: err.stack });
  } else {
    log.error("🔥 Erro fatal não tratado:", { error: String(err) });
  }
});

process.on("unhandledRejection", (reason) => {
  if (reason instanceof Error) {
    log.error("🔥 Promessa rejeitada não tratada:", { message: reason.message, stack: reason.stack });
  } else {
    log.error("🔥 Promessa rejeitada não tratada:", { error: String(reason) });
  }
});

log.info("🤖 Iniciando bot de arbitragem com controle de concorrência baseado em oportunidades...");
startListening();
