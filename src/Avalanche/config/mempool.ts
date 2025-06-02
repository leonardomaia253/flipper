import WebSocket from "ws";
(globalThis as any).WebSocket = WebSocket;
import { Transaction } from "ethers";
import { WebSocketProvider, TransactionResponse } from "ethers";
import { SWAP_FUNCTION_SIGNATURES, ALLOWED_ADDRESSES } from "../constants/addresses";
import { LRUCache } from "lru-cache";
import pLimit from "p-limit";
import fastq from "fastq";

type SupportedProvider = WebSocketProvider;

interface ProviderState {
  seenTxs: LRUCache<string, boolean>;
  highPriorityQueue: TxInQueue[];
  lowPriorityQueue: TxInQueue[];
  errorCount: number;
  circuitOpen: boolean;
  processedTxsInInterval: number;
  onValidTxCallback: (txHash: string, rawTx: string) => void;
  metrics: ProviderMetrics;
}

interface ProviderMetrics {
  totalProcessed: number;
  totalErrors: number;
  lastProcessingDurationMs: number;
}

interface TxInQueue {
  txHash: string;
}

const INTERVAL_MS = 20000;
const MAX_TXS_PER_INTERVAL = 6000;
const ERROR_THRESHOLD = 50;
const CIRCUIT_BREAKER_TIMEOUT = 30000;
const MAX_QUEUE_SIZE = 2000;
const SEEN_TXS_CACHE_SIZE = 2000;
const MAX_PARALLEL_RPC_CALLS = 10;
const BASE_RETRY_DELAY_MS = 1000;
const MAX_RETRIES = 3;
const MAX_PENDING_PROCESS = 100;
const DYNAMIC_THRESHOLD = 50;

const providerStates = new Map<SupportedProvider, ProviderState>();
let providers: SupportedProvider[] = [];

const pendingTxHashesQueue: string[] = [];

class DynamicQueue {
  private limit = pLimit(MAX_PARALLEL_RPC_CALLS);
  private fastQueue = fastq(this.worker.bind(this), MAX_PARALLEL_RPC_CALLS);
  private threshold: number;
  private usingFastq = false;

  constructor(threshold = DYNAMIC_THRESHOLD) {
    this.threshold = threshold;
  }

  private async worker(task: () => Promise<void>, cb: (err: any) => void) {
    try {
      await task();
      cb(null);
    } catch (err) {
      cb(err);
    }
  }

  public push(task: () => Promise<void>, currentQueueSize: number) {
    if (currentQueueSize >= this.threshold) {
      if (!this.usingFastq) {
        console.log("⚡️ Switching to fastq mode");
        this.usingFastq = true;
      }
      this.fastQueue.push(task);
    } else {
      if (this.usingFastq) {
        console.log("🐢 Switching to p-limit mode");
        this.usingFastq = false;
      }
      this.limit(() => task());
    }
  }
}

const dynamicQueue = new DynamicQueue();

function initProviderState(provider: SupportedProvider, onValidTx: (txHash: string, rawTx: string) => void) {
  providerStates.set(provider, {
    seenTxs: new LRUCache({ max: SEEN_TXS_CACHE_SIZE }),
    highPriorityQueue: [],
    lowPriorityQueue: [],
    errorCount: 0,
    circuitOpen: false,
    processedTxsInInterval: 0,
    onValidTxCallback: onValidTx,
    metrics: { totalProcessed: 0, totalErrors: 0, lastProcessingDurationMs: 0 }
  });

  setInterval(() => resetInterval(provider), INTERVAL_MS);
  setInterval(() => processTxFromQueue(provider), INTERVAL_MS);
}

function getProviderState(provider: SupportedProvider): ProviderState {
  const state = providerStates.get(provider);
  if (!state) throw new Error("Provider state not initialized");
  return state;
}

function selectBestProvider(): SupportedProvider | null {
  const healthyProviders = providers.filter(p => !getProviderState(p).circuitOpen);
  if (!healthyProviders.length) return null;
  healthyProviders.sort((a, b) => {
    const stateA = getProviderState(a);
    const stateB = getProviderState(b);
    return (stateA.highPriorityQueue.length + stateA.lowPriorityQueue.length) - (stateB.highPriorityQueue.length + stateB.lowPriorityQueue.length);
  });
  return healthyProviders[0];
}

