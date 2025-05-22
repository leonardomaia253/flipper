import { DexSwap, BuiltSwapCall } from "./types";
import { ethers,BigNumber } from "ethers";
import {uniswapv2Router,uniswapv3Router,uniswapv4Router,sushiswapv2Router,sushiswapv3Router,pancakeswapv3Router,curveRouter,ramsesv2Router,maverickv2Router,camelotRouter,} from "../constants/addresses";
import { EXECUTOR_CONTRACTARBITRUM } from "../constants/contracts";
/// Uniswap V2 / Sushiswap V2 / Camelot (mesma ABI)
const uniV2LikeAbi = [
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external",
];
const recipient = EXECUTOR_CONTRACTARBITRUM

export async function buildUniswapV2Swap(swap: DexSwap): Promise<BuiltSwapCall> {
  try {
    const router = new ethers.Contract(uniswapv2Router, uniV2LikeAbi);
  

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
      value: BigNumber.from(0), 
    };
  } catch (error) {
    console.error("Erro ao gerar calldata V2-like:", error);
    return fallbackSwapCall;
  }
}

export async function buildSushiswapV2Swap(swap: DexSwap): Promise<BuiltSwapCall> {
  try {
    const router = new ethers.Contract(sushiswapv2Router, uniV2LikeAbi);

    const callData = router.interface.encodeFunctionData("swapExactTokensForTokens", [
      swap.amountIn,
      swap.amountOutMin,
      [swap.tokenIn, swap.tokenOut],
      recipient,
      Math.floor(Date.now() / 1000) + 60,
    ]);

    return {
      to: sushiswapv2Router,
      data: callData,
      value: BigNumber.from(0),
    };
  } catch (error) {
    console.error("Erro ao gerar calldata SushiswapV2:", error);
    throw error;
  }
}


