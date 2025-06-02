import { ethers } from 'ethers';
import fetch from 'node-fetch';
import { LRUCache } from 'lru-cache';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import os from 'os';
import { Interface, Fragment, FunctionFragment } from 'ethers';
import { providersimplewss } from '../../config/provider'; // ajuste o path se precisar
import { TransactionResponse } from 'ethers';

// ======== CONFIGURAÇÕES ========

interface SubgraphResponse {
  data?: {
    users?: { id: string; healthFactor: string }[];
  };
}

type Transaction = {
  to?: string;
  data?: string;
  hash?: string;
};

export interface LiquidationOpportunity {
  txHash: string;
  protocol: Protocol;
  liquidated: string;
  targetContract: string;
  liquidationSelector: string;
  calldata: {
    functionName: 'liquidateCall' | 'liquidateBorrow' | 'liquidate';
    args: any; // mais específico se quiser
  };
  fullTx: ethers.TransactionResponse;
}

interface DecodedCalldata {
  functionName: 'liquidateCall' | 'liquidateBorrow' | 'liquidate';
  args: LiquidationArgs;
}

type LiquidationArgs =
  | { user: string; collateral: string; debtToCover: string; receiveAToken: boolean }
  | { borrower: string; repayAmount: string; cTokenCollateral: string }
  | { user: string; collateral: string; amount: string };

const SUBGRAPHS = {
  aave: 'https://api.thegraph.com/subgraphs/name/aave/protocol-v2',
  compound: 'https://api.thegraph.com/subgraphs/name/graphprotocol/compound-v2',
  morpho: 'https://api.thegraph.com/subgraphs/name/morpho-dao/morpho-ethereum-mainnet',
} as const;

const PROTOCOL_ADDRESSES = {
  aave: '0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9',
  compound: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
  morpho: '0x777777c9898d384f785ee44acfe945efdf56fb2e',
} as const;

const LIQUIDATION_SELECTORS = {
  aave: '0x4d6f27f8',
  compound: '0xf5e3c462',
  morpho: '0x83e47e3f',
} as const;

const LIQUIDATION_ABIS = {
  aave: ["function liquidateCall(address user, address collateral, uint256 debtToCover, bool receiveAToken)"],
  compound: ["function liquidateBorrow(address borrower, uint256 repayAmount, address cTokenCollateral)"],
  morpho: ["function liquidate(address user, address collateral, uint256 amount)"],
} as const;

const HEALTH_FACTOR_THRESHOLD = 1.2;
const WATCHLIST_REFRESH_INTERVAL = 60 * 1000;

const watchlist = new LRUCache<string, true>({
  max: 10_000,
  ttl: 5 * 60 * 1000,
});

type Protocol = keyof typeof PROTOCOL_ADDRESSES;

// ======== UTILITÁRIOS ========

function getProtocolByAddress(address: string): Protocol | null {
  address = address.toLowerCase();
  for (const [protocol, addr] of Object.entries(PROTOCOL_ADDRESSES)) {
    if (addr === address) return protocol as Protocol;
  }
  return null;
}

function isLiquidationTx(txData: string, toAddress: string): Protocol | null {
  toAddress = toAddress.toLowerCase();
  for (const [protocol, addr] of Object.entries(PROTOCOL_ADDRESSES)) {
    if (addr !== toAddress) continue;
    const selector = txData.slice(0, 10).toLowerCase();
    if (LIQUIDATION_SELECTORS[protocol as Protocol] === selector) {
      return protocol as Protocol;
    }
  }
  return null;
}

function isFunctionFragment(fragment: Fragment): fragment is FunctionFragment {
  return fragment.type === 'function';
}

