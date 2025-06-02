import { DEX_ROUTER } from "../constants/addresses";
import { DexType } from "./types";

export function normalizeDex(dex: string): DexType {
  const lowerDex = dex.toLowerCase();
  const validDexes: DexType[] = [
    "uniswapv3",
    "velodromefinancev2",
    "velodromeslipstream",
    "solidlyv3",
  ];
  if (validDexes.includes(lowerDex as DexType)) {
    return lowerDex as DexType;
  }
  throw new Error(`Invalid DEX type: ${dex}`);
}

// Uso no seu código