function resetInterval(provider: SupportedProvider) {
  const state = getProviderState(provider);
  state.processedTxsInInterval = 0;
  state.errorCount = 0;
}

function circuitBreakerRecordError(provider: SupportedProvider) {
  const state = getProviderState(provider);
  state.errorCount++;
  state.metrics.totalErrors++;
  if (state.errorCount >= ERROR_THRESHOLD && !state.circuitOpen) {
    console.error(`🚨 Circuit breaker aberto após ${state.errorCount} erros no provider!`);
    state.circuitOpen = true;
    setTimeout(() => {
      state.errorCount = 0;
      state.circuitOpen = false;
      console.log("✅ Circuit breaker fechado.");
    }, CIRCUIT_BREAKER_TIMEOUT);
  }
}

function isSwapTx(data?: string): boolean {
  return !!data && SWAP_FUNCTION_SIGNATURES.has(data.slice(0, 10));
}

function rateLimitCheck(state: ProviderState): boolean {
  return state.processedTxsInInterval < MAX_TXS_PER_INTERVAL;
}

function enqueueTransaction(state: ProviderState, tx: TxInQueue, to: string, data?: string) {
  const isHighPriority = ALLOWED_ADDRESSES.has(to.toLowerCase()) && isSwapTx(data);
  const totalQueueSize = state.highPriorityQueue.length + state.lowPriorityQueue.length;
  if (totalQueueSize >= MAX_QUEUE_SIZE) return;
  isHighPriority ? state.highPriorityQueue.push(tx) : state.lowPriorityQueue.push(tx);
}

async function rpcCallWithRetry<T>(provider: SupportedProvider, method: string, params: any[], retries = MAX_RETRIES): Promise<T | null> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await provider.send(method, params);
    } catch (err: any) {
      const rateLimited = err?.error?.code === -32097 || err?.message?.toLowerCase().includes("rate limit");
      if (!rateLimited || i === retries) break;
      await new Promise(res => setTimeout(res, BASE_RETRY_DELAY_MS * (i + 1)));
    }
  }
  return null;
}

async function processTxFromQueue(provider: SupportedProvider) {
  const state = getProviderState(provider);
  if (state.circuitOpen) return;

  const availableSlots = MAX_TXS_PER_INTERVAL - state.processedTxsInInterval;
  const processableHigh = Math.min(state.highPriorityQueue.length, availableSlots);
  const remainingSlots = availableSlots - processableHigh;
  const processableLow = Math.min(state.lowPriorityQueue.length, remainingSlots);

  const batch = [
    ...state.highPriorityQueue.splice(0, processableHigh),
    ...state.lowPriorityQueue.splice(0, processableLow)
  ];

  if (!batch.length) return;

  const currentQueueSize = state.highPriorityQueue.length + state.lowPriorityQueue.length;

  console.log(`🔄 processTxFromQueue: processando ${batch.length} transações`);

  await Promise.allSettled(
    batch.map(({ txHash }) =>
      dynamicQueue.push(async () => {
        if (state.seenTxs.has(txHash)) return;
        const tx = await rpcCallWithRetry<TransactionResponse>(provider, "eth_getTransactionByHash", [txHash]);
        if (tx) await processTransaction(provider, tx);
      }, currentQueueSize)
    )
  );
}

async function processTransaction(provider: SupportedProvider, tx: TransactionResponse) {
  const state = getProviderState(provider);
  if (state.circuitOpen) return;

  const { hash, to } = tx;
  const data = tx.data ?? (tx as any).input;

  if (!hash || !to || !data) return;
  if (!ALLOWED_ADDRESSES.has(to.toLowerCase())) return;
  if (!isSwapTx(data)) return;
  if (state.seenTxs.has(hash)) return;

  state.seenTxs.set(hash, true);

  if (!rateLimitCheck(state)) {
    enqueueTransaction(state, { txHash: hash }, to, data);
    return;
  }

  state.processedTxsInInterval++;
  state.metrics.totalProcessed++;

  console.log(`✅ processTransaction: processando ${hash}`);

  let rawTx = await rpcCallWithRetry<string>(provider, "eth_getRawTransactionByHash", [hash]);

  if (!rawTx && tx.signature) {
    try {
      const txObject = { ...tx, chainId: Number(tx.chainId) };
      const txObj = Transaction.from(txObject);
      rawTx = txObj.serialized;
    } catch (err) {
      circuitBreakerRecordError(provider);
      return;
    }
  }

  if (rawTx) state.onValidTxCallback(hash, rawTx);
}

