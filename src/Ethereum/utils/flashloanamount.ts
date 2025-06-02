import {uniswapv3Router} from "../../constants/addresses"
import { providersimplehttp } from "../config/provider";
import {ethers} from "ethers";
import {WETH} from "../../constants/addresses";
import {UNISWAP_V3_QUOTER_ABI} from "../../constants/addresses";


export async function getEquivalentWETHAmount(tokenIn: string, amountIn: bigint): Promise<bigint> {
  const routerAddress = uniswapv3Router;
  const routerABI = 
  const routerContract = new ethers.Contract(routerAddress, routerAbi, provider);

  const amountsOut = await routerContract.getAmountsOut(amountIn.toString(), [tokenIn, WETH]);
  // amountsOut é um array, último elemento é o valor em WETH equivalente
  return BigInt(amountsOut[1]);
}