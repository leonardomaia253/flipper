import { ethers } from "ethers";
import { EXECUTOR_CONTRACTAVALANCHE } from "../../constants/contracts";

export function buildUnwrapWETHCall({ wethaddress }: { wethaddress: string }) {
  const iface = new ethers.Interface([
    "function unwrapAllWETH(address weth)"
  ]);

  return {
    to: EXECUTOR_CONTRACTAVALANCHE,
    data: iface.encodeFunctionData("unwrapAllWETH", [wethaddress])
  };
}