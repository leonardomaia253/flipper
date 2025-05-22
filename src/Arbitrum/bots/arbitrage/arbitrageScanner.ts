import { ethers, BigNumber } from "ethers";
import pLimit from "p-limit";
import { DexType, QuoteResult, TokenInfo } from "../../utils/types";
import { getGasCostInToken, estimateGasUsage } from "../../utils/gasEstimator";
import { estimateSwapOutput } from "../../utils/estimateOutput";

export type EstimateSwapOutputResult = {
  output: BigNumber;
  paths: string[];
  dex: DexType;
};

const DEX_LIST_PRIORITY: DexType[] = [
  "uniswapv3",
  "uniswapv2",
  "uniswapv4",
  "sushiswapv3",
  "sushiswapv2",
  "camelot",
  "maverickv2",
  "ramsesv2",
  "pancakeswapv3",
  "curve",
];

const MIN_PROFIT_THRESHOLD = 0.01; // em unidades do token base

// Permite ajustar o batchSize externamente (default 20)
const DEFAULT_BATCH_SIZE = 20;
const MAX_CONCURRENT_CALLS = 10;

async function getQuoteFromDex(
  fromToken: string,
  toToken: string,
  amountIn: BigNumber,
  dex: DexType,
  quoteCache: Map<string, EstimateSwapOutputResult>
): Promise<EstimateSwapOutputResult | null> {
  const cacheKey = `${fromToken}-${toToken}-${amountIn.toString()}-${dex}`;
  if (quoteCache.has(cacheKey)) {
    return quoteCache.get(cacheKey)!;
  }

  try {
    const output = await estimateSwapOutput(fromToken, toToken, amountIn, dex);
    if (output.isZero()) return null;

    const result = {
      output,
      paths: [fromToken, toToken],
      dex,
    };
    quoteCache.set(cacheKey, result);
    return result;
  } catch {
    return null;
  }
}

async function getBestQuoteAcrossDEXs(params: {
  tokenIn: string;
  tokenOut: string;
  amountIn: BigNumber;
  quoteCache: Map<string, EstimateSwapOutputResult>;
}): Promise<EstimateSwapOutputResult | null> {
  const limit = pLimit(MAX_CONCURRENT_CALLS);

  const quotePromises = DEX_LIST_PRIORITY.map((dex) =>
    limit(() => getQuoteFromDex(params.tokenIn, params.tokenOut, params.amountIn, dex, params.quoteCache))
  );

  const quotes = await Promise.all(quotePromises);
  const validQuotes = quotes.filter((q): q is EstimateSwapOutputResult => q !== null);

  if (validQuotes.length === 0) return null;

  // Retorna o melhor quote
  return validQuotes.reduce((best, current) =>
    current.output.gt(best.output) ? current : best
  );
}

/**
 * Slippage adaptativa baseada em liquidez simples:
 * Quanto maior a liquidez, menor a slippage aplicada.
 * Retorna percentual decimal (ex: 0.005 para 0.5%)
 */

