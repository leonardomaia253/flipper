
import { DexType } from "../utils/types";
import { ethers } from "ethers";

/**
 * Endereços dos roteadores de DEX no Base
 */
export const DEX_ROUTER: Record<DexType, string> = {
  aerodromeslipstream: ethers.getAddress("0xBE6D8f0d05cC4be24d5167a3eF062215bE6D18a5"),
  uniswapv3: ethers.getAddress("0x2626664c2603336E57B271c5C0b26F421741e481"),
  pancakeswapv3: ethers.getAddress("0x1b81D678ffb9C0263b24A97847620C99d213eB14"),
  aerodrome: ethers.getAddress("0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43"),
  uniswapv2: ethers.getAddress("0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24"),
  sushiswapv3: ethers.getAddress("0x80C7DD17B01855a6D2347444a0FCC36136a314de"),
  baseswapv3: ethers.getAddress("0x327Df1E6de05895d2ab08513aaDD9313Fe505d86"),
  alienbasev3: ethers.getAddress("0x8c1A3cF8f83074169FE5D7aD50B978e1cD6b37c7"),
};

/**
 * Fees padrão para DEXes
 */
export const DEX_DEFAULT_FEES: Record<DexType, number> = {
  uniswapv2: 3000, // 0.3%
  uniswapv3: 3000, // 0.3%
  aerodrome: 3000, // 0.3%
  sushiswapv3: 3000, // 0.3%
  pancakeswapv3: 2500, // 0.25%
  baseswapv3: 2500,
  alienbasev3: 2500,
  aerodromeslipstream: 3000, // 0.3%
};

/**
 * Tiers de fee disponíveis para DEXes
 */
export const DEX_FEE_TIERS: Record<DexType, number[]> = {
  uniswapv3: [100, 500, 3000, 10000], // 0.01%, 0.05%, 0.3%, 1%
  sushiswapv3: [100, 500, 3000, 10000], // 0.01%, 0.05%, 0.3%, 1%
  pancakeswapv3: [100, 500, 2500, 10000], // 0.01%, 0.05%, 0.25%, 1%
  uniswapv2: [3000], // 0.3%
  aerodrome: [3000], // 0.3%
  baseswapv3: [2500], // 0.25%
  aerodromeslipstream: [3000, 5000, 8000], // 0.3%, 0.5%, 0.8%
  alienbasev3: [100, 500, 3000, 10000] // 0.01%, 0.05%, 0.3%, 1% 
};

// Add LENDING_PROTOCOL_addressES for the liquidation bot
export const LENDING_PROTOCOL_addressES: Record<string, string> = {
  "aave": "0x794a61358D6845594F94dc1DB02A252b5b4814aD", // Aave V3 Pool on Base
  "compound": "0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B", // Compound Comptroller
  "morpho": "0x777777c9898d384f785ee44acfe945efdfaba0f3", // Morpho on Base
  "venus": "0x0000000000000000000000000000000000000000", // Not on Base
  "spark": "0x0d5a3c9F5B687bff791E388B9A2F1F08693aB620" // Spark on Base
};
