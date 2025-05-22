import { DEX_ROUTER } from "../constants/addresses";
import { DexType } from "./types";

export function normalizeDex(dex: string): DexType {
  const lowerDex = dex.toLowerCase();
  const validDexes: DexType[] = [
    "uniswapv2",
    "uniswapv3",
    "sushiswapv3",
    "uniswapv4",
    "camelot",
    "maverickv2",
    "curve",
    "sushiswapv2",
    "pancakeswapv3",
    "ramsesv2",
  ];
  if (validDexes.includes(lowerDex as DexType)) {
    return lowerDex as DexType;
  }
  throw new Error(`Invalid DEX type: ${dex}`);
}

// Uso no seu código
