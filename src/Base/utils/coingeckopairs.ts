import axios from 'axios';
import { ethers } from 'ethers';
import fs from 'fs/promises';
import path from 'path';

export interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
}

interface CoinGeckoToken {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
}

let cache: {
  timestamp: number;
  data: TokenInfo[];
} | null = null;

let currentFetchPromise: Promise<TokenInfo[]> | null = null;

const CACHE_DURATION_MS = 86_400_000; // 24 horas
const COINGECKO_ARBITRUM_URL = 'https://tokens.coingecko.com/arbitrum-one/all.json';
const OUTPUT_FILE = path.join(__dirname, 'arbitrum_tokens.json');

const fallbackTokens: TokenInfo[] = [
  { address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1', symbol: 'WETH', decimals: 18 },
  { address: '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8', symbol: 'USDC', decimals: 6 },
  { address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', symbol: 'USDT', decimals: 6 },
  { address: '0x2f2a2543b76a4166549f7aaab1e4cdd31fa95ef3', symbol: 'WBTC', decimals: 8 },
];

async function saveToJson(tokens: TokenInfo[]): Promise<void> {
  try {
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(tokens, null, 2));
    console.log(`✅ Tokens salvos em: ${OUTPUT_FILE}`);
  } catch (err) {
    console.error(`❌ Falha ao salvar tokens em JSON:`, err);
  }
}

export async function fetchTopTokensBase(
  limit: number = 200
): Promise<TokenInfo[]> {
  const now = Date.now();

  if (cache && now - cache.timestamp < CACHE_DURATION_MS) {
    console.log('✅ Usando cache de tokens Base.');
    return cache.data.slice(0, limit);
  }

  if (currentFetchPromise) {
    return currentFetchPromise;
  }

  currentFetchPromise = (async () => {
    try {
      const response = await axios.get<{ tokens: CoinGeckoToken[] }>(COINGECKO_ARBITRUM_URL);
      const tokens = response.data.tokens;

      const arbitrumTokens: TokenInfo[] = tokens
        .filter(t => t.address.startsWith('0x') && t.address.length === 42)
        .map(t => ({
          address: t.address,
          symbol: t.symbol,
          decimals: t.decimals,
        }))
        .slice(0, limit);

      cache = { timestamp: now, data: arbitrumTokens };
      console.log('✅ Tokens da Base atualizados e cacheados.');

      await saveToJson(arbitrumTokens);

      return arbitrumTokens;
    } catch (err) {
      console.error(`❌ Erro ao buscar tokens da CoinGecko:`, err);
      console.warn('⚠️ Usando fallback local com tokens mais comuns da Base.');

      cache = { timestamp: now, data: fallbackTokens };
      await saveToJson(fallbackTokens);

      return fallbackTokens.slice(0, limit);
    } finally {
      currentFetchPromise = null;
    }
  })();

  return currentFetchPromise;
}
