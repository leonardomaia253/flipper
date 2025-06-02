import { ethers } from "ethers";
import { BigNumberish } from "ethers";
import { Signer } from "ethers";; // ou ajuste conforme a estrutura do seu projeto


export interface PoolKey {
  currency0: string;
  currency1: string;
  fee: number;
  tickSpacing: number;
  hooks: string;
}

export interface DecodedSwapParams {
  actions: string[];
  poolKey: PoolKey;
  zeroForOne: boolean;
  amountIn: ethers.BigNumberish;
  minAmountOut: ethers.BigNumberish;
  settle: {
    token: string;
    amount: ethers.BigNumberish;
  };
  take: {
    token: string;
    amount: ethers.BigNumberish;
  };
}

export type BuildOrchestrationParams = {
  route?: SwapStep[];              // Rota principal de swaps
  executor: string;               // Endereço do contrato executor
  useAltToken?: boolean;           // Se usará token alternativo (ex: WETH)
  altToken?: string;               // Token alternativo a ser usado (ex: WETH)
  preSwapDex?: string;            // DEX usado para altToken → tokenIn (se usar altToken)
  postSwapDex?: string; 
  flashLoanAmount?: BigNumberish;
  flashLoanToken?: string;          
};

// Define types used throughout the application
export type DexType = 
  | "quickswap" 
  | "uniswapv3" 
  | "sushiswapv2"
  | "quickswapv3"

export type ProtocolType = 
  | "aave" 
  | "spark" 
  | "radiant"
  | "abracadabra"
  | "venus"
  | "compound"
  | "morpho"
  | "llamalend"
  | "creamfinance"
  | "ironbank";

// Token information
export interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
  name?: string;
  logoURI?: string;
}

// Call data for contract interactions - Updated to include all necessary properties
export interface CallData {
  to: string;          // endereço do contrato a ser chamado
  data: string;        // calldata da função
  dex?: DexType;
  amountOutMin?: BigNumberish;
  value?: ethers.BigNumberish;
  requiresApproval?: boolean;
  approvalToken?: string;
  approvalAmount?: ethers.BigNumberish;
  target?: string;     // compatibility with older code
  callData?: string;   // compatibility with older code
  protocol?: ProtocolType
}

// Simulation result type
export interface SimulationResult {
  success: boolean;
  ok: boolean;
  profits: ethers.BigNumberish;
  simulationUrl: string;
  error?: string;
}

// Arbitrage route
export interface ArbitrageRoute {
  path: TokenInfo[];
  dexes?: DexType[];
  netProfit: ethers.BigNumberish;
  quote: string;
}

// Quote result from DEX
export interface QuoteResult {
  amountIn: ethers.BigNumberish;
  amountOut: ethers.BigNumberish;
  amountOutMin: ethers.BigNumberish;
  estimatedGas: ethers.BigNumberish;
  path: string[];
  dex: string;
  usd?: BigNumberish;
}

// Frontrun opportunity
export interface FrontrunOpportunity {
  hash: string;
  dex: DexType;
  tokenIn: string;
  tokenOut: string;
  amountIn: ethers.BigNumberish;
  deadline: number;
  probability: number;
  estimatedProfitUsd?: number;
}

export interface LiquidationOpportunity {
  txHash: string;
  protocol: string;
  liquidated: string;
  calldata: {
    to: string;
    data: string;
    protocol: string;
    liquidated: string;
    txHash: string;
    fullTx: ethers.TransactionResponse;
  };
}


// Account Health Data for Liquidation
export interface AccountHealthData {
  user: string;
  healthFactor: number;
  totalCollateralETH: number;
  totalDebtETH: number;
  shortfallUSD?: number;  // Added for use in liquidationbuilder
  collateral: Array<{ token: string, amount: number, decimals?: number }>;
  debt: Array<{ token: string, amount: number, decimals?: number }>;
}

// Liquidation Bundle Parameters
export interface LiquidationBundleParams {
  signer: ethers.Signer;
  collateralAsset: string;
  debtAsset: string;
  userToLiquidate: string;
  amountToRepay: string;
  expectedProfitToken: string;
  flashLoanToken: string;
  flashLoanAmount: string;
  minerReward: string;
  protocol: "aave" | "compound" | "morpho" | "venus" | "spark";
}

// Built route for arbitrage execution
export interface BuiltRoute {
  swaps: Array<{
    target: string;
    callData: string;
    approveToken: string;
    amountIn: ethers.BigNumberish;
    flashloanProvider: string;
    tokenIn?: string;
    tokenOut?: string;
  }>;
  profitUSD: number;
  calls?: Call[];
}

