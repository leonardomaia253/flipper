import { ethers, BigNumberish } from "ethers";
import { POOL_ABIS } from "../constants/abis";
import { alchemysupport } from "../config/provider";
import { DexType } from "./types";

export async function hasSufficientLiquidity(
  pool: string,
  tokenIn: string,
  tokenOut: string,
  dex: DexType,
  minLiquidity: BigNumberish = ethers.parseUnits("1", 18), // mínimo de 1 token
  fee: number = 3000
): Promise<boolean> {
  if (pool === ethers.ZeroAddress) {
    return false;
  }

  const dexLower = dex.toLowerCase();

  function getContract(address: string, abi: any[]) {
    return new ethers.Contract(address, abi, alchemysupport);
  }

  try {
    if (["uniswapv2", "sushiswapv2", "camelot"].includes(dexLower)) {
      const poolContract = getContract(pool, POOL_ABIS.UNISWAP_V2);
      const [reserve0, reserve1] = await poolContract.getReserves();
      const token0 = await poolContract.token0();
      const token1 = await poolContract.token1();

      const reserve = tokenIn.toLowerCase() === token0.toLowerCase() ? reserve0 : reserve1;
      return reserve >= minLiquidity;   // ✅ ALTERADO
    }

    if (["uniswapv3", "sushiswapv3", "pancakeswapv3", "ramsesv2"].includes(dexLower)) {
      const poolContract = getContract(pool, POOL_ABIS.UNISWAP_V3);
      const liquidity = await poolContract.liquidity();
      return liquidity > 0n;   // ✅ BigInt comparação
    }

    return false;

  } catch (error) {
    console.error(`Erro ao verificar liquidez do pool ${pool}:`, error);
    return false;
  }
}
