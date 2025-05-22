import { ethers, BigNumber } from "ethers";
import * as dotenv from "dotenv";
import * as path from "path";

import { getDexList } from "../../utils/dexList";
import { getPriceImpactAndProfit } from "../../utils/getPriceImpactAndProfit";
import { enhancedLogger as log } from "../../utils/enhancedLogger";
import { decodeSwap } from "../../utils/decodeSwap";
import { buildDynamicOrchestration } from "./frontrunbuilder";
import { simulateTokenProfit } from "../../simulation/simulate";
import { buildSwapToETHCall } from "../../shared/build/buildSwapResidual";
import { buildUnwrapWETHCall } from "../../shared/build/UnwrapWETH";
import { executorAddress, WETH } from "../../constants/addresses";
import { sendBundle } from "../../executor/sendBundle";
import { mirrorSwapTransactionToRoute } from "../../utils/mirrowedtransactions";
import { TokenInfo, SwapStep } from "../../utils/types";
import { buildOrchestrateCall } from "../../shared/build/buildOrchestrate";
import { CallData } from "../../utils/types";

import WebSocket from "ws";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// --- Constantes e configuração ---

const BLOXROUTE_WSS = process.env.BLOXROUTE_WSS!;
const BLOXROUTE_AUTH_HEADER = process.env.BLOXROUTE_AUTH_HEADER!;
const RPC_URL = process.env.ALCHEMY_HTTP!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const DRY_RUN = process.env.DRY_RUN === "true";
const MIN_PROFIT = ethers.utils.parseEther(process.env.MIN_PROFIT || "0.005");

if (!BLOXROUTE_WSS) throw new Error("Missing BLOXROUTE_WSS in .env");
if (!BLOXROUTE_AUTH_HEADER) throw new Error("Missing BLOXROUTE_AUTH_HEADER in .env");
if (!PRIVATE_KEY) throw new Error("PRIVATE_KEY não definida no .env");

const currentBaseToken: TokenInfo = {
  address: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
  symbol: "WETH",
  decimals: 18,
};

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);

const processedTxs = new Set<string>();
const MAX_CACHE_SIZE = 10_000;

// --- Tipos auxiliares ---

interface BundleTransaction {
  signer: ethers.Wallet;
  transaction: {
    to: string;
    data: string;
    gasLimit: number;
  };
}

// --- Utilitárias ---

function cleanCache(txHash: string) {
  processedTxs.add(txHash);
  if (processedTxs.size > MAX_CACHE_SIZE) {
    const [first] = processedTxs;
    if (first) processedTxs.delete(first);
  }
}

function shouldProcessTx(txHash: string): boolean {
  return !processedTxs.has(txHash);
}

function buildBundle(txs: { to: string; data: string }[]): BundleTransaction[] {
  return txs.map(tx => ({
    signer,
    transaction: { to: tx.to, data: tx.data, gasLimit: 500_000 },
  }));
}

function isProfitSufficient(profit: BigNumber | null): boolean {
  return !!profit && profit.gt(MIN_PROFIT);
}

async function processTransaction(txHash: string, rawTx: string, dexList: string[]) {
  if (!shouldProcessTx(txHash)) return;
  cleanCache(txHash);

  const tx = ethers.utils.parseTransaction(rawTx);
  if (!tx || !tx.to) return;

  const to = tx.to.toLowerCase();
  if (!dexList.includes(to)) return;

  const priceImpactProfit = await getPriceImpactAndProfit(tx);
  if (!priceImpactProfit) return;

  const { priceImpact, estimatedProfit } = priceImpactProfit;
  if (estimatedProfit.lte(ethers.utils.parseEther("0.01"))) return;

  log.info(`🚀 Oportunidade detectada:\n  Tx: ${txHash}\n  DEX: ${to}\n  Impacto: ${priceImpact.toFixed(2)}%\n  Lucro potencial: ${ethers.utils.formatEther(estimatedProfit)} ETH`);

  const decoded = await decodeSwap(tx);
  if (!decoded) {
    log.warn(`❌ Falha ao decodificar a transação ${txHash}, ignorando.`);
    return;
  }

  const { route } = mirrorSwapTransactionToRoute(decoded, estimatedProfit);
  const flashLoanToken = currentBaseToken.address;
  const flashLoanAmount = decoded.amountIn.mul(102).div(100);

  const orchestrationResult = await buildDynamicOrchestration({ steps: route, flashLoanToken, flashLoanAmount });
  if (!orchestrationResult) {
    log.error("❌ Erro ao montar a orquestração.");
    return;
  }

  const profit = await simulateTokenProfit({
    provider,
    executorAddress,
    tokenAddress: flashLoanToken,
    orchestrationResult,
  });

  if (!isProfitSufficient(profit)) {
    log.warn(`⛔️ Lucro simulado insuficiente: ${ethers.utils.formatEther(profit || BigNumber.from(0))} ETH`);
    return;
  }

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

  const swapRemainingTx = await buildSwapToETHCall({
    tokenIn: flashLoanToken,
    amountIn: profit!,
    recipient: executorAddress,
  });

  const unwrapCall = buildUnwrapWETHCall({ wethAddress: WETH });

  const orchestrationTxs = [atomic, swapRemainingTx, unwrapCall];
  const bundleTxs = buildBundle(orchestrationTxs);

  if (DRY_RUN) {
    log.warn("🧪 DRY-RUN ativado: bundle não será enviado");
    bundleTxs.forEach((tx, i) => {
      log.info(`  ${i + 1}. ${JSON.stringify(tx, null, 2)}`);
    });
  } else {
    await sendBundle(bundleTxs, provider);
    log.info("✅ Bundle enviado com sucesso!");
  }
}

// --- Execução principal ---

async function main() {
  const dexList = (await getDexList()).map(addr => addr.toLowerCase());

  log.info("⏳ Aguardando novas transações via bloXroute...");

 const ws = new WebSocket(BLOXROUTE_WSS, {
  headers: {
    Authorization: `Bearer ${BLOXROUTE_AUTH_HEADER}`,
  },
});


  ws.on("open", () => {
    log.info("✅ Conectado à bloXroute");
    const subscription = {
      jsonrpc: "2.0",
      method: "subscribe",
      params: ["newTxs", { include: ["rawTx", "txHash"] }],
      id: 1,
    };
    ws.send(JSON.stringify(subscription));
  });

  ws.on("message", (data: string) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.params && parsed.params.result) {
        const txHash = parsed.params.result.txHash;
        const rawTx = parsed.params.result.rawTx;
        processTransaction(txHash, rawTx, dexList).catch(err => {
          log.error(`Erro no processamento da tx ${txHash}: ${(err as Error).message}`);
        });
      }
    } catch (err) {
      log.error("Erro ao processar mensagem bloXroute: ");
    }
  });

  ws.on("error", (err) => {
  log.error(" Conexão bloXroute fechada.", err );
});

  ws.on("error", (err) => {
    log.error("Erro na conexão bloXroute: ", err);
  });
}

main().catch(err => {
  log.error("Erro no main: ", err);
});
