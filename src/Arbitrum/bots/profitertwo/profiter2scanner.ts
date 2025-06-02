import { ethers, BigNumberish } from "ethers";
import axios from "axios";
import { camelotQuoter, pancakeswapv3Quoter, ramsesv2Quoter,sushiswapv2Router, sushiswapv3Quoter, uniswapv2Router, uniswapv3Quoter2 } from "../../constants/addresses";
import {alchemysupport, infurasupport } from "../../config/provider"; 
import { EventEmitter } from "events";
import { DexType } from "../../utils/types";

export const mevWatcher = new EventEmitter();
const MIN_LIQUIDITY = ethers.parseEther("100"); // bigint
const MIN_PROFIT_PERCENT = 1; 
const MAX_DEPTH = 4;
const SLIPPAGE_TOLERANCE = 0.005; // 0.5%
const GAS_PRICE_GWEI = 100;
const GAS_LIMIT_PER_SWAP = 150_000;

const IUniswapV2RouterABI = [
  "function getAmountsOut(uint256 amountIn, address[] path) external view returns (uint256[] amounts)",
];
const IUniswapV3QuoterABI = [
  "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external view returns (uint256 amountOut)",
];

const uniswapv2 = new ethers.Contract(uniswapv2Router, IUniswapV2RouterABI, alchemysupport);
const uniswapv3 = new ethers.Contract(uniswapv3Quoter2, IUniswapV3QuoterABI, infurasupport);
const sushiswapv2 = new ethers.Contract(sushiswapv2Router, IUniswapV2RouterABI, alchemysupport);
const sushiswapv3 = new ethers.Contract(sushiswapv3Quoter, IUniswapV3QuoterABI, infurasupport);
const pancakeswapv3 = new ethers.Contract(pancakeswapv3Quoter, IUniswapV3QuoterABI, alchemysupport);
const ramsesv2 = new ethers.Contract(ramsesv2Quoter, IUniswapV2RouterABI, infurasupport);
const camelot = new ethers.Contract(camelotQuoter, IUniswapV2RouterABI, alchemysupport);


type Protocol = "uniswapv2" | "uniswapv3" | "sushiswapv2" | "sushiswapv3"| "pancakeswapv3" | "ramsesv2" | "camelot";

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
    if (pool.protocol === "uniswapv2") {
      const amounts: bigint[] = await uniswapv2.getAmountsOut(amountIn, [pool.tokenIn, pool.tokenOut]);
      return amounts[1] ?? 0n;
    }
    if (pool.protocol === "sushiswapv2") {
      const amounts: bigint[] = await sushiswapv2.getAmountsOut(amountIn, [pool.tokenIn, pool.tokenOut]);
      return amounts[1] ?? 0n;
    }
    if (pool.protocol === "ramsesv2") {
      const amounts: bigint[] = await ramsesv2.getAmountsOut(amountIn, [pool.tokenIn, pool.tokenOut]);
      return amounts[1] ?? 0n;
    }
    if (pool.protocol === "camelot") {
      const amounts: bigint[] = await camelot.getAmountsOut(amountIn, [pool.tokenIn, pool.tokenOut]);
      return amounts[1] ?? 0n;
    }
    if (pool.protocol === "uniswapv3") {
      const fee = pool.fee ?? 3000;
      // callStatic para garantir retorno, método acessado via string para evitar erro TS
      const amountOut: bigint = await uniswapv3.quoteExactInputSingle(
        pool.tokenIn,
        pool.tokenOut,
        fee,
        amountIn,
        0n
      );
      return amountOut ?? 0n;
    }
    if (pool.protocol === "sushiswapv3") {
      const fee = pool.fee ?? 3000;
      const amountOut: bigint = await sushiswapv3.quoteExactInputSingle(
        pool.tokenIn,
        pool.tokenOut,
        fee,
        amountIn,
        0n
      );
      return amountOut ?? 0n;
    }
     if (pool.protocol === "pancakeswapv3") {
      const fee = pool.fee ?? 3000;
      const amountOut: bigint = await pancakeswapv3.quoteExactInputSingle(
        pool.tokenIn,
        pool.tokenOut,
        fee,
        amountIn,
        0n
      );
      return amountOut ?? 0n;
    }
    return 0n; // fallback para protocolos desconhecidos
  } catch {
    return 0n;
  }
}

