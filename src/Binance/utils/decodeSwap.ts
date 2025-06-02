import { Interface, type BigNumberish, type Result } from "ethers";
import { DexType } from "./types";
import { ethers } from "ethers";
import { FunctionFragment, Fragment } from "ethers";

export const dexAddressMap: Record<string, DexType> = {
  "0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6": "uniswapv2",
  "0xBCfCcbde45cE874adCB698cC183deBcF17952812": "pancakeswapv2",
  "0xd6715A8be3944ec72738F0BFDC739d48C3c29349": "nomiswap",
  "0x1097053Fd2ea711dad45caCcc45EfF7548fCB362": "pancakeswapv3",
  "0xdB1d10011AD0Ff90774D0C6Bb92e5C5c8b4461F7": "uniswapv3"
};

export const abiExactInput = [
  "function exactInput((bytes path, address recipient, uint256 amountIn, uint256 amountOutMinimum) params) returns (uint256 amountOut)"
];

export const abiExactInputSingle = [
  "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96) params) returns (uint256 amountOut)"
];

export const abiExactOutput = [
  "function exactOutput((bytes path, address recipient, uint256 amountOut, uint256 amountInMaximum) params) returns (uint256 amountIn)"
];

export const abiExactOutputSingle = [
  "function exactOutputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum, uint160 sqrtPriceLimitX96) params) returns (uint256 amountIn)"
];

export const abiSwapExactTokensForTokens = [
  "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) returns (uint256[] amounts)"
];

export const abiSwapTokensForExactTokens = [
  "function swapTokensForExactTokens(uint256 amountOut, uint256 amountInMax, address[] path, address to, uint256 deadline) returns (uint256[] amounts)"
];

export const abiSwapExactETHForTokens = [
  "function swapExactETHForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline) payable returns (uint256[] amounts)"
];

export const abiSwapETHForExactTokens = [
  "function swapETHForExactTokens(uint256 amountOut, address[] path, address to, uint256 deadline) payable returns (uint256[] amounts)"
];

export const abiSwapExactTokensForETH = [
  "function swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) returns (uint256[] amounts)"
];

export const abiSwapTokensForExactETH = [
  "function swapTokensForExactETH(uint256 amountOut, uint256 amountInMax, address[] path, address to, uint256 deadline) returns (uint256[] amounts)"
];

const interfaces = {
  exactInput: new Interface(abiExactInput),
  exactInputSingle: new Interface(abiExactInputSingle),
  exactOutput: new Interface(abiExactOutput),
  exactOutputSingle: new Interface(abiExactOutputSingle),
  swapExactTokensForTokens: new Interface(abiSwapExactTokensForTokens),
  swapTokensForExactTokens: new Interface(abiSwapTokensForExactTokens),
  swapExactETHForTokens: new Interface(abiSwapExactETHForTokens),
  swapETHForExactTokens: new Interface(abiSwapETHForExactTokens),
  swapExactTokensForETH: new Interface(abiSwapExactTokensForETH),
  swapTokensForExactETH: new Interface(abiSwapTokensForExactETH)
};

const selectorMap: Record<
  string,
  { type: keyof typeof interfaces; iface: Interface }
> = {};

for (const [type, iface] of Object.entries(interfaces)) {
  for (const fragment of iface.fragments) {
    if (fragment.type === "function") {
      // fragment é FunctionFragment
      const functionFragment = fragment as FunctionFragment;
      const selector = functionFragment.selector;
      selectorMap[selector] = { type: type as keyof typeof interfaces, iface };
    }
  }
}

function normalizeDecodedArgs(decodedArgs: Result): Record<string, any> {
  const args: Record<string, any> = {};
  for (const [key, value] of Object.entries(decodedArgs)) {
    if (!/^\d+$/.test(key)) {
      args[key] = value;
    }
  }
  return args;
}

function parseSwapArgsLoose(args: Record<string, any>): {
  tokenIn: string;
  tokenOut: string;
  amountIn: BigNumberish;
  amountOutMin: BigNumberish;
} | null {
  let tokenIn: string | undefined = undefined;
  let tokenOut: string | undefined = undefined;
  let amountIn: BigNumberish | undefined = undefined;
  let amountOutMin: BigNumberish | undefined = undefined;

  if ("tokenIn" in args) tokenIn = args.tokenIn;
  else if ("path" in args && Array.isArray(args.path) && args.path.length > 0) tokenIn = args.path[0];

  if ("tokenOut" in args) tokenOut = args.tokenOut;
  else if ("path" in args && Array.isArray(args.path) && args.path.length > 1) tokenOut = args.path[args.path.length - 1];

  if ("amountIn" in args) amountIn = args.amountIn;
  else if (args.params && "amountIn" in args.params) amountIn = args.params.amountIn;

  if ("amountOutMin" in args) amountOutMin = args.amountOutMin;
  else if ("amountOutMinimum" in args) amountOutMin = args.amountOutMinimum;
  else if ("minReturnAmount" in args) amountOutMin = args.minReturnAmount;

  if (tokenIn && tokenOut && amountIn !== undefined && amountOutMin !== undefined) {
    return { tokenIn, tokenOut, amountIn, amountOutMin };
  }

  return null;
}

export function decodeSwap(
  data: string,
  value: BigNumberish,
  to: string
): {
  tokenIn: string;
  tokenOut: string;
  amountIn: BigNumberish;
  amountOutMin: BigNumberish;
  dex: DexType;
  extraParams: Record<string, any>;
} | null {
  const selector = data.slice(0, 10);
  const match = selectorMap[selector];

  if (!match) {
    return null;  // selector não encontrado
  }

  const dex = dexAddressMap[to.toLowerCase()];
  if (!dex) {
    return null;  // endereço da DEX não mapeado
  }

  const { iface } = match;

  try {
    const parsed = iface.parseTransaction({ data, value });
    if (!parsed) {
      return null;  // não conseguiu parsear
    }
    const args = normalizeDecodedArgs(parsed.args);
    const parsedArgs = parseSwapArgsLoose(args);

    if (!parsedArgs) {
      return null;  // não conseguiu extrair todos os argumentos obrigatórios
    }

    const { tokenIn, tokenOut, amountIn, amountOutMin } = parsedArgs;

    return {
      tokenIn,
      tokenOut,
      amountIn,
      amountOutMin,
      dex,
      extraParams: args
    };
  } catch (e) {
    return null;  // falha na decodificação
  }
}