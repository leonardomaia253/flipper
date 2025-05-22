import { ethers, Wallet } from "ethers";
import { buildDynamicOrchestration } from "./arbitragebuilder.ts";
import { fetchTopTokensArbitrum } from "../../utils/tokensdefi";
import { findBestArbitrageRoute } from "./arbitrageScanner";
import { TokenInfo } from "../../utils/types";
import { buildUnwrapWETHCall } from "../../shared/build/UnwrapWETH";
import { buildSwapToETHCall } from "../../shared/build/buildSwapResidual";
import { simulateTokenProfit } from "../../simulation/simulate";
import { sendBundle } from "../../../Arbitrum/executor/sendBundle";
import * as dotenv from "dotenv";
import * as path from "path";
import { executorAddress, WETH } from "../../constants/addresses";
import { enhancedLogger as log } from "../../utils/enhancedLogger";
import { buildOrchestrateCall } from "../../shared/build/buildOrchestrate";
import { CallData } from "../../utils/types";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });


const MIN_PROFIT_ETH = parseFloat(process.env.MIN_PROFIT_ETH || "0.01");
const provider = new ethers.providers.WebSocketProvider(process.env.ALCHEMY_WSS!);
const signer = new Wallet(process.env.PRIVATE_KEY!, provider);
const DRY_RUN = process.env.DRY_RUN === "true";

const MAX_CONCURRENT_CYCLES = 3;
let activeCycles = 0;

let consecutiveErrors = 0;
let baseDelay = 1000; // ms
let maxDelay = 10000; // ms

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function jitterDelay(attempt: number) {
  const expBackoff = Math.min(baseDelay * 2 ** attempt, maxDelay);
  return expBackoff / 2 + Math.random() * (expBackoff / 2);
}

async function executeCycle() {
  const cycleStart = Date.now();
  log.info("🔍 Iniciando ciclo de arbitragem...");

  try {
    const tokenList = await fetchTopTokensArbitrum(200);

    const currentBaseToken: TokenInfo = {
      address: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
      symbol: "WETH",
      decimals: 18,
    };

    if (tokenList.length === 0) {
      log.warn("❌ Lista de tokens vazia.");
      return;
    }

    const bestRoute = await findBestArbitrageRoute({
      provider,
      baseToken: currentBaseToken,
      tokenList,
    });

    if (!bestRoute || bestRoute.route.length === 0) {
      log.warn("❌ Nenhuma rota de arbitragem encontrada.");
      return;
    }

    const profitInETH = parseFloat(ethers.utils.formatUnits(bestRoute.netProfit, currentBaseToken.decimals));
    if (profitInETH < MIN_PROFIT_ETH) {
      log.info(`⚠️ Lucro ${profitInETH} ETH abaixo do mínimo (${MIN_PROFIT_ETH}). Ignorando...`);
      return;
    }

    const routeStr = bestRoute.route.map(s => s.tokenIn.symbol).join(" → ") + " → " + bestRoute.route.at(-1)?.tokenOut.symbol;
    log.info(`🚀 Rota: ${routeStr} | Lucro estimado: ${profitInETH} ETH`);

    const flashLoanToken = currentBaseToken.address;
    const flashLoanAmount = ethers.utils.parseUnits("2", currentBaseToken.decimals);

    const formattedRoute = bestRoute.route.map(step => ({
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
      provider,
      executorAddress,
      tokenAddress: currentBaseToken.address,
      orchestrationResult,
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
    approvalToken: call.to,  // provavelmente o token que está aprovando
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
      recipient: executorAddress,
    });

    const unwrapCall = buildUnwrapWETHCall({ wethAddress: WETH });

    const txs = [
      atomic,
      SwapRemainingTx,
      unwrapCall,
    ];

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
      await sendBundle(bundleTxs, provider);
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
    log.info(`⏱️ Ciclo finalizado em ${duration}s`);
    activeCycles--;
  }
}

async function loop() {
  while (true) {
    if (activeCycles < MAX_CONCURRENT_CYCLES) {
      activeCycles++;
      executeCycle();
    } else {
      await sleep(500);  // Pequeno delay para evitar busy loop
    }
  }
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

log.info("🤖 Iniciando bot de arbitragem com controle de concorrência e auto-ajuste...");
loop();
