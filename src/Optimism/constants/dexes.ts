
import { DexType } from "../utils/types";
import { ethers } from "ethers";

/**
 * Endereços dos roteadores de DEX no Optimism
 */
export const DEX_ROUTER: Record<DexType, string> = {
  uniswapv3: ethers.getAddress("0xE592427A0AEce92De3Edee1F18E0157C05861564"),
  velodromefinancev2: ethers.getAddress("0xa062aE8A9c5e11aaA026fc2670B0D65cCc8B2858"),
  velodromeslipstream: ethers.getAddress("0x0792a633F0c19c351081CF4B211F68F79bCc9676"),
  solidlyv3: ethers.getAddress("0x77784f96C936042A3ADB1dD29C91a55EB2A4219f"),
};

/**
 * Fees padrão para DEXes
 */
export const DEX_DEFAULT_FEES: Record<DexType, number> = {
  uniswapv3: 3000, // 0.3%
  velodromeslipstream: 2500,
  solidlyv3: 2500,
  velodromefinancev2: 3000, // 0.3%
};

/**
 * Tiers de fee disponíveis para DEXes
 */
export const DEX_FEE_TIERS: Record<DexType, number[]> = {
  uniswapv3: [100, 500, 3000, 10000], // 0.01%, 0.05%, 0.3%, 1%
  velodromeslipstream: [2500], // 0.25%
  velodromefinancev2: [3000, 5000, 8000], // 0.3%, 0.5%, 0.8%
  solidlyv3: [100, 500, 3000, 10000] // 0.01%, 0.05%, 0.3%, 1% 
};

// Add LENDING_PROTOCOL_addressES for the liquidation bot
export const LENDING_PROTOCOL_addressES: Record<string, string> = {
  "aave": "0x794a61358D6845594F94dc1DB02A252b5b4814aD", // Aave V3 Pool on Optimism
  "compound": "0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B", // Compound Comptroller
  "morpho": "0x777777c9898d384f785ee44acfe945efdfaba0f3", // Morpho on Optimism
  "venus": "0x0000000000000000000000000000000000000000", // Not on Optimism
  "spark": "0x0d5a3c9F5B687bff791E388B9A2F1F08693aB620" // Spark on Optimism
};
