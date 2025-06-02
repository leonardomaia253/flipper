import { ethers, BigNumberish } from "ethers";
import { findPool } from "./findPool";
import { hasSufficientLiquidity } from "./liquiditychecker";
import { POOL_ABIS } from "../constants/abis";
import { multiprovider } from "../config/provider";
import { DexType } from "./types";
import { DEX_QUOTERS } from "../constants/addresses";

export async function estimateSwapOutput(
  tokenIn: string,
  tokenOut: string,
  amountIn: BigNumberish,
  dex: DexType,
  fee: number = 3000,
  extraParams?: any // para Uniswap V4 ou outros casos
): Promise<BigNumberish> {
  const pool = await findPool(tokenIn, tokenOut, dex, fee);

  if (pool === ethers.ZeroAddress) {
    console.warn(`Nenhum pool encontrado para ${dex}: ${tokenIn}/${tokenOut}`);
    return ethers.toBigInt(0);
  }

  const hasLiquidity = await hasSufficientLiquidity(pool, tokenIn, tokenOut, dex, extraParams);
  if (!hasLiquidity) {
    console.warn(`Sem liquidez suficiente no pool ${pool} para ${dex}: ${tokenIn}/${tokenOut}`);
    return ethers.toBigInt(0);
  }

  const dexLower = dex.toLowerCase();

  function getContract(address: string, abi: any[]) {
    return new ethers.Contract(address, abi, multiprovider);
  }

  try {
    // ======================== Uniswap V2-like ========================
    if (["uniswapv2", "sushiswapv2", "camelot"].includes(dexLower)) {
      const poolContract = getContract(pool, POOL_ABIS.UNISWAP_V2);

      let reserve0: bigint;
      let reserve1: bigint;
      let token0: string;
      let token1: string;

      try {
        [reserve0, reserve1] = await poolContract.getReserves();
      } catch (e) {
        console.error(`Erro ao buscar reservas do pool ${pool} em ${dex}:`, e);
        return ethers.toBigInt(0);
      }

      try {
        token0 = await poolContract.token0();
      } catch (e) {
        console.error(`Erro ao buscar token0 do pool ${pool} em ${dex}:`, e);
        return ethers.toBigInt(0);
      }

      try {
        token1 = await poolContract.token1();
      } catch (e) {
        console.error(`Erro ao buscar token1 do pool ${pool} em ${dex}:`, e);
        return ethers.toBigInt(0);
      }

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

    // ======================== Uniswap V3-like ========================
    if (["uniswapv3", "sushiswapv3", "pancakeswapv3", "ramsesv2"].includes(dexLower)) {
      const quoteraddress = DEX_QUOTERS[dex];
      const QUOTER_ABI = [
        "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)"
      ];

      const quoter = getContract(quoteraddress, QUOTER_ABI);

      try {
        const amountOut = await quoter.quoteExactInputSingle(
          tokenIn,
          tokenOut,
          fee,
          amountIn,
          0
        );
        return ethers.toBigInt(amountOut);
      } catch (e) {
        console.error(`Erro ao chamar quoteExactInputSingle para ${dex}:`, e);
        return ethers.toBigInt(0);
      }
    }

    console.warn(`DEX ${dex} não suportado ainda na estimateSwapOutput`);
    return ethers.toBigInt(0);
  } catch (error) {
    console.error(`Erro geral ao estimar swap para ${dex}:`, error);
    return ethers.toBigInt(0);
  }
}
