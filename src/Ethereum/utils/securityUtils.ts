import { AbiCoder, keccak256, formatUnits } from "ethers";
import { JsonRpcProvider, WebSocketProvider, Provider } from "ethers";
import { BigNumberish } from "ethers";
import { CircuitBreaker, handleError } from "./errorHandler";
import { LRUCache } from "lru-cache";

const recentTxCache = new LRUCache<string, boolean>({ max: 1000, ttl: 5 * 60 * 1000 });
const blockPriceCache = new LRUCache<number, { gasPrice: BigNumberish; baseFee?: BigNumberish; timestamp: number }>({
  max: 100,
  ttl: 10 * 60 * 1000
});

const priceCircuitBreaker = new CircuitBreaker(3, 300000, "security");
const gasCircuitBreaker = new CircuitBreaker(3, 180000, "security");

export async function validateTransaction(
  provider: Provider,
  to: string,
  data: string,
  value: BigNumberish = 0,
  maxGasPrice = 100,
  maxGas = 3000000
): Promise<{ valid: boolean; reason?: string; gasPrice?: BigNumberish; gasEstimate?: BigNumberish }> {
  try {
    const abiCoder = new AbiCoder();
    const encoded = abiCoder.encode(["address", "bytes", "uint256"], [to, data, value]);
    const txKey = keccak256(encoded);

    if (recentTxCache.has(txKey)) {
      return { valid: false, reason: "Duplicate transaction detected" };
    }

    const feeData = await priceCircuitBreaker.execute(() => provider.getFeeData(), "getFeeData");
    const gasPrice = feeData.gasPrice;

     if (!gasPrice) {
    return { valid: false, reason: "No gas price available from provider" };
    }
    const gasPriceGwei = parseFloat(formatUnits(gasPrice, "gwei"));

    if (gasPriceGwei > maxGasPrice) {
      return { valid: false, reason: `Gas price too high: ${gasPriceGwei} > ${maxGasPrice} gwei`, gasPrice };
    }

    const latestBlock = await provider.getBlockNumber();
    const previousBlockData = blockPriceCache.get(latestBlock - 1);

    if (previousBlockData) {
      const previousGasGwei = parseFloat(formatUnits(previousBlockData.gasPrice, "gwei"));
      if (gasPriceGwei > previousGasGwei * 1.5) {
        console.warn(`⚠️ Gas price spike: ${previousGasGwei} → ${gasPriceGwei} gwei`);
      }
    }

    blockPriceCache.set(latestBlock, { gasPrice, timestamp: Date.now() });

    const gasEstimate = await gasCircuitBreaker.execute(() => provider.estimateGas({ to, data, value }), "estimateGas");

    if (gasEstimate > BigInt(maxGas)) {
      return { valid: false, reason: `Gas estimate too high: ${gasEstimate} > ${maxGas}`, gasEstimate };
    }

    recentTxCache.set(txKey, true);

    return { valid: true, gasPrice, gasEstimate };
  } catch (error) {
    console.error("Error validating transaction:", error);
    return { valid: false, reason: error instanceof Error ? error.message : String(error) };
  }
}

export function createBackupProviders(urls: string[]): Provider[] {
  return urls.map(url => url.startsWith("ws") ? new WebSocketProvider(url) : new JsonRpcProvider(url));
}

export async function tryWithFallback<T>(
  providers: Provider[],
  action: (provider: Provider) => Promise<T>
): Promise<T> {
  for (const provider of providers) {
    try {
      return await action(provider);
    } catch (error) {
      console.warn(`Provider ${provider} failed, trying next...`, error);
    }
  }
  throw new Error("All providers failed.");
}

export async function getSafeGasPrice(providers: Provider[], maxGasPrice = 100): Promise<BigNumberish> {
  return tryWithFallback(providers, async provider => {
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice;

    if (!gasPrice) {
      throw new Error("No gas price available from provider");
    }
    const gasPriceGwei = parseFloat(formatUnits(gasPrice, "gwei"));
    if (gasPriceGwei > maxGasPrice) {
      throw new Error(`Gas price too high: ${gasPriceGwei} gwei`);
    }
    return gasPrice;
  });
}

export async function getSafeNonce(provider: Provider, address: string): Promise<number> {
  return provider.getTransactionCount(address, "latest");
}

export async function validateGasEstimates(
  provider: Provider,
  to: string,
  data: string,
  value: BigNumberish = 0,
  maxGas = 3000000
): Promise<{ valid: boolean; reason?: string; gasEstimate?: BigNumberish }> {
  try {
    const gasEstimate = await provider.estimateGas({ to, data, value });

    if (gasEstimate > BigInt(maxGas)) {
      return { valid: false, reason: `Gas estimate too high: ${gasEstimate} > ${maxGas}`, gasEstimate };
    }

    return { valid: true, gasEstimate };
  } catch (error) {
    console.error("Error estimating gas:", error);
    return { valid: false, reason: error instanceof Error ? error.message : String(error) };
  }
}
