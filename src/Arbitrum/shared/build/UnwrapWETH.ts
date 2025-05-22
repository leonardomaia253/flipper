import { ethers } from "ethers";
import { EXECUTOR_CONTRACTARBITRUM } from "../../constants/contracts";

export function buildUnwrapWETHCall({ wethAddress }: { wethAddress: string }) {
  const iface = new ethers.utils.Interface([
    "function unwrapAllWETH(address weth)"
  ]);

  return {
    to: EXECUTOR_CONTRACTARBITRUM,
    data: iface.encodeFunctionData("unwrapAllWETH", [wethAddress])
  };
}