// DexSwap information
export type DexSwap = {
  tokenIn: string;
  tokenOut: string;
  amountIn: BigNumberish;
  amountOutMin?: BigNumberish;
  slippage?: number;
  callbackRecipient?: string;
  sqrtPriceLimitX96?: number;
  dex: DexType;
  recipient?: string;
  flashLoanToken?: string;
  flashLoanAmount?: BigNumberish;
};

// Built Swap Call
export interface BuiltSwapCall {
  to: string;          // endereço do contrato a ser chamado
  data: string;        // calldata da função
  value?: BigNumberish;  
}

// Enhanced LogMetadata interface for robust logging
export interface LogMetadata {
  category?: string;
  botType?: string;
  source?: string;
  duration?: number;
  tx_hash?: string;
  errorCode?: string;
  stack?: string;
  errorName?: string;
  blockNumber?: number;
  gasUsed?: string | number;
  gasPrice?: string | number;
  executionPhase?: string;
  attemptCount?: number;
  params?: Record<string, any>;
  profit?: number | string;
  route?: any[];
  dexes?: string[];
  tokens?: string[];
  [key: string]: any; // Allow for flexible additional fields
}

export type Call = {
  to: string;          // endereço do contrato a ser chamado
  data: string;        // calldata da função
  value?: BigNumberish;      // ETH enviado junto, se necessário     // Compatibilidade com outros formatos
};

interface PoolData {
  router: string;
}

export type SwapStep = {
  dex: DexType;               // Nome do DEX, ex: "uniswapv3"
  tokenIn: string;           // Endereço do token de entrada
  tokenOut: string;          // Endereço do token de saída
  amountIn: BigNumberish;
  amountOut: BigNumberish;          // Quantidade de entrada
  amountOutMin?: BigNumberish;     // Quantidade mínima de saída esperada
  path?: string[];           // Caminho (usado por alguns DEXs como Uniswap V2/V3)
  extra?: any; 
  router?:string;  
  to?: string;          // endereço do contrato a ser chamado
  data?: string;        // calldata da função
  value?: BigNumberish; 
  poolData?: PoolData | string;           // Campo opcional para parâmetros específicos (ex: fee tiers da Uniswap V3)
};

export interface MyTransactionRequest {
  to: string; // endereço destino da transação
  data: string; // calldata hex string
  value?: BigNumberish; // valor enviado em wei (opcional)
  gasLimit?: BigNumberish; // limite de gás (opcional)
  nonce?: number; // nonce da transação (opcional)
  gasPrice?: BigNumberish; // preço do gás (opcional)
  maxFeePerGas?: BigNumberish; // EIP-1559 max fee per gas (opcional)
  maxPriorityFeePerGas?: BigNumberish; // EIP-1559 max priority fee (opcional)
}

// Used for transaction decoding


export type BasicSwapStep = {
  dex: DexType;
  tokenIn: string;
  tokenOut: string;
  amountIn: BigNumberish;
  amountOutMin: BigNumberish;
  poolData?: any;
  calls?: Call[];
  recipient: string;
};


export interface DecodedSwapTransaction {
  [x: string]: any;
  tokenIn: string;
  tokenOut: string;
  amountIn: BigNumberish;
  amountOutMin: BigNumberish;
  path?: string[] | null;
  recipient?: string | null;
  deadline?: BigNumberish | null;
  dex: DexType;
  router?: string; // opcional, útil no Curve para identificar pool
}

export interface DexPair {
  pairaddress?: string;
  dex: DexType;
  url?: string;
  tokenIn: {
    address: string;
    symbol: string;
    decimals:number;
  };
  tokenOut: {
    address: string;
    symbol: string;
    decimals: number;
  };
  liquidity?: {
    usd?: Number;
  };
  volume24h?: {
    usd?: number;
  };
  priceNative?: string;
  priceUsd?: string;
}

export type PathStep = {
  tokenIn: string;     // Endereço do token de entrada (address)
  tokenOut: string;       // Endereço do token de saída (address)
  amountIn: bigint;      // Quantidade do token de entrada (em wei)
  amountOutMin: bigint; // Quantidade mínima esperada (slippage)
  dex: DexType;       // Nome do protocolo/dex (ex: 'UniswapV3', 'Sushiswap', etc)
  to?: string;  // Endereço do pool/liquidez onde ocorre swap
  fee?: number;          // Fee percentual em base points (ex: 3000 = 0.3%)
  deadline?: number;     // Timestamp para deadline da transação (opcional)
  extra?: Record<string, any>; // Qualquer dado extra específico do passo (ex: sqrtPriceLimitX96)
};

export type BuildLiquidationOrchestrationOptions = {
  flashLoanToken: string;
  flashLoanAmount: BigNumberish;
  liquidatorContract: string; // contrato de liquidação
  borrower: string;
  repayToken: string; // token que será usado para repagar a dívida
  slippageBps?: number;
  protocol?:ProtocolType;
};