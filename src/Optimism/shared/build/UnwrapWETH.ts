import { ethers } from "ethers";
import { EXECUTOR_CONTRACTOPTIMISM } from "../../constants/contracts";

export function buildUnwrapWETHCall({ wethaddress }: { wethaddress: string }) {
  const iface = new ethers.Interface([
    "function unwrapAllWETH(address weth)"
  ]);

  return {
    to: EXECUTOR_CONTRACTOPTIMISM,
    data: iface.encodeFunctionData("unwrapAllWETH", [wethaddress])
  };
}