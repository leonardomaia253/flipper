import { ethers, BigNumberish, Contract } from "ethers";
import { findPool } from "./findPool";
import { hasSufficientLiquidity } from "./liquiditychecker";
import { POOL_ABIS } from "../constants/abis";
import { alchemysupport } from "../config/provider";
import { DexType } from "./types";
import { DEX_QUOTERS } from "../constants/addresses";

export async function estimateSwapOutput(
  tokenIn: string,
  tokenOut: string,
  amountIn: BigNumberish,
  dex: DexType,
  fee: number = 3000,
  extraParams?: any
): Promise<bigint> {

  const pool = await findPool(tokenIn, tokenOut, dex, fee).catch((e) => {
    console.error("Erro ao buscar pool:", e);
    return ethers.ZeroAddress;
  });

  if (pool === ethers.ZeroAddress) {
    console.warn(`Nenhum pool encontrado para ${dex}: ${tokenIn}/${tokenOut}`);
    return 0n;
  }

  const hasLiquidity = await hasSufficientLiquidity(pool, tokenIn, tokenOut, dex, extraParams).catch((e) => {
    console.error("Erro ao verificar liquidez:", e);
    return false;
  });

  if (!hasLiquidity) {
    console.warn(`Sem liquidez suficiente no pool ${pool} para ${dex}: ${tokenIn}/${tokenOut}`);
    return 0n;
  }

  const dexLower = dex.toLowerCase();

  function getContract(address: string, abi: any[]) {
    return new Contract(address, abi, alchemysupport);
  }

  try {
    // ======= Uniswap V2-like =======
    if (["aerodrome", "uniswapv2", "alienbasev3", "baseswapv3"].includes(dexLower)) {
      const poolContract = getContract(pool, POOL_ABIS.UNISWAP_V2);

      const [reserve0, reserve1]: [bigint, bigint] = await poolContract.getReserves();
      const token0: string = await poolContract.token0();
      const token1: string = await poolContract.token1();

      let reserveIn: bigint;
      let reserveOut: bigint;

      if (tokenIn.toLowerCase() === token0.toLowerCase()) {
        reserveIn = reserve0;
        reserveOut = reserve1;
      } else {
        reserveIn = reserve1;
        reserveOut = reserve0;
      }

      const amountInBig = BigInt(amountIn);
      const amountInWithFee = amountInBig * 997n;
      const numerator = amountInWithFee * reserveOut;
      const denominator = reserveIn * 1000n + amountInWithFee;

      return numerator / denominator;
    }

    // ======= Uniswap V3-like =======
    if (["uniswapv3", "aerodromeslipstream","sushiswapv3","uniswapv4","pancakeswapv3",].includes(dexLower)) {
      const quoterAddress = DEX_QUOTERS[dex];
      const QUOTER_ABI = [
        "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external view returns (uint256 amountOut)"
      ];

      const quoter = getContract(quoterAddress, QUOTER_ABI);

      const amountOut: bigint = await quoter.quoteExactInputSingle(
        tokenIn,
        tokenOut,
        fee,
        amountIn,
        0
      );

      return amountOut;
    }

    console.warn(`DEX ${dex} não suportado para estimativa.`);
    return 0n;

  } catch (error) {
    console.error("Erro na estimativa de swap:", error);
    return 0n;
  }
}
