import WebSocket from 'ws';
// @ts-ignore
global.WebSocket = WebSocket as any;
import { ethers, BigNumberish, Transaction } from "ethers";
import * as dotenv from "dotenv";
import * as path from "path";
import { getDexList } from "../../utils/dexList";
import { estimatePriceImpactAndProfit } from "../../utils/getPriceImpactAndProfit";
import { enhancedLogger as log } from "../../utils/enhancedLogger";
import { decodeSwap } from "../../utils/decodeSwap";
import { buildDynamicOrchestration } from "./sandwichbuilder";
import { simulateTokenProfit } from "../../simulation/simulate";
import { buildSwapToETHCall } from "../../shared/build/buildSwapResidual";
import { buildUnwrapWETHCall } from "../../shared/build/UnwrapWETH";
import { executoraddress, WMATIC } from "../../constants/addresses";
import { sendSignedTxL2 } from "../../executor/sendBundle";
import { mirrorSwapTransactionToRoute } from "../../utils/mirrowedtransactions";
import { TokenInfo, SwapStep, CallData } from "../../utils/types";
import { buildOrchestrateCall } from "../../shared/build/buildOrchestrate";
import { multiprovider, PRIVATE_KEY, providersimplewss } from '../../config/provider';
import { providersimplehttp} from "../../config/provider";
import { startListeners } from "../../config/mempool";
import pLimit from 'p-limit';
import retry from 'async-retry';

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const config = {
  DRY_RUN: process.env.DRY_RUN === "false",
  MIN_PROFIT: ethers.parseEther(process.env.MIN_PROFIT || "0.005")
};

const currentBaseToken: TokenInfo = {
  address: WMATIC,
  symbol: "WMATIC",
  decimals: 18,
};

const signer = new ethers.Wallet(PRIVATE_KEY, multiprovider);

const processedTxs = new Set<string>();
const MAX_CACHE_SIZE = 10_000;

function cleanCache(txHash: string) {
  processedTxs.add(txHash);
  if (processedTxs.size > MAX_CACHE_SIZE) {
    const iterator = processedTxs.values();
    const first = iterator.next().value;
    if (first) processedTxs.delete(first);
  }
}

function shouldProcessTx(txHash: string): boolean {
  return !processedTxs.has(txHash);
}

function isProfitSufficient(profit: BigNumberish | null): boolean {
  return !!profit && ethers.toBigInt(profit) > ethers.toBigInt(config.MIN_PROFIT);
}


