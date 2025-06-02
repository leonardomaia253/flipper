import { ethers } from "ethers";
import { WAVAX } from "../../constants/addresses";
import { uniswapv3Router } from "../../constants/addresses";

export function buildSwapToETHCall({
  tokenIn,
  amountIn,
  recipient
}: {
  tokenIn: string;
  amountIn: string;
  recipient: string;
}) {

  const router = uniswapv3Router; // Uniswap V3 router
  const fee = 3000; // 0.3%
  const deadline = Math.floor(Date.now() / 1000) + 60 * 5;

  const abi = [
    "function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96))"
  ];

  const iface = new ethers.Interface(abi);

  const data = iface.encodeFunctionData("exactInputSingle", [{
    tokenIn,
    tokenOut: WAVAX,
    fee,
    recipient,
    deadline,
    amountIn,
    amountOutMinimum:0,
    sqrtPriceLimitX96: 0
  }]);

  return {
    to: router,
    data
  };
}
