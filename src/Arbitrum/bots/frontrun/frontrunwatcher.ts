import { ethers, BigNumber } from "ethers";
import { getDexList } from "../../utils/dexList";
import { getPriceImpactAndProfit } from "../../utils/getPriceImpactAndProfit";
import { enhancedLogger as log } from "../../utils/enhancedLogger";
import { decodeSwap } from "../../utils/decodeSwap";
import { buildFrontrunBundlelongo, buildFrontrunBundlecurto } from "./frontrunbuilder";
import { selectFlashloanToken } from "../../utils/flashloanamount";
import { executorAddress } from "../../constants/addresses";
import { simulateTokenProfit } from "../../simulation/simulate";
import { buildSwapToETHCall } from "../../shared/build/buildSwapResidual";
import { buildUnwrapWETHCall } from "../../shared/build/UnwrapWETH";
import { getWETHBalance } from "../../shared/build/BalanceOf";
import { sendBundle } from "../../executor/sendBundle";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const WEBSOCKET_RPC_URL = process.env.WEBSOCKET_RPC_URL!;
const DRY_RUN = process.env.DRY_RUN === "true";

if (!WEBSOCKET_RPC_URL) throw new Error("Missing WEBSOCKET_RPC_URL in .env");

function getDefaultSigner() {
  const provider = new ethers.providers.WebSocketProvider(WEBSOCKET_RPC_URL);
  const privateKey = process.env.PRIVATE_KEY!;
  if (!privateKey) throw new Error("PRIVATE_KEY não definida no .env");
  return new ethers.Wallet(privateKey, provider);
}

const provider = new ethers.providers.WebSocketProvider(WEBSOCKET_RPC_URL);
const signer = getDefaultSigner();

const processedTxs = new Set<string>();
const MAX_CACHE_SIZE = 10_000;

const dexList = await getDexList();
const DEX_ROUTER_ADDRESSES = dexList.map(addr => addr.toLowerCase());

log.info("⏳ Aguardando novas transações na mempool...");

provider.on("pending", async (txHash: string) => {
  try {
    if (processedTxs.has(txHash)) return;
    processedTxs.add(txHash);

    if (processedTxs.size > MAX_CACHE_SIZE) {
      const firstValue = processedTxs.values().next().value;
      if (firstValue !== undefined) {
        processedTxs.delete(firstValue);
      }
    }

    const tx = await provider.getTransaction(txHash);
    if (!tx) return;

    const priceImpactProfit = await getPriceImpactAndProfit(tx);
    if (!priceImpactProfit) return;

    const { priceImpact, estimatedProfit } = priceImpactProfit;

    if (estimatedProfit.lte(ethers.utils.parseEther("0.01"))) return;

    const to = tx.to ? tx.to.toLowerCase() : "unknown";

    log.info("🚀 Oportunidade detectada:");
    log.info(`  Tx: ${txHash}`);
    log.info(`  DEX: ${to}`);
    log.info(`  Impacto: ${priceImpact.toFixed(2)}%`);
    log.info(`  Lucro potencial: ${ethers.utils.formatEther(estimatedProfit)} ETH`);

    const decoded = await decodeSwap(tx);

    const flashloanData = await selectFlashloanToken(decoded);
    if (!flashloanData) return;

    const { flashLoanToken, flashLoanAmount } = flashloanData;

    const orchestrateResult =
      flashLoanToken.toLowerCase() === decoded.tokenIn.toLowerCase()
        ? await buildFrontrunBundlecurto(decoded)
        : await buildFrontrunBundlelongo({
      ...decoded,
      recipient: decoded.recipient ?? "",
      flashLoanToken,
      flashLoanAmount,
      dex: decoded.dex!, // assert dex is defined to satisfy type
    });

    const calls = Array.isArray(orchestrateResult) ? orchestrateResult : [orchestrateResult];
    const profit = await simulateTokenProfit({
      provider,
      executorAddress,
      tokenAddress: flashLoanToken,
      calls,
    });

    const MIN_PROFIT = ethers.utils.parseEther(process.env.MIN_PROFIT || "0.005");

    if (!profit || profit.lte(MIN_PROFIT)) {
      log.warn(`⛔️ Lucro simulado insuficiente ou nulo: ${ethers.utils.formatEther(profit || 0)} ETH`);
      return;
    }

    const recipient = decoded.recipient ?? "";
    if (!recipient) {
      log.warn("Recipient is undefined or null, aborting transaction processing.");
      return;
    }
    const SwapRemainingtx = await buildSwapToETHCall({
      tokenIn: flashLoanToken,
      amountIn: profit,
      recipient,
    });

    const wethBalanceRaw = await getWETHBalance({ provider });
    const wethBalance = ethers.BigNumber.isBigNumber(wethBalanceRaw)
      ? wethBalanceRaw
      : ethers.utils.parseEther(wethBalanceRaw);

    const unwrapCall = buildUnwrapWETHCall({ amount: wethBalance });

    const bundleTxs = [...calls, SwapRemainingtx, unwrapCall];

    if (DRY_RUN) {
      log.warn("🧪 DRY-RUN ativado: bundle não será enviado");
      log.info("Bundle composto por:");
      bundleTxs.forEach((tx, i) => {
        log.info(`  ${i + 1}. ${JSON.stringify(tx, null, 2)}`);
      });
    } else {
      await sendBundle(bundleTxs, provider);
      log.info("✅ Bundle enviado com sucesso!");
    }
  } catch (err) {
    log.error(`Erro no processamento da tx ${txHash}: ${(err as Error).message}`);
  }
});
