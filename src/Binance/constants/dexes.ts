
import { DexType } from "../utils/types";
import { ethers } from "ethers";

/**
 * Endereços dos roteadores de DEX no Base
 */
//Dex-Use-map DE ROUTERS
export const DEX_ROUTER: Record<DexType, string> = {
  uniswapv2: ethers.getAddress("0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24"),
  pancakeswapv2: ethers.getAddress("0x10ED43C718714eb63d5aA57B78B54704E256024E"),
  nomiswap: ethers.getAddress("0x596f619600da38ace164c9facee730c6dbe83c86"),
  pancakeswapv3: ethers.getAddress("0x1A0A18AC4BECDDbd6389559687d1A73d8927E416"),
  uniswapv3: ethers.getAddress("0xB971eF87ede563556b2ED4b1C0b0019111Dd85d2"),
};


/**
 * Fees padrão para DEXes
 */
export const DEX_DEFAULT_FEES: Record<DexType, number> = {
  uniswapv2: 3000, // 0.3%
  uniswapv3: 3000, // 0.3%
  pancakeswapv2: 2500, // 0.25%
  pancakeswapv3: 3000, // 0.3%
  nomiswap: 3000,
};

/**
 * Tiers de fee disponíveis para DEXes
 */
export const DEX_FEE_TIERS: Record<DexType, number[]> = {
  uniswapv3: [100, 500, 3000, 10000], // 0.01%, 0.05%, 0.3%, 1%
  pancakeswapv3: [100, 500, 2500, 10000], // 0.01%, 0.05%, 0.25%, 1%
  uniswapv2: [3000], // 0.3%
  pancakeswapv2: [2500], // 0.25%
  nomiswap: [3000],

};

// Add LENDING_PROTOCOL_addressES for the liquidation bot
export const LENDING_PROTOCOL_addressES: Record<string, string> = {
  "aave": "0x794a61358D6845594F94dc1DB02A252b5b4814aD", // Aave V3 Pool on Base
  "compound": "0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B", // Compound Comptroller
  "morpho": "0x777777c9898d384f785ee44acfe945efdfaba0f3", // Morpho on Base
  "venus": "0x0000000000000000000000000000000000000000", // Not on Base
  "spark": "0x0d5a3c9F5B687bff791E388B9A2F1F08693aB620" // Spark on Base
};
