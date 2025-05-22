import { ethers } from "ethers";
import axios from "axios";
import WebSocket from "ws";
import { JsonRpcProvider } from "@ethersproject/providers";
import * as dotenv from "dotenv";
import * as path from "path";




dotenv.config({ path: path.resolve(__dirname, "../../Arbitrum/.env") });


console.log("BLOXROUTE_AUTH_HEADER:", process.env.BLOXROUTE_AUTH_HEADER);
console.log("BLOXROUTE_HTTP_RELAY:", process.env.BLOXROUTE_HTTP_RELAY);
console.log("BLOXROUTE_WS_RELAY:", process.env.BLOXROUTE_WS_RELAY);
console.log("MEV_SHARE_URL:", process.env.MEV_SHARE_URL);

const BLOXROUTE_AUTH_HEADER = process.env.BLOXROUTE_AUTH_HEADER!;
const BLOXROUTE_HTTP_RELAY = process.env.BLOXROUTE_HTTP_RELAY!;
const BLOXROUTE_WS_RELAY = process.env.BLOXROUTE_WS_RELAY!;
const MEV_SHARE_URL = process.env.MEV_SHARE_URL!;

const BRIBE_GWEI = Number(process.env.BRIBE_GWEI || 1);
const GAS_MULTIPLIER = Number(process.env.GAS_MULTIPLIER || 1.2);

let ws: WebSocket | null = null;

async function ensureWebSocket(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (ws && ws.readyState === WebSocket.OPEN) return resolve();

    ws = new WebSocket(BLOXROUTE_WS_RELAY, {
      headers: {
        Authorization: BLOXROUTE_AUTH_HEADER,
      },
    });

    ws.on("open", () => {
      console.log("🔌 WebSocket bloXroute conectado.");
      resolve();
    });

    ws.on("error", (err) => {
      console.error("❌ Erro WebSocket:", err);
      reject(err);
    });
  });
}

function getBlockHex(block: number): string {
  return `0x${block.toString(16)}`;
}

async function getDynamicGasFees(
  provider: JsonRpcProvider,
  bribeGwei: number = BRIBE_GWEI,
  multiplier: number = GAS_MULTIPLIER
): Promise<{ maxFeePerGas: ethers.BigNumber; maxPriorityFeePerGas: ethers.BigNumber }> {
  const feeData = await provider.getFeeData();
  const baseFee = feeData.maxFeePerGas || feeData.gasPrice || ethers.utils.parseUnits("2", "gwei");
  const maxFeePerGas = baseFee.mul(Math.floor(multiplier * 100)).div(100);
  const maxPriorityFeePerGas = ethers.utils.parseUnits(bribeGwei.toString(), "gwei");

  return { maxFeePerGas, maxPriorityFeePerGas };
}

export async function sendBundle(
  bundleTransactions: Array<{ signer: ethers.Signer; transaction: any }>,
  provider: JsonRpcProvider,
  dryRun: boolean = false
): Promise<{ success: boolean; error: any | null }> {
  try {
    const signedTxs: string[] = [];

    for (const { signer, transaction } of bundleTransactions) {
      if ("raw" in transaction) {
        signedTxs.push(transaction.raw);
      } else {
        const nonce = await signer.getTransactionCount("latest");
        const gasLimit = transaction.gasLimit || 1_000_000;

        const { maxFeePerGas, maxPriorityFeePerGas } = await getDynamicGasFees(provider);

        const tx = await signer.populateTransaction({
          ...transaction,
          nonce,
          gasLimit,
          maxFeePerGas: transaction.maxFeePerGas || maxFeePerGas,
          maxPriorityFeePerGas: transaction.maxPriorityFeePerGas || maxPriorityFeePerGas,
        });

        const signedTx = await signer.signTransaction(tx);
        signedTxs.push(signedTx);
      }
    }

    const currentBlock = await provider.getBlockNumber();
    const nextBlock = currentBlock + 1;
    const blockHex = getBlockHex(nextBlock);

    const bundleParams = {
      transactions: signedTxs,
      block_number: blockHex,
      min_timestamp: 0,
      max_timestamp: 0,
      reverting_tx_hashes: [],
    };

    if (dryRun) {
      console.log("🧪 Dry-run: bundle preparado:");
      console.log("Bloco:", blockHex);
      console.log("TXs:", signedTxs.map((tx) => ethers.utils.keccak256(tx)));
      return { success: true, error: null };
    }

    await ensureWebSocket();

    ws!.send(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 42161,
        method: "blxr_submit_bundle",
        params: [bundleParams],
      })
    );
    console.log("📡 Enviado via WebSocket bloXroute");

    await axios.post(
      `${BLOXROUTE_HTTP_RELAY}/blxr_submit_bundle`,
      {
        jsonrpc: "2.0",
        id: Date.now(),
        method: "blxr_submit_bundle",
        params: [bundleParams],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: BLOXROUTE_AUTH_HEADER,
        },
      }
    );
    console.log("🌐 Enviado via HTTP bloXroute");

    await axios.post(
      MEV_SHARE_URL,
      {
        jsonrpc: "2.0",
        id: 42161,
        method: "eth_sendBundle",
        params: [
          {
            txs: signedTxs,
            blockNumber: blockHex,
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log("🚀 Enviado via Flashbots MEV-Share");

    console.log("✅ Bundle enviado com sucesso para o bloco:", blockHex);
    return { success: true, error: null };
  } catch (error) {
    console.error("❌ Erro ao enviar bundle:", error);
    return { success: false, error };
  }
}
