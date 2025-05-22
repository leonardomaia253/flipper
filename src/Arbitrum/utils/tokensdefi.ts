import axios from 'axios';

export interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
}

interface LlamaToken {
  address: string;
  symbol: string;
  decimals: number;
  volume24hUSD?: number;
}

let cache: {
  timestamp: number;
  data: TokenInfo[];
} | null = null;

const CACHE_DURATION_MS = 60_000; // 1 minuto
const MAX_RETRIES = 3;
const LLAMA_API_URL = 'https://api.llama.fi/token/arbitrum';

// 🔁 Retry com backoff simples
async function fetchWithRetries(url: string, retries = MAX_RETRIES): Promise<LlamaToken[]> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await axios.get<{ tokens: LlamaToken[] }>(url);
      return res.data.tokens;
    } catch (err) {
      const wait = 1000 * (attempt + 1); // Espera crescente: 1s, 2s, 3s
      console.warn(`⚠️ Erro na tentativa ${attempt + 1}, tentando novamente em ${wait}ms...`);
      await new Promise((res) => setTimeout(res, wait));
    }
  }
  throw new Error('❌ Falha ao buscar dados da API da DeFi Llama após várias tentativas.');
}

// 🛟 Fallback de tokens mais comuns na Arbitrum
const fallbackTokens: TokenInfo[] = [
  { address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1', symbol: 'WETH', decimals: 18 },
  { address: '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8', symbol: 'USDC', decimals: 6 },
  { address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', symbol: 'USDT', decimals: 6 },
  { address: '0x2f2a2543b76a4166549f7aaab1e4cdd31fA95eF3', symbol: 'WBTC', decimals: 8 },
  { address: '0x912CE59144191C1204E64559FE8253a0e49E6548', symbol: 'ARB', decimals: 18 },
];

export async function fetchTopTokensArbitrum(limit: number = 200): Promise<TokenInfo[]> {
  const now = Date.now();

  // ✅ Cache em memória (válido por 1 minuto)
  if (cache && now - cache.timestamp < CACHE_DURATION_MS) {
    return cache.data.slice(0, limit);
  }

  try {
    const tokens = await fetchWithRetries(LLAMA_API_URL);

    const sorted = tokens
      .filter(t => t.address && t.symbol && t.decimals != null && t.volume24hUSD != null)
      .sort((a, b) => b.volume24hUSD! - a.volume24hUSD!)
      .slice(0, limit);

    const result: TokenInfo[] = sorted.map(({ address, symbol, decimals }) => ({
      address,
      symbol,
      decimals,
    }));

    cache = { timestamp: now, data: result };
    return result;
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);

    console.warn("⚠️ Usando fallback local com tokens mais comuns da Arbitrum.");
    return fallbackTokens.slice(0, limit);
  }
}

