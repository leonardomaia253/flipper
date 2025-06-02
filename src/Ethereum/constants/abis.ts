
// Common ABI fragments used across the project

export const ERC20_ABI = [
  "function approve(address spender, uint256 value) returns (bool)",
 ];

export const MULTI_FLASH_LOAN_EXECUTOR_ABI = [
  "function orchestrate(tuple(address provider, address token, uint256 amount)[] flashLoanRequests, tuple(address target, bytes data, bool requiresApproval, address approvalToken, uint256 approvalAmount)[] calls)",
];

//ABI dos CONTRATOS DE ROUTERS

export const UNISWAP_V2_ROUTER_ABI = [
  "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) returns (uint256[] amounts)",
];


export const UNISWAP_V3_ROUTER_ABI = [
  "function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) payable returns (uint256 amountOut)",
];

export const CURVE_EXCHANGE_ABI = [
"function exchange(int128 i, int128 j, uint256 dx, uint256 min_dy)",
];


//ABIS DOS CONTRATOS DE QUOTERS

 export const UNISWAP_V3_QUOTER_ABI = [
  "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)",
 ];

 export const UNISWAP_V2_QUOTER_ABI = [
  "function getAmountsOut(uint256 amountIn, address[] path) view returns (uint256[] amounts)",
 ];

export const CURVE_POOL_ABI = [
  "function get_dy(int128 i, int128 j, uint256 dx) view returns (uint256)",
];



//ABIS DOS CONTRATOS DE FACTORY

export const MAVERICK_V2_PAIR_ABI = [
    "function getBin(uint128 binId) external view returns (Bin memory)",
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
  CURVE: [ "function find_pool_for_coins(address, address, uint256) view returns (address)" ]
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

