
import { DexType } from "../utils/types";
import { ethers } from "ethers";
/**
 * Endereços dos roteadores de DEX no Avalanche
 */
export const DEX_ROUTER: Record<DexType, string> = {
  uniswapv3: ethers.getAddress("0xbb00FF08d01D300023C629E8fFfFcb65A5a578cE"),
  lfj: ethers.getAddress("0x60aE616a2155Ee3d9A68541Ba4544862310933d4"),
  lfjv22: ethers.getAddress("0x18556DA13313f3532c54711497A8FedAC273220E"),
  lfjv21: ethers.getAddress("0xb4315e873dBcf96Ffd0acd8EA43f689D8c20fB30"),
};

/**
 * Fees padrão para DEXes
 */
export const DEX_DEFAULT_FEES: Record<DexType, number> = {
  uniswapv3: 3000, // 0.3%
  lfjv22: 3000, // 0.3%
  lfj: 3000, // 0.3%
  lfjv21: 2500,

};

/**
 * Tiers de fee disponíveis para DEXes
 */
export const DEX_FEE_TIERS: Record<DexType, number[]> = {
  uniswapv3: [100, 500, 3000, 10000], // 0.01%, 0.05%, 0.3%, 1%
  lfj: [100, 500, 3000, 10000], // 0.01%, 0.05%, 0.3%, 1%
  lfjv21: [2500], // 0.25%
  lfjv22: [1000, 3000, 5000], // 0.1%, 0.3%, 0.5%
};

// Add LENDING_PROTOCOL_addressES for the liquidation bot
export const LENDING_PROTOCOL_addressES: Record<string, string> = {
  "aave": "0x794a61358D6845594F94dc1DB02A252b5b4814aD", // Aave V3 Pool on Avalanche
  "compound": "0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B", // Compound Comptroller
  "morpho": "0x777777c9898d384f785ee44acfe945efdfaba0f3", // Morpho on Avalanche
  "venus": "0x0000000000000000000000000000000000000000", // Not on Avalanche
  "spark": "0x0d5a3c9F5B687bff791E388B9A2F1F08693aB620" // Spark on Avalanche
};