async function fetchPoolsFromTheGraph(protocol: Protocol, retries = 3, apiKey?: string): Promise<Pool[]> {
  let url = "";
  let query = "";

  switch (protocol) {
    case "uniswapv2":
      url = "https://gateway.thegraph.com/api/subgraphs/id/CStW6CSQbHoXsgKuVCrk3uShGA4JX3CAzzv2x9zaGf8w";
      break;
    case "sushiswapv2":
      url = "https://gateway.thegraph.com/api/subgraphs/id/8yBXBTMfdhsoE5QCf7KnoPmQb7QAWtRzESfYjiCjGEM9";
      break;
    case "camelot":
      url = "https://gateway.thegraph.com/api/subgraphs/id/3utanEBA9nqMjPnuQP1vMCCys6enSM3EawBpKTVwnUw2";
      break;
    case "ramsesv2":
      url = "https://gateway.thegraph.com/api/subgraphs/id/ATQTt3wRTgXy4canCh6t1yeczAz4ZuEkFQL2mrLXEMyQ";
      break;
    case "uniswapv3":
      url = "https://gateway.thegraph.com/api/subgraphs/id/FbCGRftH4a3yZugY7TnbYgPJVEv2LvMT6oF1fxPe9aJM";
      break;
    case "pancakeswapv3":
      url = "https://gateway.thegraph.com/api/subgraphs/id/251MHFNN1rwjErXD2efWMpNS73SANZN8Ua192zw6iXve";
      break;
    case "sushiswapv3":
      url = "https://gateway.thegraph.com/api/subgraphs/id/96EYD64NqmnFxMELu2QLWB95gqCmA9N96ssYsZfFiYHg";
      break;
  }

  if (["uniswapv2", "sushiswapv2", "ramsesv2", "camelot"].includes(protocol)) {
  query = `
    {
      pairs(first: 1000, orderBy: reserveUSD, orderDirection: desc) {
        id
        token0 { id }
        token1 { id }
        reserveUSD
      }
    }
  `;
} else {
  query = `
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
}
   const headers: Record<string, string> = { "Content-Type": "application/json" };
   if (apiKey) {
     headers["Authorization"] = `Bearer ${apiKey}`;
   }
 
   try {
     const res = await axios.post(url, { query }, { headers });
     const data = res.data.data;
     const items = ["uniswapv2", "sushiswapv2", "ramsesv2", "camelot"].includes(protocol) ? data.pairs : data.pools;
 
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
  // (amount * (1 - slippagePercent))
  const factor = BigInt(Math.floor((1 - slippagePercent) * 1e6));
  return (amount * factor) / 1_000_000n;
}

export async function findProfitableRoutes(pools: Pool[], startToken: string, initialAmountIn: bigint): Promise<RouteResult[]> {
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
      ...(await fetchPoolsFromTheGraph("uniswapv2", 3, apiKey)),
      ...(await fetchPoolsFromTheGraph("sushiswapv2", 3, apiKey)),
      ...(await fetchPoolsFromTheGraph("ramsesv2", 3, apiKey)),
      ...(await fetchPoolsFromTheGraph("camelot", 3, apiKey)),
      ...(await fetchPoolsFromTheGraph("uniswapv3", 3, apiKey)),
      ...(await fetchPoolsFromTheGraph("pancakeswapv3", 3, apiKey)),
      ...(await fetchPoolsFromTheGraph("sushiswapv3", 3, apiKey)),
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
