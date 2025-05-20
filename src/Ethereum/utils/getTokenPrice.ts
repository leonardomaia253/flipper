import { ethers } from "ethers";
import axios from "axios";
import { LRUCache } from "lru-cache";

// === Constantes ===
const WETH_ADDRESS = "0x82af49447d8a07e3bd95bd0d56f35241523fbab1"; // Arbitrum WETH
const TIMEOUT = 3000;

// === ERC20 Interface ===
const erc20Interface = new ethers.utils.Interface([
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
]);

// === Caches ===
const priceCache = new LRUCache<string, { price: number; timestamp: number }>({
  max: 500,
  ttl: 1000 * 60 * 5,
});
const decimalsCache = new LRUCache<string, number>({
  max: 200,
  ttl: 1000 * 60 * 60,
});

// === Utils ===
function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

async function getDecimals(tokenAddress: string, provider: ethers.providers.Provider): Promise<number> {
  const normalized = normalizeAddress(tokenAddress);
  const cached = decimalsCache.get(normalized);
  if (cached !== undefined) return cached;

  try {
    const contract = new ethers.Contract(normalized, erc20Interface, provider);
    const decimals = await contract.decimals();
    decimalsCache.set(normalized, decimals);
    return decimals;
  } catch (error) {
      console.warn(`Fallback to 18 decimals for ${normalized}:`, (error as Error)?.message ?? error);

    decimalsCache.set(normalized, 18);
    return 18;
  }
}

// === Fontes de preço ===
async function fetchFromCoinGecko(address: string): Promise<number | null> {
  try {
    const url = `https://api.coingecko.com/api/v3/simple/token_price/arbitrum-one?contract_addresses=${address}&vs_currencies=eth`;
    const { data } = await axios.get(url, { timeout: TIMEOUT });
    return data?.[address]?.eth ?? null;
  } catch (error) {
    console.warn(`Coingecko error for ${address}:`, (error as Error)?.message ?? error)
    return null;
  }
}

async function fetchFrom1inch(
  tokenAddress: string,
  provider: ethers.providers.Provider
): Promise<number | null> {
  try {
    const amount = "1000000000000000000"; // 1 token (in 1e18)
    const url = `https://api.1inch.io/v5.0/42161/quote?fromTokenAddress=${tokenAddress}&toTokenAddress=${WETH_ADDRESS}&amount=${amount}`;
    const { data } = await axios.get(url, { timeout: TIMEOUT });

    if (!data.toTokenAmount) return null;

    const decimals = await getDecimals(tokenAddress, provider);
    const toTokenAmount = ethers.utils.formatEther(data.toTokenAmount);
    const baseAmount = ethers.utils.formatUnits(amount, decimals);
    return parseFloat(toTokenAmount) / parseFloat(baseAmount);
  } catch (error) {
    console.warn(`Fallback to 18 decimals for ${tokenAddress}:`, (error as Error)?.message ?? error);

    return null;
  }
}

async function fetchFromSushiSwap(address: string): Promise<number | null> {
  try {
    const query = `{ token(id: "${address}") { derivedETH } }`;
    const { data } = await axios.post(
      "https://api.thegraph.com/subgraphs/name/sushiswap/arbitrum-exchange",
      { query },
      { timeout: TIMEOUT }
    );
    return parseFloat(data?.data?.token?.derivedETH ?? "0") || null;
  } catch (error) {
    console.warn(`SushiSwap error for ${address}:`, (error as Error)?.message ?? error);

    return null;
  }
}

// === Função principal ===
export async function getTokenPrice(
  tokenAddress: string,
  provider: ethers.providers.Provider
): Promise<number> {
  const address = normalizeAddress(tokenAddress);

  // Return 1 for WETH
  if (address === normalizeAddress(WETH_ADDRESS)) return 1;

  // Cache check
  const cached = priceCache.get(address);
  if (cached && Date.now() - cached.timestamp < 1000 * 60 * 5) {
    return cached.price;
  }

  // Fetch from sources
  const sources = [
    () => fetchFromCoinGecko(address),
    () => fetchFrom1inch(address, provider),
    () => fetchFromSushiSwap(address),
  ];

  for (const source of sources) {
    const price = await source();
    if (price && price > 0) {
      priceCache.set(address, { price, timestamp: Date.now() });
      return price;
    }
  }

  console.error(`Failed to fetch price for ${address} from all sources`);
  return 0;
}

export async function getTokenValueInETH(
  tokenAddress: string,
  amount: ethers.BigNumberish,
  provider: ethers.providers.Provider
): Promise<ethers.BigNumber> {
  try {
    const decimals = await getDecimals(tokenAddress, provider);
    const price = await getTokenPrice(tokenAddress, provider);
    const amountInEth = parseFloat(ethers.utils.formatUnits(amount, decimals)) * price;
    return ethers.utils.parseEther(amountInEth.toString());
  } catch (error) {
    console.warn(`Error in getTokenValueInETH for ${tokenAddress}:`, (error as Error)?.message ?? error);

    return ethers.constants.Zero;
  }
}

export async function getTokenPriceInETH(
  tokenAddress: string,
  provider: ethers.providers.Provider
): Promise<number> {
  return getTokenPrice(tokenAddress, provider);
}
