import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "./Arbitrum/.env") });

const EXECUTOR_CONTRACTS = {
  arbitrum: "0x93e0dB7520b85632e0Fc0e21d5d33D89d8eE9D5f",
  avalanche: "0xBb26ebC5274b36C8c5DF2b2176849E008D6d2636",
  base: "0x54bd990AB55367F3eA1648702c833eF33Da3Ba5D",
  binance: "0x54bd990AB55367F3eA1648702c833eF33Da3Ba5D",
  ethereum: "0x54bd990AB55367F3eA1648702c833eF33Da3Ba5D",
  optimism: "0xBb26ebC5274b36C8c5DF2b2176849E008D6d2636",
  polygon: "0x54bd990AB55367F3eA1648702c833eF33Da3Ba5D"
};

const NETWORKS = {
  arbitrum: "https://arb1.arbitrum.io/rpc",
  avalanche: "https://api.avax.network/ext/bc/C/rpc",
  base: "https://mainnet.base.org",
  binance: "https://bsc-dataseed.binance.org/",
  ethereum: "https://rpc.ankr.com/eth", // Substitua pelo seu RPC confiável
  optimism: "https://mainnet.optimism.io",
  polygon: "https://polygon-rpc.com"
};

const MIN_WITHDRAW = ethers.parseEther("0.02");
const MY_ADDRESS = "0x584AedBeae2B564F29a6955cfFf54BcE92BA3268";
const DESTINATION_ADDRESS = "0xfc45C430E27d57c1063fEc9A02aB3eF4e231E18d";

const PRIVATE_KEY = process.env.PRIVATE_KEY as string;

async function monitorAndWithdraw(network: keyof typeof NETWORKS, contractAddress: string, rpcUrl: string) {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log(`🔗 Monitoring ${network}...`);

  while (true) {
    try {
      const balance = await provider.getBalance(contractAddress);

      console.log(`[${network}] Contract balance: ${ethers.formatEther(balance)} ETH`);

      if (balance >= MIN_WITHDRAW) {
        console.log(`[${network}] ➡️ Balance >= 0.05 ETH, withdrawing...`);

        const tx = await wallet.sendTransaction({
          to: DESTINATION_ADDRESS,
          value: balance,
          gasLimit: 21000
        });

        console.log(`[${network}] ✅ Withdrawal TX sent: ${tx.hash}`);
      }
    } catch (err) {
      console.error(`[${network}] ❌ Error:`, err);
    }

    await new Promise((resolve) => setTimeout(resolve, 30_000)); // aguarda 30s
  }
}

async function main() {
  const tasks = Object.entries(EXECUTOR_CONTRACTS).map(([network, contractAddress]) => {
    const rpcUrl = NETWORKS[network as keyof typeof NETWORKS];
    if (!contractAddress || !rpcUrl) {
      console.warn(`⚠️ Skipping ${network} due to missing config.`);
      return;
    }
    monitorAndWithdraw(network as keyof typeof NETWORKS, contractAddress, rpcUrl);
  });

  await Promise.all(tasks);
}

main().catch(console.error);
