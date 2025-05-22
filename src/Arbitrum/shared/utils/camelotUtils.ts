// utils/camelotUtils.ts
import { Contract, BigNumber } from 'ethers';
import { provider } from '../../config/provider';
import { camelotRouter } from '../../constants/addresses';


export const CAMELOT_ROUTER_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" }
    ],
    name: "getAmountsOut",
    outputs: [
      { internalType: "uint256[]", name: "amounts", type: "uint256[]" }
    ],
    stateMutability: "view",
    type: "function"
  }
];

export const camelot = new Contract(
  camelotRouter,
  CAMELOT_ROUTER_ABI,
  provider
) as Contract & {
  getAmountsOut(amountIn: BigNumber, path: string[]): Promise<BigNumber[]>;
};

export async function getQuoteCamelot(from: string, to: string, amountIn: BigNumber): Promise<BigNumber> {
  try {
    const amounts = await camelot.getAmountsOut(amountIn, [from, to]);
    return amounts[1];
  } catch {
    return BigNumber.from(0);
  }
}