export async function findBestArbitrageRoute({
  provider,
  baseToken,
  tokenList,
  amountInRaw = "1",
  batchSize = DEFAULT_BATCH_SIZE,
  enableDebugLog = false,
}: {
  provider: ethers.providers.Provider;
  baseToken: TokenInfo;
  tokenList: TokenInfo[];
  amountInRaw?: string;
  batchSize?: number;
  enableDebugLog?: boolean;
}) {
  const amountIn = ethers.utils.parseUnits(amountInRaw, baseToken.decimals);

  let bestRoute: {
    route: {
      tokenIn: TokenInfo;
      tokenOut: TokenInfo;
      dex: DexType;
      amountIn: ethers.BigNumber;
      amountOut: ethers.BigNumber;
    }[];
    quote: QuoteResult;
    gasCost: bigint;
    netProfit: bigint;
    inputAmount: ethers.BigNumber;
  } | null = null;

  let maxNetProfit = ethers.BigNumber.from(0);
  const quoteCache = new Map<string, EstimateSwapOutputResult>();

  for (let i = 0; i < tokenList.length; i += batchSize) {
    const batch = tokenList.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(async (intermediate) => {
        try {
          if (intermediate.address === baseToken.address) return null;

          // Obtem o melhor quote para base -> intermediate
          const firstHopQuote = await getBestQuoteAcrossDEXs({
            tokenIn: baseToken.address,
            tokenOut: intermediate.address,
            amountIn,
            quoteCache,
          });

          if (!firstHopQuote) return null;

          // Slippage adaptativa para segundo hop
          const slippageSecondHop = 50;

          // Ajusta o amountIn do segundo hop considerando slippage da primeira perna
          const amountInSecondHop = firstHopQuote.output
            .mul(10000 - Math.floor(slippageSecondHop * 10000))
            .div(10000);

          // Obtem o melhor quote para intermediate -> base (usando amountIn aproximado)
          const secondHopQuote = await getBestQuoteAcrossDEXs({
            tokenIn: intermediate.address,
            tokenOut: baseToken.address,
            amountIn: amountInSecondHop,
            quoteCache,
          });

          if (!secondHopQuote) return null;

          const finalAmountOut = secondHopQuote.output;
          if (finalAmountOut.lte(amountIn)) return null;

          const profit = finalAmountOut.sub(amountIn);

          // Evita estimar gas se lucro bruto for pequeno
          if (
            profit.lte(
              ethers.utils.parseUnits(MIN_PROFIT_THRESHOLD.toString(), baseToken.decimals)
            )
          )
            return null;

          // Estima gas e custo
          const gasEstimate = await estimateGasUsage([
            baseToken.address,
            intermediate.address,
            baseToken.address,
          ]);

          const gasCost = await getGasCostInToken({
            provider,
            token: baseToken,
            gasUnits: gasEstimate,
          });

          const netProfit = profit.sub(gasCost);

          if (enableDebugLog) {
            const netProfitReadable = ethers.utils.formatUnits(netProfit, baseToken.decimals);
            const grossProfitReadable = ethers.utils.formatUnits(profit, baseToken.decimals);
            console.debug(
              `[${baseToken.symbol}→${intermediate.symbol}→${baseToken.symbol}] | ${firstHopQuote.dex}→${secondHopQuote.dex} | Gross: ${grossProfitReadable} | Net: ${netProfitReadable}`
            );
          }

          if (
            netProfit.gt(maxNetProfit) &&
            netProfit.gt(
              ethers.utils.parseUnits(MIN_PROFIT_THRESHOLD.toString(), baseToken.decimals)
            )
          ) {
            // Slippage adaptada para saída final
            const slippageFinal =50;
            const amountOutMin = finalAmountOut
              .mul(10000 - Math.floor(slippageFinal * 10000))
              .div(10000);

            const route = [
              {
                tokenIn: baseToken,
                tokenOut: intermediate,
                dex: firstHopQuote.dex,
                amountIn,
                amountOut: firstHopQuote.output,
              },
              {
                tokenIn: intermediate,
                tokenOut: baseToken,
                dex: secondHopQuote.dex,
                amountIn: firstHopQuote.output,
                amountOut: finalAmountOut,
              },
            ];

            const combinedQuote: QuoteResult = {
              amountIn: BigInt(amountIn.toString()),
              amountOut: BigInt(finalAmountOut.toString()),
              amountOutMin: BigInt(amountOutMin.toString()),
              estimatedGas: gasEstimate,
              path: [baseToken, intermediate, baseToken],
              dex: `${firstHopQuote.dex}→${secondHopQuote.dex}`,
            };

            return {
              route,
              quote: combinedQuote,
              gasCost: BigInt(gasCost.toString()),
              netProfit: BigInt(netProfit.toString()),
              inputAmount: amountIn,
            };
          }

          return null;
        } catch (e) {
          if (enableDebugLog) {
            console.warn(`Erro ao processar token ${intermediate.symbol}:`, e);
          }
          return null;
        }
      })
    );

    for (const candidate of batchResults) {
      if (candidate && ethers.BigNumber.from(candidate.netProfit.toString()).gt(maxNetProfit)) {
        maxNetProfit = ethers.BigNumber.from(candidate.netProfit.toString());
        bestRoute = candidate;
      }
    }
  }

  if (!bestRoute) {
    throw new Error("Nenhuma rota de arbitragem encontrada.");
  }

  return bestRoute;
}
