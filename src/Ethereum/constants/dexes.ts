
import { DexType } from "../utils/types";
import { ethers } from "ethers";

/**
 * Endereços dos roteadores de DEX no Ethererum
 */
export const DEX_ROUTER: Record<DexType, string> = {
  uniswapv2: ethers.getAddress("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"),
  uniswapv3: ethers.getAddress("0xE592427A0AEce92De3Edee1F18E0157C05861564"),
  sushiswapv3: ethers.getAddress("0xAC4c6e212A361c968F1725b4d055b47E63F80b75"),
  sushiswapv2: ethers.getAddress("0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F"),
};

/**
 * Fees padrão para DEXes
 */
export const DEX_DEFAULT_FEES: Record<DexType, number> = {
  uniswapv2: 3000, // 0.3%
  uniswapv3: 3000, // 0.3%
  sushiswapv2: 3000, // 0.3%
  sushiswapv3: 3000, // 0.3%
  
};

/**
 * Tiers de fee disponíveis para DEXes
 */
export const DEX_FEE_TIERS: Record<DexType, number[]> = {
  uniswapv3: [100, 500, 3000, 10000], // 0.01%, 0.05%, 0.3%, 1%
  sushiswapv3: [100, 500, 3000, 10000], // 0.01%, 0.05%, 0.3%, 1%
  sushiswapv2: [3000], // 0.3%
  uniswapv2: [3000], // 0.3%

};

// Add LENDING_PROTOCOL_addressES for the liquidation bot
export const LENDING_PROTOCOL_addressES: Record<string, string> = {
  "aave": "0x794a61358D6845594F94dc1DB02A252b5b4814aD", // Aave V3 Pool on Ethererum
  "compound": "0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B", // Compound Comptroller
  "morpho": "0x777777c9898d384f785ee44acfe945efdfaba0f3", // Morpho on Ethererum
  "venus": "0x0000000000000000000000000000000000000000", // Not on Ethererum
  "spark": "0x0d5a3c9F5B687bff791E388B9A2F1F08693aB620" // Spark on Ethererum
};
