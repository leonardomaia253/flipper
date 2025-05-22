 import { Result } from 'ethers/lib/utils';
import { ethers, BigNumber } from "ethers";
import { DexType, DecodedSwapTransaction } from "./types";
import { enhancedLogger } from "./enhancedLogger";
import { WETH } from '../constants/addresses';

// ABI fragments for decoding swap methods
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
  "function exchange(int128 i, int128 j, uint256 dx, uint256 min_dy) external",
];

const MAVERICK_V2_ROUTER_ABI = [
  "function swapExactInputSingle(address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)",
];

const UNISWAP_V4_ROUTER_ABI = [
  "function execute(address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)",
];

// Router addresses for identifying DEXs
const DEX_ROUTERS = {
  uniswapv2: ["0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24"].map(a => a.toLowerCase()),
  uniswapv3: ["0xE592427A0AEce92De3Edee1F18E0157C05861564", "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45"].map(a => a.toLowerCase()),
  sushiswapv2: ["0xA7caC4207579A179c1069435d032ee0F9F150e5c"].map(a => a.toLowerCase()),
  sushiswapv3: ["0xA7caC4207579A179c1069435d032ee0F9F150e5c"].map(a => a.toLowerCase()),
  camelot: ["0xc873fEcbd354f5A56E00E710B90EF4201db2448d", "0x6EeE6060f715257b970700bc2656De21dEdF074C"].map(a => a.toLowerCase()),
  pancakeswapv3: ["0x13f4ea83d0bd40e75c8222255bc855a974568dd4"].map(a => a.toLowerCase()),
  ramsesv2: ["0xaa273216cc9201a1e4285ca623f584badc736944"].map(a => a.toLowerCase()),
  maverickv2:["0x5c3b380e5Aeec389d1014Da3Eb372FA2C9e0fc76"].map(a => a.toLowerCase()),
  curve:["0x2191718cd32d02b8e60badffea33e4b5dd9a0a0d"].map(a => a.toLowerCase()),
  uniswapv4:["0x2191718cd32d02b8e60badffea33e4b5dd9a0a0d"].map(a => a.toLowerCase()),
};



/**
 * Decodes swap transactions from popular DEXes
 * @param tx Transaction object from ethers
 * @returns Decoded swap parameters or null if not a swap
 */
export function decodeSwap(tx: ethers.Transaction): DecodedSwapTransaction {
  const fallback: DecodedSwapTransaction = {
    dex: "uniswapv3",
    tokenIn: ethers.constants.AddressZero,
    tokenOut: ethers.constants.AddressZero,
    amountIn: ethers.constants.Zero,
    amountOutMin: ethers.constants.Zero,
    recipient: ethers.constants.AddressZero,
    path: [],
    deadline: ethers.constants.Zero,
  };

  try {
    if (!tx.data || !tx.to) return fallback;

    const lowercaseTo = tx.to.toLowerCase();

    let dexType: DexType | undefined;

    for (const [key, addresses] of Object.entries(DEX_ROUTERS)) {
      if (addresses.includes(lowercaseTo)) {
        dexType = key.toLowerCase() as DexType;
        break;
      }
    }

    if (!dexType) return fallback;

    let iface: ethers.utils.Interface;

    if (dexType.includes('uniswapv2') || dexType.includes('sushiswapv2') || dexType.includes('camelot')) {
      iface = new ethers.utils.Interface(UNISWAP_V2_ROUTER_ABI);
    } else if (
      dexType.includes('uniswapv3') || 
      dexType.includes('sushiswapv3') || 
      dexType.includes('pancakeswapv3') || 
      dexType.includes('ramsesv2')
    ) {
      iface = new ethers.utils.Interface(UNISWAP_V3_ROUTER_ABI);
    } else if (dexType.includes('uniswapv4')) {
      iface = new ethers.utils.Interface(UNISWAP_V4_ROUTER_ABI);
    } else if (dexType.includes('maverickv2')) {
      iface = new ethers.utils.Interface(MAVERICK_V2_ROUTER_ABI);
    } else if (dexType.includes('curve')) {
      iface = new ethers.utils.Interface(CURVE_ROUTER_ABI);
    } else {
      return fallback;
    }

    let decodedData;
    try {
      decodedData = iface.parseTransaction({ data: tx.data });
    } catch (e) {
      return fallback;
    }

    if (!decodedData) return fallback;

    const functionName = decodedData.name;
    const args = decodedData.args;

    switch (dexType) {
      case "uniswapv2":
      case "sushiswapv2":
      case "camelot":
        return decodeV2Swap(functionName, args, dexType, tx.value) ?? fallback;

      case "uniswapv3":
      case "sushiswapv3":
      case "pancakeswapv3":
      case "ramsesv2":
        return decodeV3Swap(functionName, args, dexType, tx.value) ?? fallback;

      case "uniswapv4":
        return decodeUniswapV4Swap(functionName, args, dexType, tx.value) ?? fallback;

      case "maverickv2":
        return decodeMaverickV2Swap(functionName, args, dexType, tx.value) ?? fallback;

      case "curve":
        return decodeCurveSwap(functionName, args, dexType, tx.value, tx.to) ?? fallback;

      default:
        return fallback;
    }

  } catch (err) {
    enhancedLogger.error(`Error decoding swap: ${err}`, { botType: "scanner" });
    return fallback;
  }
}


