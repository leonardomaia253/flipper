// utils/ramsesRouter.ts
import { Contract, BigNumber } from 'ethers';
import { provider } from '../../config/provider';
import { UNISWAP_V2_ROUTER_ABI } from '../../constants/abis';
import { ramsesv2Router } from '../../constants/addresses';

// Endereço do roteador Ramses V2
const RAMSES_ROUTER_ADDRESS = ramsesv2Router;

export const ramsesRouter = new Contract(
  RAMSES_ROUTER_ADDRESS,
  UNISWAP_V2_ROUTER_ABI,
  provider
);

export async function getQuoteRamsesV2(from: string, to: string, amountIn: BigNumber): Promise<BigNumber> {
  try {
    const amounts = await ramsesRouter.getAmountsOut(amountIn, [from, to]);
    return amounts[1];
  } catch {
    return BigNumber.from(0);
  }
}