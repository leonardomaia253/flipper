import { ethers, BigNumberish } from "ethers";
import { TokenInfo } from "./types";
import { getTokenPriceInEthDynamic } from "./getTokenPriceInETH";
import { PRIVATE_KEY, alchemysupport, multiprovider } from '../config/provider';

export async function getGasCostInToken({
  provider: providerInput,
  gasUnits,
  token,
}: {
  provider?: ethers.AbstractProvider;
  gasUnits: BigNumberish;
  token: TokenInfo;
}): Promise<bigint> {
  const providerInstance = alchemysupport;

  try {
    const gasPriceHex = await providerInstance.send("eth_gasPrice", []);
    const gasPrice = ethers.toBigInt(gasPriceHex);
    const gasEstimateWei = ethers.toBigInt(gasUnits) * gasPrice;

    // Se for WETH (ETH), retorna diretamente
    if (token.address.toLowerCase() === "0x4200000000000000000000000000000000000006") {
      return gasEstimateWei;
    }

    const tokenPriceInEthRaw = await getTokenPriceInEthDynamic({
      tokenSymbol: token.symbol,
      provider: providerInstance,
    });

    const tokenPriceInEth = ethers.toBigInt(tokenPriceInEthRaw);

    if (tokenPriceInEth === 0n) {
      console.warn(`Token price in ETH not found for ${token.symbol}, fallback to gasEstimateWei`);
      return gasEstimateWei;
    }

    const tokenDecimals = token.decimals;
    const scaleFactor = 10n ** BigInt(tokenDecimals);

    const result = (gasEstimateWei * scaleFactor) / tokenPriceInEth;

    return result;
  } catch (error) {
    console.error("Error calculating gas cost:", error);
    return 0n;
  }
}


/**
 * Estimate gas usage for a sequence of operations
 */
export async function estimateGasUsage(path: string[]): Promise<bigint> {
  try {
    const baseGas = 150000;
    const swapGas = 100000;
    const totalGas = baseGas + (path.length - 1) * swapGas;
    return ethers.toBigInt(totalGas);
  } catch (error) {
    console.error("Error estimating gas usage:", error);
    return 500000n;
  }
}

/**
 * Calculate ETH equivalent of gas cost
 */
export function calculateEthForGas(gasUnits: BigNumberish, gasPrice: BigNumberish): bigint {
  try {
    return ethers.toBigInt(gasUnits) * ethers.toBigInt(gasPrice);
  } catch (error) {
    console.error("Error calculating ETH for gas:", error);
    return 0n;
  }
}