function decodeCalldata(protocol: Protocol, txData: string): DecodedCalldata | null {
  try {
    const iface = new Interface(LIQUIDATION_ABIS[protocol]);
    const selector = txData.slice(0, 10);

    // Procura fragmento pelo selector
    const fragment = iface.fragments.find(f => f.format('sighash') === selector);
    if (!fragment || !isFunctionFragment(fragment)) {
      console.warn(`⚠️ Selector ${selector} não encontrado no ABI do protocolo ${protocol}`);
      return null;
    }

    const funcFragment = iface.getFunction(fragment.name);
    if (!funcFragment) {
      console.warn(`⚠️ Função ${fragment.name} não encontrada na interface do protocolo ${protocol}`);
      return null;
    }

    const decoded = iface.decodeFunctionData(funcFragment, txData);

    let args: LiquidationArgs;
    switch (funcFragment.name) {
      case 'liquidateCall':
        args = {
          user: decoded.user,
          collateral: decoded.collateral,
          debtToCover: decoded.debtToCover.toString(),
          receiveAToken: decoded.receiveAToken,
        };
        break;
      case 'liquidateBorrow':
        args = {
          borrower: decoded.borrower,
          repayAmount: decoded.repayAmount.toString(),
          cTokenCollateral: decoded.cTokenCollateral,
        };
        break;
      case 'liquidate':
        args = {
          user: decoded.user,
          collateral: decoded.collateral,
          amount: decoded.amount.toString(),
        };
        break;
      default:
        console.warn(`⚠️ Função inesperada: ${funcFragment.name}`);
        return null;
    }

    return {
      functionName: funcFragment.name as 'liquidateCall' | 'liquidateBorrow' | 'liquidate',
      args,
    };
  } catch (e) {
    console.warn(`⚠️ Falha ao decodificar calldata para protocolo ${protocol}:`, e);
    return null;
  }
}

// ======== FUNÇÃO: Atualiza watchlist via subgraphs ========

async function updateWatchlist() {
  console.log('🔄 Atualizando watchlist via subgraphs...');
  try {
    for (const [protocol, url] of Object.entries(SUBGRAPHS)) {
      const query = `
        {
          users(first: 1000, where: { healthFactor_lt: "${(HEALTH_FACTOR_THRESHOLD * 1e18).toFixed(0)}" }) {
            id
            healthFactor
          }
        }
      `;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const json = await res.json() as SubgraphResponse;
      const users = json.data?.users || [];
      for (const user of users) {
        watchlist.set(user.id.toLowerCase(), true);
      }
      console.log(`✅ ${protocol}: ${users.length} usuários adicionados.`);
    }
    console.log(`📊 Watchlist total: ${watchlist.size} endereços.`);
  } catch (err) {
    console.error('❌ Erro na atualização da watchlist:', err);
  }
}

setInterval(updateWatchlist, WATCHLIST_REFRESH_INTERVAL);
updateWatchlist();

// ======== WORKER POOL ========

const NUM_WORKERS = Math.max(2, os.cpus().length - 1);

class WorkerPool {
  private workers: Worker[] = [];
  private idleWorkers: Worker[] = [];
  private queue: { txs: any[]; watchlistKeys: string[]; resolve: Function; reject: Function }[] = [];

  constructor(private file: string) {
    for (let i = 0; i < NUM_WORKERS; i++) {
      const worker = new Worker(this.file);
      worker.on('message', (msg) => this.onMessage(worker, msg));
      worker.on('error', (err) => this.onError(worker, err));
      worker.on('exit', (code) => this.onExit(worker, code));
      this.idleWorkers.push(worker);
    }
  }

  private onMessage(worker: Worker, msg: LiquidationOpportunity[]) {
    const task = this.queue.shift();
    if (task) {
      task.resolve(msg);
    }
    this.idleWorkers.push(worker);
    this.processQueue();
  }

  private onError(worker: Worker, err: Error) {
    const task = this.queue.shift();
    if (task) {
      task.reject(err);
    }
    this.idleWorkers.push(worker);
    this.processQueue();
  }

  private onExit(worker: Worker, code: number) {
    if (code !== 0) console.error(`❌ Worker saiu com código ${code}`);
    const newWorker = new Worker(this.file);
    newWorker.on('message', (msg) => this.onMessage(newWorker, msg));
    newWorker.on('error', (err) => this.onError(newWorker, err));
    newWorker.on('exit', (code) => this.onExit(newWorker, code));
    this.idleWorkers.push(newWorker);
  }

  private processQueue() {
    if (this.queue.length === 0 || this.idleWorkers.length === 0) return;
    const worker = this.idleWorkers.pop()!;
    const task = this.queue[0];
    worker.postMessage({ txs: task.txs, watchlistKeys: task.watchlistKeys });
  }

  runTask(txs: any[], watchlistKeys: string[]): Promise<LiquidationOpportunity[]> {
    return new Promise((resolve, reject) => {
      this.queue.push({ txs, watchlistKeys, resolve, reject });
      this.processQueue();
    });
  }
}

const pool = isMainThread ? new WorkerPool(__filename) : null;

// ======== WORKER THREAD ========