async function handlePendingTx(txHash: string) {
  console.log(`🔍 Handling pending tx: ${txHash}`);
  const provider = selectBestProvider();
  if (!provider) {
    console.warn(`⚠️ Nenhum provider saudável para tx: ${txHash}`);
    return;
  }

  const state = getProviderState(provider);
  if (state.circuitOpen) {
    console.warn(`⚠️ Circuit breaker aberto, ignorando tx: ${txHash}`);
    return;
  }

  const tx = await rpcCallWithRetry<TransactionResponse>(provider, "eth_getTransactionByHash", [txHash]);
  if (!tx || !tx.to) {
    console.warn(`⚠️ Transação inválida ou sem destino: ${txHash}`);
    return;
  }

  const isHighPriority = ALLOWED_ADDRESSES.has(tx.to.toLowerCase()) && isSwapTx(tx.data);
  console.log(`🔬 Prioridade da tx ${txHash}: ${isHighPriority ? "ALTA" : "baixa"}`);

  if (!rateLimitCheck(state)) {
    enqueueTransaction(state, { txHash }, tx.to, tx.data);
  } else if (isHighPriority) {
    await processTransaction(provider, tx);
  }
}

function enqueuePendingTxHash(txHash: string) {
  console.log(`📥 Enfileirando tx: ${txHash}`);
  if (pendingTxHashesQueue.length < MAX_QUEUE_SIZE) {
    pendingTxHashesQueue.push(txHash);
  } else {
    console.warn(`⚠️ Fila cheia, descartando tx: ${txHash}`);
  }
}

function processPendingTxHashes() {
  console.log(`🔄 Chamando processPendingTxHashes. Fila atual: ${pendingTxHashesQueue.length}`);
  const batch = pendingTxHashesQueue.splice(0, MAX_PENDING_PROCESS);
  console.log(`🚀 Processando batch de ${batch.length} txs pendentes`);

  const currentQueueSize = pendingTxHashesQueue.length;

  batch.forEach(txHash => {
    console.log(`🔧 Enviando tx ${txHash} para dynamicQueue`);
    dynamicQueue.push(() => handlePendingTx(txHash), currentQueueSize);
  });
}

setInterval(processPendingTxHashes, INTERVAL_MS / 2);

export function startListeners(inputProviders: SupportedProvider[], onValidTx: (txHash: string, rawTx: string) => void) {
  providers = inputProviders;
  for (const provider of providers) {
    initProviderState(provider, onValidTx);

    const url = (provider as any).connection?.url ?? "unknown";

    provider.send("eth_subscribe", ["newPendingTransactions"]) 
      .then(() => {
        console.log(`[${url}] ✅ Subscrito em newPendingTransactions.`);

        provider.on("pending", (txHash: string) => {
          console.log(`[${url}] 🚨 pending recebido: ${txHash}`);
          enqueuePendingTxHash(txHash);
        });

        // Fallback low-level listener:
        const ws = (provider as any)._websocket;
        if (ws && ws.on) {
          ws.on('message', (data: any) => {
            try {
              const parsed = JSON.parse(data);
              if (parsed.method === 'eth_subscription' && parsed.params?.result) {
                const txHash = parsed.params.result;
                console.log(`[${url}] ⚡️ Low-level recebido: ${txHash}`);
                enqueuePendingTxHash(txHash);
              }
            } catch (e) {
              console.error(`[${url}] ❌ Erro no parsing da mensagem:`, e);
            }
          });
        }
      })
      .catch(err => {
        console.error(`[${url}] ❌ Falha na subscrição:`, err);
      });
  }
}
