// utils/pancakeQuoter.ts
import { Contract } from 'ethers';
import { provider } from '../../config/provider';
import { BigNumber } from 'ethers';
import { pancakeswapv3Quoter2 } from '../../constants/addresses';

const PANCAKE_QUOTER_ADDRESS = pancakeswapv3Quoter2; // PancakeSwap V3 Quoter

const PANCAKE_QUOTER_ABI = [
  'function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)'
];

export const pancakeQuoter = new Contract(
  PANCAKE_QUOTER_ADDRESS,
  PANCAKE_QUOTER_ABI,
  provider
);

export async function getQuotePancakeSwapV3(from: string, to: string, amountIn: BigNumber): Promise<BigNumber> {
  try {
    // Fee tier comum 3000 = 0.3%
    return await pancakeQuoter.quoteExactInputSingle(from, to, 3000, amountIn, 0);
  } catch {
    return BigNumber.from(0);
  }
}