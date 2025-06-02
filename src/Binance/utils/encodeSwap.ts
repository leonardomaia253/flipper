import { DexSwap, BuiltSwapCall } from "./types";
import { ethers,BigNumberish } from "ethers";
import {uniswapv3Router,uniswapv2Router,pancakeswapv3Router,pancakeswapv2Router, nomiswapRouter} from "../constants/addresses";
import { EXECUTOR_CONTRACTBASE } from "../constants/contracts";
import { multiprovider } from "../config/provider";
import * as dotenv from "dotenv";
import * as path from "path";


dotenv.config({ path: path.resolve(__dirname, "../../.env") });
/// Uniswap V2 / Sushiswap V2 / Camelot (mesma ABI)


const UNISWAP_V2_ROUTER_ABI = [
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline) external returns (uint[] amounts)",
  "function swapTokensForExactTokens(uint amountOut, uint amountInMax, address[] path, address to, uint deadline) external returns (uint[] amounts)",
  "function swapExactETHForTokens(uint amountOutMin, address[] path, address to, uint deadline) external payable returns (uint[] amounts)",
  "function swapTokensForExactETH(uint amountOut, uint amountInMax, address[] path, address to, uint deadline) external returns (uint[] amounts)",
  "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline) external returns (uint[] amounts)",
  "function swapETHForExactTokens(uint amountOut, address[] path, address to, uint deadline) external payable returns (uint[] amounts)"
];

const UNISWAP_V3_ROUTER_ABI = [
  "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)",
  "function exactInput((bytes path, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum)) external payable returns (uint256 amountOut)",
  "function exactOutputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountIn)",
  "function exactOutput((bytes path, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum)) external payable returns (uint256 amountIn)"
];

const CURVE_ROUTER_ABI = [
  "function exchange(int128 i, int128 j, uint256 dx, uint256 min_dy) external returns (uint256)",
  "function exchange_underlying(int128 i, int128 j, uint256 dx, uint256 min_dy) external returns (uint256)"
];

const MAVERICK_V2_ROUTER_ABI = [
  "function swap((address tokenIn,address tokenOut,uint256 amountIn,uint256 amountOutMinimum,uint160 limitSqrtPrice,uint256 deadline)) external payable returns ((uint256 amountOut,uint256 amountIn))"
];

const UNISWAP_V4_ROUTER_ABI = [
  "function swap(address recipient, (address,uint24,address,uint24,address,uint24), (bool,uint256,uint256,uint160)) external returns (int256 amount0, int256 amount1)"
];

const CAMELOT_ROUTER_ABI = [
  "function swapExactTokensForTokens(uint amountIn,uint amountOutMin,address[] calldata path,address to,uint deadline) external returns (uint[] memory amounts)",
  "function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint amountIn,uint amountOutMin,address[] calldata path,address to,uint deadline) external"
];



const recipient = EXECUTOR_CONTRACTBASE

export async function buildPancakeswapV2Swap(swap: DexSwap): Promise<BuiltSwapCall> {
  try {
    const router = new ethers.Contract(pancakeswapv2Router, UNISWAP_V2_ROUTER_ABI);

    const callData = router.interface.encodeFunctionData("swapExactTokensForTokens", [
      swap.amountIn,
      swap.amountOutMin,
      [swap.tokenIn, swap.tokenOut],
      recipient,
      Math.floor(Date.now() / 1000) + 60,
    ]);

    return {
      to: pancakeswapv2Router,
      data: callData,
      value: ethers.toBigInt(0),
    };
  } catch (error) {
    console.error("Erro ao gerar calldata SushiswapV2:", error);
    throw error;
  }
}




export async function buildNomiswapSwap(swap: DexSwap): Promise<BuiltSwapCall> {
  try {
    const router = new ethers.Contract(nomiswapRouter, UNISWAP_V2_ROUTER_ABI);

    // Preparando os dados da transação
    const callData = router.interface.encodeFunctionData("swapExactTokensForTokens", [
      swap.amountIn,
      swap.amountOutMin,
      [swap.tokenIn, swap.tokenOut],
      recipient,
      Math.floor(Date.now() / 1000) + 60,
    ]);

    return {
      to: nomiswapRouter,
      data: callData,
      value: ethers.toBigInt(0), 
    };
  } catch (error) {
    console.error("Erro ao gerar calldata V2-like:", error);
    return fallbackSwapCall;
  }
}


export async function buildUniswapV2Swap(swap: DexSwap): Promise<BuiltSwapCall> {
  try {
    const router = new ethers.Contract(uniswapv2Router, UNISWAP_V2_ROUTER_ABI);

    // Preparando os dados da transação
    const callData = router.interface.encodeFunctionData("swapExactTokensForTokens", [
      swap.amountIn,
      swap.amountOutMin,
      [swap.tokenIn, swap.tokenOut],
      recipient,
      Math.floor(Date.now() / 1000) + 60,
    ]);

    return {
      to: uniswapv2Router,
      data: callData,
      value: ethers.toBigInt(0), 
    };
  } catch (error) {
    console.error("Erro ao gerar calldata V2-like:", error);
    return fallbackSwapCall;
  }
}

/// Uniswap V3 / Sushiswap V3 / PancakeSwap V3 / Ramses V2
const swapRouterAbi = [
  "function exactInputSingle((address,address,uint24,address,uint256,uint256,uint160)) external payable returns (uint256)",
];



export async function buildPancakeswapV3Swap(swap: DexSwap): Promise<BuiltSwapCall> {
  try {
    const router = new ethers.Contract(pancakeswapv3Router, UNISWAP_V3_ROUTER_ABI);

    // Preparando os dados da transação
    const callData = router.interface.encodeFunctionData("exactInputSingle", [
      {
        tokenIn: swap.tokenIn,
        tokenOut: swap.tokenOut,
        fee: 3000,
        recipient: recipient,
        amountIn: swap.amountIn,
        amountOutMin:swap.amountOutMin,
        sqrtPriceLimitX96: 0,}
    ]);

    return {
      to: pancakeswapv3Router,
      data: callData,
      value: ethers.toBigInt(0),
    };
  } catch (error) {
    console.error("Erro ao gerar calldata V2-like:", error);
    return fallbackSwapCall;
  }
}

export async function buildUniswapV3Swap(swap: DexSwap): Promise<BuiltSwapCall> {
  try {
    const router = new ethers.Contract(uniswapv3Router, UNISWAP_V3_ROUTER_ABI);

    // Preparando os dados da transação
    const callData = router.interface.encodeFunctionData("exactInputSingle", [
      {
        tokenIn: swap.tokenIn,
        tokenOut: swap.tokenOut,
        fee: 3000,
        recipient: recipient,
        amountIn: swap.amountIn,
        amountOutMin:swap.amountOutMin,
        sqrtPriceLimitX96: 0,}
    ]);

    return {
      to: uniswapv3Router,
      data: callData,
      value: ethers.toBigInt(0),
    };
  } catch (error) {
    console.error("Erro ao gerar calldata V2-like:", error);
    return fallbackSwapCall;
  }
}



const fallbackSwapCall: BuiltSwapCall = {
  to: ethers.ZeroAddress,
  data: "0x",
  value: ethers.toBigInt(0),
};