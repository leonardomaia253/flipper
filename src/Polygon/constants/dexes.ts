
import { DexType } from "../utils/types";
import { ethers } from "ethers";

/**
 * Endereços dos roteadores de DEX no Polygon
 */
export const DEX_ROUTER: Record<DexType, string> = {
  quickswap: ethers.getAddress("0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24"),
  uniswapv3: ethers.getAddress("0xE592427A0AEce92De3Edee1F18E0157C05861564"),
  sushiswapv2: ethers.getAddress("0x1b02da8cb0d097eb8d57a175b88c7d8b47997506"),
  quickswapv3: ethers.getAddress("0xf5b509bB0909a69B1c207E495f687a596C168E12"),
};

/**
 * Fees padrão para DEXes
 */
export const DEX_DEFAULT_FEES: Record<DexType, number> = {
  quickswap: 3000, // 0.3%
  uniswapv3: 3000, // 0.3%1
  sushiswapv2: 3000, // 0.3%
  quickswapv3: 2500, // 0.25%
  
};

/**
 * Tiers de fee disponíveis para DEXes
 */
export const DEX_FEE_TIERS: Record<DexType, number[]> = {
  uniswapv3: [100, 500, 3000, 10000], // 0.01%, 0.05%, 0.3%, 1%
  quickswapv3: [100, 500, 2500, 10000], // 0.01%, 0.05%, 0.25%, 1%
  quickswap: [3000], // 0.3%
  sushiswapv2: [3000], // 0.3%
};

// Add LENDING_PROTOCOL_addressES for the liquidation bot
export const LENDING_PROTOCOL_addressES: Record<string, string> = {
  "aave": "0x794a61358D6845594F94dc1DB02A252b5b4814aD", // Aave V3 Pool on Polygon
  "compound": "0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B", // Compound Comptroller
  "morpho": "0x777777c9898d384f785ee44acfe945efdfaba0f3", // Morpho on Polygon
  "venus": "0x0000000000000000000000000000000000000000", // Not on Polygon
  "spark": "0x0d5a3c9F5B687bff791E388B9A2F1F08693aB620" // Spark on Polygon
};