if (!isMainThread) {
  parentPort?.on('message', ({ txs, watchlistKeys }: { txs: TransactionResponse[]; watchlistKeys: string[] }) => {
    const opportunities: LiquidationOpportunity[] = [];
    const watchlistSet = new Set(watchlistKeys.map((k: string) => k.toLowerCase()));

    for (const tx of txs) {
      if (!tx.to || !tx.data) continue;
      const protocol = isLiquidationTx(tx.data, tx.to.toLowerCase());
      if (!protocol) continue;

      const decoded = decodeCalldata(protocol, tx.data);
      if (!decoded) continue;

      let liquidatedUser: string | null = null;

      try {
        if (protocol === 'aave' || protocol === 'morpho') {
          if ('user' in decoded.args) {
            liquidatedUser = decoded.args.user.toLowerCase();
          }
        } else if (protocol === 'compound') {
          if ('borrower' in decoded.args) {
            liquidatedUser = decoded.args.borrower.toLowerCase();
          }
        }
      } catch {
        continue;
      }

      if (liquidatedUser && watchlistSet.has(liquidatedUser)) {
        opportunities.push({
          txHash: tx.hash!,
          protocol,
          liquidated: liquidatedUser,
          targetContract: PROTOCOL_ADDRESSES[protocol],
          liquidationSelector: LIQUIDATION_SELECTORS[protocol],
          calldata: { functionName: decoded.functionName, args: decoded.args },
          fullTx: tx,
        });
      }
    }

    parentPort?.postMessage(opportunities);
  });
}

// ======== LISTENER DE BLOCO ========

async function startBlockListener() {
  console.log('👂 Iniciando listener por novos blocos...');

  const processedBlocks = new Set<number>();

  for (const provider of providersimplewss) {  // providerPool: ethers.WebSocketProvider[]

    provider.on('block', async (blockNumber) => {
      if (processedBlocks.has(blockNumber)) return;  // evita processar 2x o mesmo bloco vindo de diferentes providers
      processedBlocks.add(blockNumber);

      const blockStart = Date.now();

      try {
        const block = await provider.getBlock(blockNumber, true);
        if (!block) {
          console.warn(`⚠️ Bloco ${blockNumber} não disponível no momento.`);
          return;
        }

        const totalTxs = block.transactions.length;

        if (!totalTxs) {
          console.log(`📭 Bloco ${blockNumber} sem transações.`);
          return;
        }

        const watchlistKeys = [...watchlist.keys()];
        const chunkSize = Math.ceil(totalTxs / NUM_WORKERS);
        const tasks = [];

        for (let i = 0; i < totalTxs; i += chunkSize) {
          const chunk = block.transactions.slice(i, i + chunkSize);
          tasks.push(pool!.runTask(chunk, watchlistKeys));
        }

        const taskStart = Date.now();
        const results = await Promise.all(tasks);
        const taskEnd = Date.now();

        let totalOpportunities = 0;

        for (const opportunities of results) {
          totalOpportunities += opportunities.length;
          for (const opp of opportunities) {
            onLiquidationOpportunity(opp);
          }
        }

        const blockEnd = Date.now();
        const blockDuration = blockEnd - blockStart;
        const avgTxTime = (taskEnd - taskStart) / totalTxs;
        const liquidationPct = ((totalOpportunities / totalTxs) * 100).toFixed(2);

        console.log(`📦 Bloco ${blockNumber} processado:`);
        console.log(`   ⏱️ Tempo total: ${blockDuration} ms`);
        console.log(`   🔍 Transações: ${totalTxs}`);
        console.log(`   💣 Oportunidades: ${totalOpportunities}`);
        console.log(`   ⚡ Tempo médio por TX: ${avgTxTime.toFixed(2)} ms`);
        console.log(`   📊 % Liquidações encontradas: ${liquidationPct}%`);

      } catch (err) {
        console.error('❌ Erro ao processar bloco:', err);
      } finally {
        // Mantém o Set limpo para não crescer indefinidamente
        setTimeout(() => processedBlocks.delete(blockNumber), 60 * 1000);  // limpa após 1 min
      }
    });
  }
}

// ======== CALLBACK: Trata oportunidades ========

function onLiquidationOpportunity(opportunity: LiquidationOpportunity) {
  console.log('🚨 Oportunidade detectada:', opportunity);
  mainExecutor(opportunity).catch(err => {
    console.error('❌ Erro no executor:', err);
  });
}

// ======== MAIN EXECUTOR (Placeholder) ========

async function mainExecutor(opportunity: LiquidationOpportunity) {
  // Coloque aqui sua lógica de execução de liquidação.
  console.log('🚀 Executando liquidação para:', opportunity.txHash);
}

// ======== START ========

if (isMainThread) {
  startBlockListener();
}
