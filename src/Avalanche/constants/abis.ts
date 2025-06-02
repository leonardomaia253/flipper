
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

export const MULTI_FLASH_LOAN_EXECUTOR_ABI = [
  "function approvedFlashLoanProviders(address) view returns (bool)",
  "function callFunction(address target, bytes data)",
  "function depositToken(address token, uint256 amount)",
  "function executeOperation(address[] assets, uint256[] amounts, uint256[] premiums, address initiator, bytes params) returns (bool)",
  "function executeWithCollateral(tuple(address target, bytes data, bool requiresApproval, address approvalToken, uint256 approvalAmount)[] calls)",
  "function onDeferredLiquidityCheck(bytes data)",
  "function orchestrate(tuple(address provider, address token, uint256 amount)[] flashLoanRequests, tuple(address target, bytes data, bool requiresApproval, address approvalToken, uint256 approvalAmount)[] calls)",
  "function owner() view returns (address)",
  "function renounceOwnership()",
  "function simulate(tuple(address provider, address token, uint256 amount)[] flashLoanRequests, tuple(address target, bytes data, bool requiresApproval, address approvalToken, uint256 approvalAmount)[] calls) view returns (uint256 profit)",
  "function transferOwnership(address newOwner)",
  "function uniswapV3SwapCallback(int256 amount0Delta, int256 amount1Delta, bytes data)",
  "function withdrawToken(address token, uint256 amount)",
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)"
];

//ABI dos CONTRATOS DE ROUTERS

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

export const CURVE_POOL_ABI = [
  "function get_dy(int128 i, int128 j, uint256 dx) view returns (uint256)",
  "function exchange(int128 i, int128 j, uint256 dx, uint256 min_dy)",
  "function get_dy_underlying(int128 i, int128 j, uint256 dx) view returns (uint256)",
  "function exchange_underlying(int128 i, int128 j, uint256 dx, uint256 min_dy)",
  "function exchange(uint256 i, uint256 j, uint256 dx, uint256 min_dy)",
  "function get_dy(uint256 i, uint256 j, uint256 dx) view returns (uint256)"
];


//ABIS DOS CONTRATOS DE QUOTERS

export const UNISWAP_V3_QUOTER_ABI = [
  "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)",
  "function quoteExactInput(bytes memory path, uint256 amountIn) external returns (uint256 amountOut)"
];


//ABIS DOS CONTRATOS DE FACTORY

export const MAVERICK_V2_PAIR_ABI = [
    "function getBin(uint128 binId) external view returns (Bin memory)",
    "function getActiveBins() external view returns (uint128[] memory)",
    "function liquidityMap() external view returns (uint256)"
];


//ABIS UNIFICADAS - SIMPLIFICAÇÃO
export const ROUTER_ABIS = {
UNISWAP_V2: ["function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) returns (uint256[] amounts)"],
UNISWAP_V3: ["function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) payable returns (uint256 amountOut)"],
CURVE: ["function get_dy(int128 i, int128 j, uint256 dx) view returns (uint256)"],
}

export const FACTORY_ABIS = {
  UNISWAP_V2: [ "function getPair(address, address) view returns (address)" ],
  UNISWAP_V3: [ "function getPool(address, address, uint24) view returns (address)" ],
  CURVE: [ "function find_pool_for_coins(address, address, uint256) view returns (address)" ],
  TRADERJOE_V22:[{
    "inputs": [
      { "internalType": "address", "name": "tokenX", "type": "address" },
      { "internalType": "address", "name": "tokenY", "type": "address" },
      { "internalType": "uint256", "name": "binStep", "type": "uint256" }
    ],
    "name": "getLBPair",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  }]
};

export const POOL_ABIS = {
  UNISWAP_V2: [
    "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
    "function token0() view returns (address)",
    "function token1() view returns (address)"
  ],
  UNISWAP_V3: [
    "function liquidity() view returns (uint128)"
  ],
  CURVE: [
    "function balances(uint256) view returns (uint256)"
  ],
};

export const QUOTER_ABIS = {
UNISWAP_V2: ["function getAmountsOut(uint256 amountIn, address[] path) view returns (uint256[] amounts)"],
UNISWAP_V3: ["function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)"],
CURVE: ["function get_dy(int128 i, int128 j, uint256 dx) view returns (uint256)"],

};