async function processTransaction(
  txHash: string,
  rawTx: string,
  dexSet: Set<string>
) {
  const start = Date.now();
  console.log(`🚀 processTransaction chamado para txHash=${txHash}`);

  if (!shouldProcessTx(txHash)) {

    log.info(`🔍 TX ignorada pelo filtro: ${txHash}`);
    return;
  }

  try {
    const tx: Transaction = ethers.Transaction.from(rawTx);
    if (!tx || !tx.to) {
      log.warn(`❌ TX inválida (sem 'to'): ${txHash}`);
      return;
    }

    const to = tx.to.toLowerCase();

    if (!dexSet.has(to)) {
      log.info(`🔍 Destino ${to} não está na lista de DEXs, ignorando tx ${txHash}`);
      return;
    }

    const decoded = await decodeSwap(tx.data,0,tx.to);
    if (!decoded || !decoded.amountIn) {
      log.warn(`❌ Falha ao decodificar a tx ${txHash}, ignorando.`);
      return;
    }

    if (BigInt(decoded.amountIn) === 0n) {
      log.info(`⛔ Quantidade 0 na tx ${txHash}, ignorando.`);
      return;
    }

    const priceImpactProfit = await estimatePriceImpactAndProfit({tokenIn:decoded.tokenIn,tokenOut:decoded.tokenOut,amountIn:decoded.amountIn,dex:decoded.dex});
    if (!priceImpactProfit) {
      log.info(`⛔ Estimativa de lucro/profit não disponível para tx ${txHash}`);
      return;
    }

    const { priceImpact, estimatedProfit } = priceImpactProfit;

    log.debug(`Decoded swap for tx ${txHash}: ${JSON.stringify(decoded)}`);

    const { route } = mirrorSwapTransactionToRoute(decoded, estimatedProfit);

    const flashLoanToken = currentBaseToken.address;
    const flashLoanAmount = (BigInt(decoded.amountIn) * 102n) / 100n;

    const orchestrationResult = await buildDynamicOrchestration({
      steps: route,
      flashLoanToken,
      flashLoanAmount,
    });

    if (!orchestrationResult) {
      log.error(`❌ Erro ao montar orquestração da tx ${txHash}`);
      return;
    }

    const profit = await simulateTokenProfit({
      provider: multiprovider,
      executoraddress,
      tokenaddress: flashLoanToken,
      orchestrationResult,
    });

    if (!isProfitSufficient(profit)) {
      log.warn(`⛔️ Lucro simulado insuficiente: ${ethers.formatEther(profit || 0n)} ETH - tx ${txHash}`);
      return;
    }

    log.info(`💰 Lucro simulado suficiente: ${ethers.formatEther(profit!)} ETH - tx ${txHash}`);

    const calls: CallData[] = [
      ...orchestrationResult.approveCalls.map((call) => ({
        to: call.to,
        data: call.data,
        requiresApproval: true,
        approvalToken: call.approvalToken,
        approvalAmount: call.approvalAmount,
      })),
      ...orchestrationResult.swapCalls.map((call) => ({
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

    const swapRemainingTx = await buildSwapToETHCall({
      tokenIn: flashLoanToken,
      amountIn: profit!,
      recipient: executoraddress,
    });

    const unwrapCall = buildUnwrapWETHCall({ wethaddress: WMATIC });
    
 
        
    const txs = [atomic, swapRemainingTx, unwrapCall];

    const gasLimitPerTx = 500_000;
    const bundleTxs = txs.map((tx) => ({
      signer: signer,
      transaction: {
        to: tx.to,
        data: tx.data,
        gasLimit: gasLimitPerTx,
      },
    }));

    const totalGas = BigInt(gasLimitPerTx) * BigInt(bundleTxs.length);
    log.info(`⛽️ Estimativa total de gas para bundle: ${totalGas}`);

    if (config.DRY_RUN) {
      log.warn(`🧪 DRY-RUN ativado: bundle não será enviado - tx ${txHash}`);
      bundleTxs.forEach((tx, i) => {
        log.info(`  Bundle tx ${i + 1}: ${JSON.stringify(tx, null, 2)}`);
      });
      log.info(`💰 Lucro estimado no dry-run: ${ethers.formatEther(profit!)} ETH`);
      log.info(`⛽️ Gas total estimado no dry-run: ${totalGas}`);
    } else {
      await retry(
         async () => {
                  try {
                  await sendSignedTxL2({providers:providersimplehttp,bundleTxs:bundleTxs,flashbotsEndpoint:process.env.FLASHBOTS!,mevShareEndpoint: process.env.MEV_SHARE!,signerKey:process.env.PRIVATE_KEY!,blocksRouteEndpoint:process.env.BLOXROUTE,
                  customHeaders: {Authorization: `Bearer ${process.env.BLOXROUTE_AUTH}`,},});
      log.info(`✅ Bundle enviado com sucesso! - tx ${txHash}`);
    } catch (err) {
      log.warn(`⚠️ Falha ao enviar bundle, tentativa de retry - tx ${txHash}: ${(err as Error).message}`);
      throw err; // para acionar retry
    }
  },
  {
    retries: 3,
    minTimeout: 500,
    maxTimeout: 2000,
    factor: 2,
  }
);
    }
  } catch (err) {
    log.error(`❌ Erro ao processar tx ${txHash}: ${(err as Error).message}`);
  } finally {
    cleanCache(txHash);
    const duration = Date.now() - start;
    log.info(`⏱️ Processamento da tx ${txHash} levou ${duration} ms`);
  }
}


async function main() {
  const dexList = await getDexList();
  const dexSet = new Set(dexList);

  const limit = pLimit(25); // Limita 5 processamentos paralelos

  startListeners(providersimplewss, (txHash: string, rawTx: string) => {
    console.log(`🔔 Callback recebido na main: txHash=${txHash}`);
    limit(() => processTransaction(txHash, rawTx, dexSet)).catch(err => {
      console.error(`❌ Erro no processamento paralelo da tx ${txHash}: ${err.message}`);
    });
  });
}

main().catch((err) => {
  console.error("❌ Erro fatal na execução: ", err);
});

