import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { DexPair } from './types';
import { BigNumberish } from 'ethers';

const OUTPUT_FILE = path.join(__dirname, 'arbitrum_dex_pairs.json');
const CACHE_DURATION_MS = 86_400_000; // 24 horas

const ALLOWED_DEXES = [
  'uniswap-v2',
  'uniswap-v3',
  'sushiswap-v2',
  'sushiswap-v3',
  'pancakeswap-v3',
  'camelot',
  'ramses-v2',
];

interface CacheMeta {
  timestamp: number;
  data: DexPair[];
}

let cache: CacheMeta | null = null;

async function loadCache(): Promise<void> {
  try {
    const content = await fs.readFile(OUTPUT_FILE, 'utf-8');
    const parsed: CacheMeta = JSON.parse(content);
    if (Date.now() - parsed.timestamp < CACHE_DURATION_MS) {
      cache = parsed;
      console.log('✅ Cache carregado e válido.');
    } else {
      console.log('ℹ️ Cache expirado, será atualizado.');
    }
  } catch {
    console.log('ℹ️ Nenhum cache encontrado, será criado.');
  }
}

async function saveCache(data: DexPair[]): Promise<void> {
  const meta: CacheMeta = {
    timestamp: Date.now(),
    data
  };
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(meta, null, 2));
  console.log(`✅ ${data.length} pares salvos em cache: ${OUTPUT_FILE}`);
}

export async function fetchDexScreenerPairsArbitrum(limit = 500): Promise<DexPair[]> {
  await loadCache();
  if (cache) {
    console.log('✅ Usando cache de pares.');
    return cache.data.slice(0, limit);
  }

  try {
    const url = 'https://api.dexscreener.com/latest/dex/pairs/arbitrum';
    const response = await axios.get<{ pairs: any[] }>(url);

    const filteredPairs: DexPair[] = response.data.pairs
      .filter(p => ALLOWED_DEXES.includes(p.dexId))
      .slice(0, limit)
      .map(p => ({
        pairaddress: p.pairaddress,
        dex: p.dexId,
        url: p.url,
        tokenIn: {
          address: p.baseToken.address,
          symbol: p.baseToken.symbol,
          decimals:p.baseToken.decimals
        },
        tokenOut: {
          address: p.quoteToken.address,
          symbol: p.quoteToken.symbol,
          decimals: p.quoteToken.decimals,
        },
        liquidity: {
          usd: Number(p.liquidity?.usd) || 0,
        },
        volume24h: {
          usd: Number(p.volume?.h24) || 0,
        },
        priceNative: p.priceNative,
        priceUsd: p.priceUsd,
      }));

    await saveCache(filteredPairs);

    return filteredPairs;
  } catch (err) {
    console.error('❌ Erro ao buscar ou processar pares:', err);
    return [];
  }
}