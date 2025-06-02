import { ethers } from "ethers";
import { EXECUTOR_CONTRACTARBITRUM } from "../../constants/contracts";

export function buildUnwrapWETHCall({ wethaddress }: { wethaddress: string }) {
  const iface = new ethers.Interface([
    "function unwrapAllWETH(address weth)"
  ]);

  return {
    to: EXECUTOR_CONTRACTARBITRUM,
    data: iface.encodeFunctionData("unwrapAllWETH", [wethaddress])
  };
}