/**
 * Decode Uniswap V2-style router transactions
 */
function decodeV2Swap(
  functionName: string,
  args: ethers.utils.Result,
  dexType: DexType,
  value: ethers.BigNumber
): DecodedSwapTransaction | null {
  try {
    
    
    // Handle different swap functions
    switch (functionName) {
      case "swapExactTokensForTokens": {
        const [amountIn, amountOutMin, path, to] = args;
        return {
          tokenIn: path[0],
          tokenOut: path[path.length - 1],
          amountIn,
          amountOutMin,
          path,
          deadline: args[4],
          dex: dexType
        };
      }
      
      case "swapTokensForExactTokens": {
        const [amountOut, amountInMax, path, to] = args;
        return {
          tokenIn: path[0],
          tokenOut: path[path.length - 1],
          amountIn: amountInMax, // max amount in
          amountOutMin: amountOut, // exact amount out
          path,
          deadline: args[4],
          dex: dexType
        };
      }
      
      case "swapExactETHForTokens": {
        const [amountOutMin, path, to] = args;
        return {
          tokenIn: WETH,
          tokenOut: path[path.length - 1],
          amountIn: value, // ETH value sent with tx
          amountOutMin,
          path: [WETH, ...path.slice(1)], // Path should start with WETH
          deadline: args[3],
          dex: dexType
        };
      }
      
      case "swapExactTokensForETH": {
        const [amountIn, amountOutMin, path, to] = args;
        return {
          tokenIn: path[0],
          tokenOut: WETH,
          amountIn,
          amountOutMin,
          path: [...path.slice(0, -1), WETH], // Path should end with WETH
          deadline: args[4],
          dex: dexType
        };
      }
      
      // Add other cases as needed
      
      default:
        return null;
    }
  } catch (err) {
    enhancedLogger.error(`Error decoding V2 swap: ${err}`, {
      botType: "scanner"
    });
    return null;
  }
}

/**
 * Decode Uniswap V3-style router transactions
 */
function decodeV3Swap(
  functionName: string,
  args: ethers.utils.Result,
  dexType: DexType,
  value: ethers.BigNumber
): DecodedSwapTransaction | null {
  try {
    
    
    // Handle different swap functions
    switch (functionName) {
      case "exactInputSingle": {
        const {
          tokenIn,
          tokenOut,
          amountIn,
          amountOutMinimum,
          recipient
        } = args[0];
        
        return {
          tokenIn,
          tokenOut,
          amountIn: tokenIn.toLowerCase() === WETH.toLowerCase() && value.gt(0) ? value : amountIn,
          amountOutMin: amountOutMinimum,
          dex: dexType,
        };
      }
      
      case "exactInput": {
        const {
          path: pathBytes,
          amountIn,
          amountOutMinimum,
          recipient
        } = args[0];
        
        // Decode path from bytes in V3
        const path = decodeV3Path(pathBytes);
        if (!path || path.length < 2) return null;
        
        return {
          tokenIn: path[0].token,
          tokenOut: path[path.length - 1].token,
          amountIn: path[0].token.toLowerCase() === WETH.toLowerCase() && value.gt(0) ? value : amountIn,
          amountOutMin: amountOutMinimum,
          dex:dexType
        };
      }
      
      // Add other cases as needed
      
      default:
        return null;
    }
  } catch (err) {
    enhancedLogger.error(`Error decoding V3 swap: ${err}`, {
      botType: "scanner"
    });
    return null;
  }
}


export function decodeCurveSwap(
    functionName: string,
    args: ethers.utils.Result,
    dexType: DexType,
    value: BigNumber,
    txFrom: string = ""
): DecodedSwapTransaction | null {
  try {
    if (functionName === "exchange" || functionName === "exchange_underlying") {
      const i = args[0];
      const j = args[1];
      const dx = args[2];
      const minDy = args[3];

      return {
        tokenIn: i,
        tokenOut: j,
        amountIn: dx,
        amountOutMin: minDy,
        dex: dexType,
      };
    }

    if (functionName === "exchange_multiple") {
      const routes = args[0];
      const swapParams = args[1];
      const amountIn = args[2];
      const minAmountOut = args[3];

      return {
        tokenIn: routes[0],
        tokenOut: routes[routes.length - 1],
        amountIn,
        amountOutMin: minAmountOut,
        dex: dexType,
      };
    }

    return null;
  } catch (err) {
    console.error("Curve decode error:", err);
    return null;
  }
}

