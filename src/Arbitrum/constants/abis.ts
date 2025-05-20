
// Common ABI fragments used across the project

export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function transfer(address to, uint256 value) returns (bool)",
  "function transferFrom(address from, address to, uint256 value) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

export const EXECUTOR_ABI = [
  "function executeSwap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut, bytes callData) payable returns (uint256)",
  "function executeArbitrage(address[] path, uint256 amountIn, uint256 minAmountOut) payable returns (uint256)",
  "function executeFrontrun(address router, address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut, bytes data) payable returns (uint256)",
  "function payMinerETH() payable",
  "function payMinerERC20(address token, uint256 amount)",
  "function emergencyWithdraw(address token, uint256 amount) onlyOwner",
  "function withdraw(address token, uint256 amount) onlyOwner"
];

export const UNISWAP_V2_ROUTER_ABI = [
  "function getAmountsOut(uint256 amountIn, address[] path) view returns (uint256[] amounts)",
  "function getAmountsIn(uint256 amountOut, address[] path) view returns (uint256[] amounts)",
  "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) returns (uint256[] amounts)",
  "function swapTokensForExactTokens(uint256 amountOut, uint256 amountInMax, address[] path, address to, uint256 deadline) returns (uint256[] amounts)",
  "function swapExactETHForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline) payable returns (uint256[] amounts)",
  "function swapETHForExactTokens(uint256 amountOut, address[] path, address to, uint256 deadline) payable returns (uint256[] amounts)",
  "function swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) returns (uint256[] amounts)",
  "function swapTokensForExactETH(uint256 amountOut, uint256 amountInMax, address[] path, address to, uint256 deadline) returns (uint256[] amounts)"
];


export const UNISWAP_V3_ROUTER_ABI = [
  "function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) payable returns (uint256 amountOut)",
  "function exactOutputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum, uint160 sqrtPriceLimitX96)) payable returns (uint256 amountIn)",
  "function exactInput(tuple(bytes path, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum)) payable returns (uint256 amountOut)",
  "function exactOutput(tuple(bytes path, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum)) payable returns (uint256 amountIn)",
  "function multicall(bytes[] data) payable returns (bytes[] results)",
  "function unwrapWETH9(uint256 amountMinimum, address recipient) payable",
  "function refundETH() payable",
  "function sweepToken(address token, uint256 amountMinimum, address recipient) payable"
];


export const UNISWAP_V3_QUOTER_ABI = [
  "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)",
  "function quoteExactInput(bytes memory path, uint256 amountIn) external returns (uint256 amountOut)"
];

export const CURVE_POOL_ABI = [
    "function get_dy(int128 i, int128 j, uint256 dx) external view returns (uint256)",
    "function get_dy_underlying(int128 i, int128 j, uint256 dx) external view returns (uint256)",
    "function balances(uint256 index) external view returns (uint256)"
];


export const MAVERICK_V2_PAIR_ABI = [
    "function getBin(uint128 binId) external view returns (Bin memory)",
    "function getActiveBins() external view returns (uint128[] memory)",
    "function liquidityMap() external view returns (uint256)"
];

export const MAVERICK_QUOTER_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "tokenIn", "type": "address" },
      { "internalType": "address", "name": "tokenOut", "type": "address" },
      { "internalType": "uint256", "name": "amountOut", "type": "uint256" },
      { "internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160" }
    ],
    "name": "quoteExactOutputSingle",
    "outputs": [
      { "internalType": "uint256", "name": "amountIn", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];


export const AggregatorV3InterfaceABI = [
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "description",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "version",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint80", name: "_roundId", type: "uint80" }],
    name: "getRoundData",
    outputs: [
      { internalType: "uint80", name: "roundId", type: "uint80" },
      { internalType: "int256", name: "answer", type: "int256" },
      { internalType: "uint256", name: "startedAt", type: "uint256" },
      { internalType: "uint256", name: "updatedAt", type: "uint256" },
      { internalType: "uint80", name: "answeredInRound", type: "uint80" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "latestRoundData",
    outputs: [
      { internalType: "uint80", name: "roundId", type: "uint80" },
      { internalType: "int256", name: "answer", type: "int256" },
      { internalType: "uint256", name: "startedAt", type: "uint256" },
      { internalType: "uint256", name: "updatedAt", type: "uint256" },
      { internalType: "uint80", name: "answeredInRound", type: "uint80" },
    ],
    stateMutability: "view",
    type: "function",
  },
];
