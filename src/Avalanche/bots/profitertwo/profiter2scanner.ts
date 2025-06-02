import { ethers, BigNumberish } from "ethers";
import axios from "axios";
import { 
  lfjQuoter, 
  lfjv21Quoter, 
  lfjv22Quoter, 
  uniswapv3Quoter2,  
} from "../../constants/addresses";
import { alchemysupport, infurasupport } from "../../config/provider"; 
import { EventEmitter } from "events";
import { DexType } from "../../utils/types";

export const mevWatcher = new EventEmitter();

const MIN_LIQUIDITY = ethers.parseEther("100");
const MIN_PROFIT_PERCENT = 1;
const MAX_DEPTH = 4;
const SLIPPAGE_TOLERANCE = 0.005;
const GAS_PRICE_GWEI = 100;
const GAS_LIMIT_PER_SWAP = 150_000;

const IUniswapV2RouterABI = [
  "function getAmountsOut(uint256 amountIn, address[] path) external view returns (uint256[] amounts)"
];
const IUniswapV3QuoterABI = [
  "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external view returns (uint256 amountOut)"
];
const ITraderJoeV21QuoterABI = [
  "function findBestPathFromAmountIn(address tokenIn, address tokenOut, uint256 amountIn) external view returns (uint256 amountOut)"
];
const ITraderJoeV22QuoterABI = [
  "function findBestPathFromAmountIn(address tokenIn, address tokenOut, uint256 amountIn) external view returns (uint256 amountOut)"
];

const lfj = new ethers.Contract(lfjQuoter, IUniswapV2RouterABI, alchemysupport);
const lfjv21 = new ethers.Contract(lfjv21Quoter, ITraderJoeV21QuoterABI, infurasupport);
const lfjv22 = new ethers.Contract(lfjv22Quoter, ITraderJoeV22QuoterABI, infurasupport);
const uniswapv3 = new ethers.Contract(uniswapv3Quoter2, IUniswapV3QuoterABI, alchemysupport);

type Protocol = "lfj" | "lfjv21" | "lfjv22" | "uniswapv3";

interface Pool {
  address: string;
  tokenIn: string;
  tokenOut: string;
  protocol: Protocol;
  fee?: number;
  liquidity: bigint;
}

interface SwapStep {
  pool: Pool;
  amountIn: bigint;
  amountOut: bigint;
}

interface RouteResult {
  swaps: SwapStep[];
  profitPercent: number;
  profitAbsolute: bigint;
}

interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
}

interface QuoteResult {
  profitPercent: number;
  profitAbsolute: bigint;
}

interface FormattedRouteResult {
  route: Array<{
    tokenIn: TokenInfo;
    tokenOut: TokenInfo;
    dex: DexType;
    amountIn: bigint;
    amountOut: bigint;
  }>;
  quote: QuoteResult;
  gasCost: bigint;
  netProfit: bigint;
  inputAmount: bigint;
}

async function simulateSwapReal(pool: Pool, amountIn: bigint): Promise<bigint> {
  try {
    switch (pool.protocol) {
      case "uniswapv3":
        return await uniswapv3.quoteExactInputSingle(
          pool.tokenIn, pool.tokenOut, pool.fee ?? 3000, amountIn, 0n
        );
      case "lfj":
        const amounts = await lfj.getAmountsOut(amountIn, [pool.tokenIn, pool.tokenOut]);
        return amounts[1] ?? 0n;
      case "lfjv21":
        return await lfjv21.findBestPathFromAmountIn(pool.tokenIn, pool.tokenOut, amountIn);
      case "lfjv22":
        return await lfjv22.findBestPathFromAmountIn(pool.tokenIn, pool.tokenOut, amountIn);
      default:
        return 0n;
    }
  } catch {
    return 0n;
  }
}