export async function buildCamelotSwap(swap: DexSwap): Promise<BuiltSwapCall> {
  try {
    const router = new ethers.Contract(camelotRouter, uniV2LikeAbi);
    const recipient = new ethers.Contract(uniswapv2Router, uniV2LikeAbi);

    // Preparando os dados da transação
    const callData = router.interface.encodeFunctionData("swapExactTokensForTokens", [
      swap.amountIn,
      swap.amountOutMin,
      [swap.tokenIn, swap.tokenOut],
      recipient,
      Math.floor(Date.now() / 1000) + 60,
    ]);

    return {
      to: camelotRouter,
      data: callData,
      value: BigNumber.from(0), 
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

export async function buildUniswapV3Swap(swap: DexSwap): Promise<BuiltSwapCall> {
  try {
    const router = new ethers.Contract(uniswapv3Router, swapRouterAbi);

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
      value: BigNumber.from(0),
    };
  } catch (error) {
    console.error("Erro ao gerar calldata V2-like:", error);
    return fallbackSwapCall;
  }
}

export async function buildSushiswapV3Swap(swap: DexSwap): Promise<BuiltSwapCall> {
  try {
    const router = new ethers.Contract(sushiswapv3Router, swapRouterAbi);

    // Preparando os dados da transação
    const callData = router.interface.encodeFunctionData("exactInputSingle", [
      {
         tokenIn: swap.tokenIn,
        tokenOut: swap.tokenOut,
        fee: 3000,
        recipient: recipient,
        amountIn: swap.amountIn,
        amountOutMin:swap.amountOutMin,
        sqrtPriceLimitX96: 0,
      },
    ]);

    return {
      to: sushiswapv3Router,
      data: callData,
      value: BigNumber.from(0),
    };
 } catch (error) {
    console.error("Erro ao gerar calldata V2-like:", error);
    return fallbackSwapCall;
  }
}

export async function buildPancakeswapV3Swap(swap: DexSwap): Promise<BuiltSwapCall> {
  try {
    const router = new ethers.Contract(pancakeswapv3Router, swapRouterAbi);

    // Preparando os dados da transação
    const callData = router.interface.encodeFunctionData("exactInputSingle", [
      {
        tokenIn: swap.tokenIn,
        tokenOut: swap.tokenOut,
        fee: 3000,
        recipient: recipient,
        amountIn: swap.amountIn,
        amountOutMin:swap.amountOutMin,
        sqrtPriceLimitX96: 0,
      },
    ]);

    return {
      to: pancakeswapv3Router,
      data: callData,
      value: BigNumber.from(0),
    };
  } catch (error) {
    console.error("Erro ao gerar calldata V2-like:", error);
    return fallbackSwapCall;
  }
}

export async function buildRamsesV2Swap(swap: DexSwap): Promise<BuiltSwapCall> {
  try {
    const router = new ethers.Contract(ramsesv2Router, swapRouterAbi);

    // Preparando os dados da transação
    const callData = router.interface.encodeFunctionData("exactInputSingle", [
      {
        tokenIn: swap.tokenIn,
        tokenOut: swap.tokenOut,
        fee: 3000,
        recipient: recipient,
        amountIn: swap.amountIn,
        amountOutMin:swap.amountOutMin,
        sqrtPriceLimitX96: 0,
      },
    ]);

    return {
      to: ramsesv2Router,
      data: callData,
      value: BigNumber.from(0),
    };
 } catch (error) {
    console.error("Erro ao gerar calldata V2-like:", error);
    return fallbackSwapCall;
  }
}



export async function buildUniswapV4Swap(swap: DexSwap): Promise<BuiltSwapCall> {
  try {
    const {
      tokenIn: fromToken,
      tokenOut: toToken,
      amountIn,
      amountOutMin,
      callbackRecipient = ethers.constants.AddressZero,
      sqrtPriceLimitX96 = 0
    } = swap;

    const iface = new ethers.utils.Interface([
      "function swap(address recipient, bool zeroForOne, int256 amountSpecified, uint160 sqrtPriceLimitX96, bytes hookData) external returns (int256 amount0, int256 amount1)"
    ]);
    const router = new ethers.Contract(uniswapv4Router, iface);

    const [token0, token1] = [fromToken.toLowerCase(), toToken.toLowerCase()].sort();
    const zeroForOne = fromToken.toLowerCase() === token0;

    const hookData = ethers.utils.defaultAbiCoder.encode(
      ["address", "address", "address"],
      [fromToken, toToken, callbackRecipient]
    );

    const callData = iface.encodeFunctionData("swap", [
      recipient,
      zeroForOne,
      BigNumber.from(amountIn).mul(-1), // exactIn
      sqrtPriceLimitX96,
      hookData,
    ]);

    return {
      to: uniswapv4Router,
      data: callData,
      value: BigNumber.from(0),
    };
  } catch (error) {
    console.error("Erro ao gerar calldata V2-like:", error);
    return fallbackSwapCall;
  }
}

const maverickV2LikeAbi = [
  "function swapExactInputSingle(address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)"
];

/// Maverick V2
export async function buildMaverickV2Swap(swap: DexSwap): Promise<BuiltSwapCall> {
  try {
    const router = new ethers.Contract(maverickv2Router, maverickV2LikeAbi);

    // Verificação básica (evita erros silenciosos)
    if (!swap.tokenIn || !swap.tokenOut || !swap.amountIn || !swap.recipient) {
      throw new Error("Parâmetros incompletos em swap");
    }

    const callData = router.interface.encodeFunctionData("swapExactInputSingle", [
      swap.tokenIn,
      swap.tokenOut,
      swap.amountIn,
      swap.amountOutMin,
      recipient,
    ]);

    return {
      to: maverickv2Router,
      data: callData,
      value: BigNumber.from(0),
    };
  } catch (error) {
    console.error("Erro ao gerar calldata V2-like:", error);
    return fallbackSwapCall;
  }
}


const curveLikeAbi = [
  "function exchange(int128 i, int128 j, uint256 dx, uint256 min_dy) external"
];

/// Curve (simplificado, precisa da pool correta)
export async function buildCurveSwap(swap: DexSwap): Promise<BuiltSwapCall> {
  try {
    const pool = new ethers.Contract(curveRouter, curveLikeAbi);

    const i = 0;
    const j = 1;

    const callData = pool.interface.encodeFunctionData("exchange", [
      i,
      j,
      swap.amountIn,
      0,
    ]);

    return {
      to: curveRouter,
      data: callData,
      value: BigNumber.from(0),
    };
  } catch (error) {
    console.error("Erro ao gerar calldata V2-like:", error);
    return fallbackSwapCall;
  }
}


const fallbackSwapCall: BuiltSwapCall = {
  to: ethers.constants.AddressZero,
  data: "0x",
  value: BigNumber.from(0),
};