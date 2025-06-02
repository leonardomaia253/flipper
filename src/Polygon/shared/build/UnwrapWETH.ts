import { ethers } from "ethers";
import { EXECUTOR_CONTRACTPOLYGON } from "../../constants/contracts";

export function buildUnwrapWETHCall({ wethaddress }: { wethaddress: string }) {
  const iface = new ethers.Interface([
    "function unwrapAllWETH(address weth)"
  ]);

  return {
    to: EXECUTOR_CONTRACTPOLYGON,
    data: iface.encodeFunctionData("unwrapAllWETH", [wethaddress])
  };
}