async function fetchPoolsFromTheGraph(protocol: Protocol, retries = 3, apiKey?: string): Promise<Pool[]> {
  let url = "";
  let query = "";

  switch (protocol) {
    case "uniswapv3":
      url = "https://gateway.thegraph.com/api/subgraphs/id/FbCGRftH4a3yZugY7TnbYgPJVEv2LvMT6oF1fxPe9aJM";
      break;
    case "lfj":
      url = "https://gateway.thegraph.com/api/subgraphs/id/H2VGe2tYavUEosSjomHwxbvCKy3LaNaW8Kjw2KhhHs1K";
      break;
    case "lfjv21":
      url = "https://gateway.thegraph.com/api/subgraphs/id/EPApcqgNjpU3HEgfXVXKVX9gZoQMwPoPG6wCj79trHiP";
      break;
    case "lfjv22":
      url = "https://gateway.thegraph.com/api/subgraphs/id/EPApcqgNjpU3HEgfXVXKVX9gZoQMwPoPG6wCj79trHiP";
      break;
  }

  query = ["lfj", "lfjv21", "lfjv22"].includes(protocol) 
    ? `
      {
        pairs(first: 1000, orderBy: reserveUSD, orderDirection: desc) {
          id
          token0 { id }
          token1 { id }
          reserveUSD
        }
      }
    ` 
    : `
      {
        pools(first: 1000, orderBy: totalValueLockedUSD, orderDirection: desc) {
          id
          token0 { id }
          token1 { id }
          feeTier
          liquidity
          totalValueLockedUSD
        }
      }
    `;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  try {
    const res = await axios.post(url, { query }, { headers });
    const data = res.data.data;
    const items = ["lfj", "lfjv21", "lfjv22"].includes(protocol) ? data.pairs : data.pools;

    return items.map((p: any) => ({
      address: p.id,
      tokenIn: p.token0.id,
      tokenOut: p.token1.id,
      protocol,
      liquidity: ethers.parseUnits(p.totalValueLockedUSD ?? p.reserveUSD ?? "0", 18),
      fee: p.feeTier ? Number(p.feeTier) : undefined,
    }));
  } catch (e) {
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, 1000));
      return fetchPoolsFromTheGraph(protocol, retries - 1, apiKey);
    }
    console.error(`Erro fetchPoolsFromTheGraph (${protocol}):`, e);
    return [];
  }
}

function estimateGasCostInETH(numSwaps: number, gasPriceGwei: number): bigint {
  const gasLimit = GAS_LIMIT_PER_SWAP * numSwaps;
  const gasPrice = ethers.parseUnits(gasPriceGwei.toString(), "gwei");
  return gasPrice * BigInt(gasLimit);
}

function applySlippage(amount: bigint, slippagePercent: number): bigint {
  const factor = BigInt(Math.floor((1 - slippagePercent) * 1e6));
  return (amount * factor) / 1_000_000n;
}

export async function findProfitableRoutes(
  pools: Pool[], startToken: string, initialAmountIn: bigint
): Promise<RouteResult[]> {
  const results: RouteResult[] = [];
  const visited = new Set<string>();

  async function dfs(currentToken: string, amountIn: bigint, path: SwapStep[], depth: number) {
    if (depth > MAX_DEPTH) return;

    for (const pool of pools) {
      if (pool.tokenIn !== currentToken) continue;
      if (pool.liquidity < MIN_LIQUIDITY) continue;

      const key = `${pool.address}-${amountIn.toString()}`;
      if (visited.has(key)) continue;
      visited.add(key);

      const amountOutRaw = await simulateSwapReal(pool, amountIn);
      if (amountOutRaw <= 0n) continue;

      const amountOut = applySlippage(amountOutRaw, SLIPPAGE_TOLERANCE);
      if (amountOut <= 0n) continue;

      const estimatedGasCost = estimateGasCostInETH(path.length + 1, GAS_PRICE_GWEI);
      let profitPercent = 0;
      let profitAbsolute = 0n;

      const newPath = [...path, { pool, amountIn, amountOut }];

      if (pool.tokenOut === startToken && depth >= 1) {
        profitAbsolute = amountOut - initialAmountIn - estimatedGasCost;
        profitPercent = Number((profitAbsolute * 10000n) / initialAmountIn) / 100;

        if (profitPercent >= MIN_PROFIT_PERCENT && profitAbsolute > 0n) {
          results.push({ swaps: newPath, profitPercent, profitAbsolute });
        }
      }

      await dfs(pool.tokenOut, amountOut, newPath, depth + 1);
    }
  }

  await dfs(startToken, initialAmountIn, [], 0);
  return results;
}

