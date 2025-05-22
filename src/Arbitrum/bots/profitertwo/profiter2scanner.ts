import { ethers, BigNumber } from "ethers";
import pLimit from "p-limit";
import { TokenInfo, QuoteResult, DexType } from "../../utils/types";
import { getGasCostInToken, estimateGasUsage } from "../../utils/gasEstimator";
import { estimateSwapOutput } from "../../shared/utils/QuoteRouter";
import { LRUCache } from "lru-cache";

// Configurações principais
const DEX_PRIORITY: DexType[] = [
  "uniswapv3", "uniswapv2", "sushiswapv3", "sushiswapv2",
  "camelot", "pancakeswapv3", "maverickv2", "ramsesv2", "uniswapv4", "curve",
];
const MAX_HOPS = 5;
const MAX_CONCURRENT_CALLS = 8;
const SLIPPAGE = 0.005;
const MIN_PROFIT_ETH = 0.01;
const CACHE_TTL_MS = 30_000;

// Controle de concorrência
const limit = pLimit(MAX_CONCURRENT_CALLS);

// Cache para cotações
type QuoteCacheResult = { dex: DexType; amountOut: BigNumber; liquidity: BigNumber };
const quoteCache = new LRUCache<string, { timestamp: number; result: QuoteCacheResult | null }>({
  max: 1000,
  ttl: CACHE_TTL_MS,
});

type PathStep = {
  tokenIn: TokenInfo;
  tokenOut: TokenInfo;
  dex: DexType;
  amountIn: BigNumber;
  amountOut: BigNumber;
  liquidity?: BigNumber;
};

// 🔍 Busca melhor cotação entre dois tokens em todos os DEXs
async function getBestQuote(
  from: TokenInfo,
  to: TokenInfo,
  amountIn: BigNumber
): Promise<QuoteCacheResult | null> {
  const cacheKey = `${from.address}-${to.address}-${amountIn.toString()}`;
  const cached = quoteCache.get(cacheKey);
  if (cached) return cached.result;

  const results = await Promise.all(
    DEX_PRIORITY.map((dex) =>
      limit(async () => {
        try {
          const amountOut = await estimateSwapOutput(from.address, to.address, amountIn, dex);
          if (amountOut.lte(0)) return null;
          return { dex, amountOut, liquidity: amountOut.mul(10) }; // mock de liquidez
        } catch {
          return null;
        }
      })
    )
  );

  const validQuotes = results.filter((q): q is QuoteCacheResult => q !== null);
  if (!validQuotes.length) {
    quoteCache.set(cacheKey, { timestamp: Date.now(), result: null });
    return null;
  }

  // Prioriza maior liquidez → maior output
  validQuotes.sort((a, b) => {
    const liquidityDiff = b.liquidity.sub(a.liquidity);
    return liquidityDiff.isZero() ? b.amountOut.sub(a.amountOut).toNumber() : liquidityDiff.toNumber();
  });

  const bestQuote = validQuotes[0];
  quoteCache.set(cacheKey, { timestamp: Date.now(), result: bestQuote });
  return bestQuote;
}

// 🔁 Exploração recursiva de caminhos multi-hop
type ExploreResult = { path: PathStep[]; amountOut: BigNumber };

async function explorePaths(
  from: TokenInfo,
  to: TokenInfo,
  tokens: TokenInfo[],
  visited: Set<string>,
  amountIn: BigNumber,
  hop: number
): Promise<ExploreResult | null> {
  if (hop > MAX_HOPS || from.address === to.address) return null;

  visited.add(from.address);

  let best: ExploreResult | null = null;

  const direct = await getBestQuote(from, to, amountIn);
  if (direct && direct.amountOut.gt(0)) {
    best = {
      path: [{
        tokenIn: from,
        tokenOut: to,
        dex: direct.dex,
        amountIn,
        amountOut: direct.amountOut,
        liquidity: direct.liquidity,
      }],
      amountOut: direct.amountOut,
    };
  }

  for (const intermediate of tokens) {
    if (visited.has(intermediate.address) || intermediate.address === to.address) continue;

    const firstLeg = await getBestQuote(from, intermediate, amountIn);
    if (!firstLeg || firstLeg.amountOut.lte(0)) continue;

    const nextLeg = await explorePaths(
      intermediate, to, tokens, new Set(visited), firstLeg.amountOut, hop + 1
    );
    if (!nextLeg) continue;

    const totalOut = nextLeg.amountOut;
    if (totalOut.gt(best?.amountOut || BigNumber.from(0))) {
      best = {
        path: [{
          tokenIn: from,
          tokenOut: intermediate,
          dex: firstLeg.dex,
          amountIn,
          amountOut: firstLeg.amountOut,
          liquidity: firstLeg.liquidity,
        }, ...nextLeg.path],
        amountOut: totalOut,
      };
    }
  }

  return best;
}

// 🚀 Busca melhor rota de arbitragem multi-hop
export async function findBestMultiHopRoute({
  provider,
  baseToken,
  tokenList,
  amountInRaw = "1",
}: {
  provider: ethers.providers.Provider;
  baseToken: TokenInfo;
  tokenList: TokenInfo[];
  amountInRaw?: string;
}) {
  const amountIn = ethers.utils.parseUnits(amountInRaw, baseToken.decimals);
  const tokensToTry = tokenList.slice(0, 20);

  const start = Date.now();
  const route = await explorePaths(baseToken, baseToken, tokensToTry, new Set(), amountIn, 1);
  const durationMs = Date.now() - start;

  if (!route || route.amountOut.lte(amountIn)) {
    console.log(`[INFO] Sem rota lucrativa encontrada | tempo=${durationMs}ms`);
    return null;
  }

  const grossProfit = route.amountOut.sub(amountIn);
  const routeTokens = route.path.map(p => p.tokenIn);
  routeTokens.push(route.path[route.path.length - 1].tokenOut);

  const gasEstimate = await estimateGasUsage(routeTokens.map(t => t.address));
  const gasCost = await getGasCostInToken({ provider, token: baseToken, gasUnits: gasEstimate });
  const netProfit = grossProfit.sub(gasCost);

  console.log(`[ROTA] ${routeTokens.map(t => t.symbol).join(" → ")} | lucro bruto: ${ethers.utils.formatUnits(grossProfit, baseToken.decimals)} | líquido: ${ethers.utils.formatUnits(netProfit, baseToken.decimals)} | tempo: ${durationMs}ms`);

  const minProfit = ethers.utils.parseUnits(MIN_PROFIT_ETH.toString(), baseToken.decimals);
  if (netProfit.lte(minProfit)) return null;

  const amountOutMin = route.amountOut
    .mul(10000 - Math.round(SLIPPAGE * 10000))
    .div(10000)
    .toBigInt();

  const quote: QuoteResult = {
    amountIn: amountIn.toBigInt(),
    amountOut: route.amountOut.toBigInt(),
    amountOutMin,
    estimatedGas: gasEstimate.toBigInt(),
    path: routeTokens,
    dex: route.path.map(step => step.dex).join("→"),
  };

  return {
    route: route.path,
    quote,
    gasCost: gasCost.toBigInt(),
    netProfit: netProfit.toBigInt(),
    inputAmount: amountIn,
    durationMs,
  };
}

