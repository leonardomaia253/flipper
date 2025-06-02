import { ethers } from "ethers";
import { multiprovider } from '../config/provider';
import { FACTORY_ABIS } from '../constants/abis';
import {DEX_FACTORY} from "../constants/addresses"
import { DexType } from "./types";

export async function findPool(
  tokenIn: string,
  tokenOut: string,
  dex: DexType,
  fee: number = 3000 // default para UniswapV3-like
): Promise<string> {
  try {
    const token0 = ethers.getAddress(tokenIn);
    const token1 = ethers.getAddress(tokenOut);
    const dexLower = dex.toLowerCase();

    function getContract(address: string, abi: any[]) {
      return new ethers.Contract(address, abi, multiprovider);
    }
    
    if (dexLower === "uniswapv3") {
      const factory = getContract(DEX_FACTORY.uniswapv3Factory, FACTORY_ABIS.UNISWAP_V3);
      const pool = await factory.getPool(token0, token1, fee);
      return pool;
    }
    
    if (dexLower === "sushiswapv3") {
            const factory = getContract(DEX_FACTORY.sushiswapv2Factory, FACTORY_ABIS.UNISWAP_V3);
      const pool = await factory.getPool(token0, token1, fee);
      return pool;
    }

    if (dexLower === "pancakeswapv3") {
            const factory = getContract(DEX_FACTORY.pancakeswapv3Factory, FACTORY_ABIS.UNISWAP_V3);
      const pool = await factory.getPool(token0, token1, fee);
      return pool;
    }

        if (dexLower === "ramsesv2") {
            const factory = getContract(DEX_FACTORY.pancakeswapv3Factory, FACTORY_ABIS.UNISWAP_V3);
      const pool = await factory.getPool(token0, token1, fee);
      return pool;
    }

        if (dexLower === "camelot") {
      const factory = getContract(DEX_FACTORY.camelotFactory, FACTORY_ABIS.UNISWAP_V2);
      const pair = await factory.getPair(token0, token1);
      return pair;
    }
    
    if (dexLower === "uniswapv2") {
      const factory = getContract(DEX_FACTORY.uniswapv2Factory, FACTORY_ABIS.UNISWAP_V2);
      const pair = await factory.getPair(token0, token1);
      return pair;
    }

    if (dexLower === "sushiswapv2") {
      const factory = getContract(DEX_FACTORY.sushiswapv2Factory, FACTORY_ABIS.UNISWAP_V2);
      const pool = await factory.getPair(token0, token1);
      return pool;
    }
    throw new Error(`DEX ${dex} não suportada para findPool.`);

  } catch (error) {
    console.error(`Erro ao buscar pool para ${dex}:`, error);
    return ethers.ZeroAddress;
  }
}