function detectHighlyConnectedTokens(pools: Pool[]): string[] {
  const tokenConnections: Record<string, number> = {};
  for (const pool of pools) {
    tokenConnections[pool.tokenIn] = (tokenConnections[pool.tokenIn] ?? 0) + 1;
    tokenConnections[pool.tokenOut] = (tokenConnections[pool.tokenOut] ?? 0) + 1;
  }
  return Object.entries(tokenConnections)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([token]) => token);
}

export async function watcher() {
  console.log("Iniciando watcher MEV autônomo...");
  const apiKey = "eyJhbGciOiJLTVNFUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3ODQ4NzA0NzAsImp0aSI6ImQxZmI0M2M3LTZhNzItNGI5MC1iZTQ0LWIxMGQ2MWQ3ODMxZSIsImlhdCI6MTc0ODg3MDQ3MCwiaXNzIjoiZGZ1c2UuaW8iLCJzdWIiOiIwbmVqZTY0Yzc1YzdiNjZkNDk5OGUiLCJ2IjoxLCJha2kiOiIyZmJmMjFhNmI3ZTQ5NGI5MzU0NDU0MzdiNzEwZmE0Mjk5Nzk5M2JkYTllNjNlZGUwMGRjNzU3YjQ3MjhmYjNkIiwidWlkIjoiMG5lamU2NGM3NWM3YjY2ZDQ5OThlIn0.cYomtXG5TnG-Udn1RTqJkJYOFF25GYMg4qI1RxBM6EiSahslaMvaKs5qPo0_VAMkwJ5zMMHLid2gSJr8lezxKw"
  while (true) {
    const allPools = [
      ...(await fetchPoolsFromTheGraph("lfj", 3, apiKey)),
      ...(await fetchPoolsFromTheGraph("lfjv21", 3, apiKey)),
      ...(await fetchPoolsFromTheGraph("lfjv22", 3, apiKey)),
      ...(await fetchPoolsFromTheGraph("uniswapv3", 3, apiKey)),
    ];

    const pools = allPools;

    const baseTokens = detectHighlyConnectedTokens(pools);
    console.log("Tokens base detectados:", baseTokens);

    for (const token of baseTokens) {
      const initialAmountIn = ethers.parseEther("1");

      const profitableRoutes = await findProfitableRoutes(pools, token, initialAmountIn);

      for (const route of profitableRoutes) {
        const gasCost = estimateGasCostInETH(route.swaps.length, GAS_PRICE_GWEI);
        const netProfit = route.profitAbsolute - gasCost;

        const formattedRoute: FormattedRouteResult = {
          route: route.swaps.map((s) => ({
            tokenIn: { address: s.pool.tokenIn, symbol: "", decimals: 18 },
            tokenOut: { address: s.pool.tokenOut, symbol: "", decimals: 18 },
            dex: s.pool.protocol,
            amountIn: s.amountIn,
            amountOut: s.amountOut
          })),
          quote: {
            profitPercent: route.profitPercent,
            profitAbsolute: route.profitAbsolute
          },
          gasCost,
          netProfit,
          inputAmount: initialAmountIn
        };

        mevWatcher.emit("opportunity", formattedRoute);
      }
    }

    console.log("Atualização completa, aguardando próxima iteração...");
    await new Promise((r) => setTimeout(r, 5 * 60 * 1000));
  }
}