export function decodeMaverickV2Swap(
  functionName: string,
  args: ethers.utils.Result,
  dexType: DexType,
  value: BigNumber
): DecodedSwapTransaction | null {
  try {
    if (functionName === "exactInputSingle") {
      const params = args[0];

      return {
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        amountIn: params.amountIn,
        amountOutMin: params.amountOutMinimum,
        dex: dexType,
      };
    }

    if (functionName === "exactInput") {
      const params = args[0];
      const { tokenIn, tokenOut } = decodeMaverickPath(params.path);

      return {
        tokenIn,
        tokenOut,
        amountIn: params.amountIn,
        amountOutMin: params.amountOutMinimum,
        dex: dexType,
      };
    }

    return null;
  } catch (err) {
    console.error("MaverickV2 decode error:", err);
    return null;
  }
}

export function decodeUniswapV4Swap(
  functionName: string,
  args: ethers.utils.Result,
  dexType: DexType,
  value: ethers.BigNumberish
): DecodedSwapTransaction | null {
  try {
    let tokenIn = "";
    let tokenOut = "";
    let amountIn: ethers.BigNumber = ethers.constants.Zero;
    let minAmountOut: ethers.BigNumber = ethers.constants.Zero;

    if (functionName === "swapExactInSingle") {
      const {
        poolKey,
        amountIn: amtIn,
        amountOutMinimum,
        hookData
      } = args[0]; // assume-se que é struct

      tokenIn = poolKey.currency0;
      tokenOut = poolKey.currency1;
      amountIn = amtIn;
      minAmountOut = amountOutMinimum;
    }

    else if (
      functionName === "settleAll" ||
      functionName === "settle" ||
      functionName === "takeAll" ||
      functionName === "take"
    ) {
      const params = args[0]; // assume-se que params é array de bytes

      if (params.length >= 3) {
        try {
          const [currency0, amtIn] = ethers.utils.defaultAbiCoder.decode(
            ["address", "uint256"],
            params[1]
          );
          const [currency1, minOut] = ethers.utils.defaultAbiCoder.decode(
            ["address", "uint256"],
            params[2]
          );

          tokenIn = currency0;
          tokenOut = currency1;
          amountIn = amtIn;
          minAmountOut = minOut;
        } catch (decodeErr) {
          console.warn("Erro ao decodificar params[1] ou [2]:", decodeErr);
          return null;
        }
      } else {
        return null;
      }
    }

    if (!tokenIn || !tokenOut || amountIn.isZero()) {
      return null;
    }

    return {
      dex: dexType,
      tokenIn,
      tokenOut,
      amountIn,
      amountOutMin: minAmountOut, 
    };
  } catch (err) {
    console.error("Erro no decoder UniswapV4:", err);
    return null;
  }
}

/**
 * Helper to decode UniswapV3 path bytes
 */
function decodeV3Path(pathBytes: string): { token: string; fee: number }[] | null {
  try {
    if (!pathBytes || !pathBytes.startsWith("0x") || pathBytes.length < 42) return null;

    const result: { token: string; fee: number }[] = [];
    let position = 2; // pula '0x'
    const length = pathBytes.length;

    let token = "0x" + pathBytes.slice(position, position + 40);
    position += 40;

    while (position < length) {
      if (position + 6 > length) {
        return null;
      }

      const feeHex = pathBytes.slice(position, position + 6);
      const fee = parseInt(feeHex, 16);
      position += 6;

      result.push({ token, fee });

      if (position + 40 > length) break;

      token = "0x" + pathBytes.slice(position, position + 40);
      position += 40;
    }

    result.push({ token, fee: 0 });

    return result;
  } catch (err) {
    enhancedLogger.error(`Error decoding V3 path: ${err}`, { botType: "scanner" });
    return null;
  }
}



function decodeMaverickPath(path: string): { tokenIn: string; tokenOut: string } {
  if (!path || path.length < 86) throw new Error("Invalid path");

  // token = 20 bytes (40 hex chars), fee = 3 bytes (6 hex chars)
  const stepSize = 40 + 6; // 46

  const tokenIn = "0x" + path.slice(2, 42);

  const hops = Math.floor((path.length - 2) / stepSize);
  const tokenOutStart = 2 + (stepSize * (hops - 1)) + 46;
  const tokenOut = "0x" + path.slice(tokenOutStart, tokenOutStart + 40);

  return { tokenIn, tokenOut };
}

function decodeSwapCommandInput(swapInput: string): {
  tokenIn: string;
  tokenOut: string;
  amountIn: BigNumber;
  amountOutMin: BigNumber;
} {
  const abiCoder = new ethers.utils.AbiCoder();

  const [tokenIn, tokenOut, amountIn, amountOutMin, recipient] = abiCoder.decode(
    ["address", "address", "uint256", "uint256", "address"],
    swapInput
  );

  return {
    tokenIn,
    tokenOut,
    amountIn,
    amountOutMin,
  };
}