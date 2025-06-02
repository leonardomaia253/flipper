import { Contract, ZeroAddress, toBigInt } from 'ethers';
import { WETH } from '../constants/addresses';
import { alchemyprovider } from "../config/provider";
import { uniswapv3Router } from '../constants/addresses';

// Uniswap V3 Factory + Pool ABI mínimo
const UNISWAP_V3_FACTORY_ADDRESS = uniswapv3Router;

const UNISWAP_V3_FACTORY_ABI = [
  'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)'
];

const UNISWAP_V3_POOL_ABI = [
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
];

const ERC20_ABI = [
  'function decimals() view returns (uint8)'
];

const DEFAULT_FEE = 3000; // 0.3%

const factoryContract = new Contract(
  UNISWAP_V3_FACTORY_ADDRESS,
  UNISWAP_V3_FACTORY_ABI,
  alchemyprovider
);

async function getTokenDecimals(tokenAddress: string): Promise<number> {
  const tokenContract = new Contract(tokenAddress, ERC20_ABI, alchemyprovider);
  const decimals: number = await tokenContract.decimals();
  return decimals;
}

export async function getEquivalentWETHAmount(tokenAddress: string, amount: bigint): Promise<bigint> {
  if (tokenAddress.toLowerCase() === WETH.toLowerCase()) {
    return amount;
  }

  const poolAddress: string = await factoryContract.getPool(tokenAddress, WETH, DEFAULT_FEE);

  if (poolAddress === ZeroAddress) {
    throw new Error(`Par token/WETH não encontrado na Uniswap V3 para fee ${DEFAULT_FEE}`);
  }

  const poolContract = new Contract(poolAddress, UNISWAP_V3_POOL_ABI, alchemyprovider);

  const slot0 = await poolContract.slot0();
  const sqrtPriceX96 = toBigInt(slot0[0]);

  const token0: string = await poolContract.token0();
  const token1: string = await poolContract.token1();

  const tokenDecimals = await getTokenDecimals(tokenAddress);
  const wethDecimals = await getTokenDecimals(WETH);

  const amountBN = toBigInt(amount);

  let price: bigint;
  let rawAmountOut: bigint;

  if (token0.toLowerCase() === tokenAddress.toLowerCase()) {
    // price = (sqrtPriceX96 ^ 2) / 2^192
    price = (sqrtPriceX96 * sqrtPriceX96) / (1n << 192n);
    rawAmountOut = amountBN * price;
  } else if (token1.toLowerCase() === tokenAddress.toLowerCase()) {
    const priceInv = (1n << 192n) / (sqrtPriceX96 * sqrtPriceX96);
    rawAmountOut = amountBN * priceInv;
  } else {
    throw new Error('Token não encontrado no pool como token0 ou token1');
  }

  // Ajusta de acordo com os decimais de token e WETH
  const decimalAdjustment = 10n ** BigInt(wethDecimals - tokenDecimals);

  const adjustedAmountOut = rawAmountOut * decimalAdjustment;

  return adjustedAmountOut;
}
