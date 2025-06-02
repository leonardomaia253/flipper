import { ethers } from "ethers";
import fetch from "node-fetch";

// ABI padrão do AggregatorV3Interface da Chainlink
const aggregatorV3InterfaceABI = [
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
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

// Tipagem para CoinGecko
type CoinGeckoPriceResponse = {
  [tokenId: string]: {
    eth?: number;
  };
};

// Mapear feeds Chainlink por token e rede
const chainlinkFeeds: Record<string, Record<string, string>> = {
  arbitrum: {
    USDC: "0x....", // Exemplo: USDC/ETH feed na Arbitrum
    DAI: "0x....",
  },
  ethereum: {
    USDC: "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6", // Exemplo real: USDC/ETH feed Ethereum
    DAI: "0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9",
  },
  // Adicione outras redes e tokens conforme necessário
};

/**
 * Obtém endereço do feed Chainlink para o token e rede.
 */
function getChainlinkFeedAddress(tokenSymbol: string, network: string): string | null {
  const lowerSymbol = tokenSymbol.toUpperCase();
  return chainlinkFeeds[network]?.[lowerSymbol] || null;
}

/**
 * Busca preço Chainlink: token -> ETH
 */
async function getTokenPriceInEthChainlink(
  feedAddress: string,
  provider: ethers.JsonRpcProvider
): Promise<bigint> {
  const feed = new ethers.Contract(feedAddress, aggregatorV3InterfaceABI, provider);

  const [roundData, decimals] = await Promise.all([feed.latestRoundData(), feed.decimals()]);
  const answer = BigInt(roundData.answer.toString());

  if (answer <= 0n) throw new Error("Invalid price from Chainlink feed");

  // Ajusta para 18 decimais padrão
  const price = answer * 10n ** (18n - BigInt(decimals));

  return price;
}

/**
 * Fallback: busca preço na CoinGecko
 */
async function getPriceFromCoinGecko(tokenSymbol: string): Promise<bigint> {
  try {
    const tokenId = tokenSymbol.toLowerCase();
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=eth`;

    const response = await fetch(url);
    const data = (await response.json()) as CoinGeckoPriceResponse;

    const ethPrice = data[tokenId]?.eth;
    if (ethPrice === undefined) {
      console.warn(`CoinGecko: preço para ${tokenSymbol} não encontrado.`);
      return 0n;
    }

    // Converte float → bigint com 18 decimais
    const priceBigInt = BigInt(Math.floor(ethPrice * 1e18));
    return priceBigInt;
  } catch (err) {
    console.error(`Erro ao buscar preço na CoinGecko para ${tokenSymbol}:`, err);
    return 0n;
  }
}

/**
 * Obtém preço do token em ETH, preferencialmente via Chainlink, com fallback para CoinGecko.
 */
export async function getTokenPriceInEthDynamic({
  tokenSymbol,
  provider,
  network = "polygon",
}: {
  tokenSymbol: string;
  provider: ethers.JsonRpcProvider;
  network?: string;
}): Promise<bigint> {
  const feedAddress = getChainlinkFeedAddress(tokenSymbol, network);

  if (feedAddress) {
    try {
      const price = await getTokenPriceInEthChainlink(feedAddress, provider);
      if (price > 0n) {
        console.log(`Preço Chainlink de ${tokenSymbol}: ${price.toString()} wei`);
        return price;
      }
    } catch (err) {
      console.warn(`Erro Chainlink para ${tokenSymbol}: ${err}. Usando CoinGecko...`);
    }
  } else {
    console.warn(`Sem feed Chainlink configurado para ${tokenSymbol} na rede ${network}.`);
  }

  // Fallback: CoinGecko
  const priceCoingecko = await getPriceFromCoinGecko(tokenSymbol);
  console.log(`Preço CoinGecko de ${tokenSymbol}: ${priceCoingecko.toString()} wei`);
  return priceCoingecko;
}
