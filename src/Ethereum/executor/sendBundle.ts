import { ethers } from 'ethers';
import { JsonRpcProvider } from 'ethers';

interface BundleTx {
  signer: ethers.Wallet;
  transaction: {
    to: string;
    data: string;
    gasLimit: number;
    value?: ethers.BigNumberish;
    nonce?: number;
  };
}

interface SendSignedTxOptions {
  rawTx?: string;
  providers?: ethers.JsonRpcProvider[];
  bundleTxs?: BundleTx[];
  confirmations?: number;
  timeoutMs?: number;
  maxRetries?: number;
  pingTimeoutMs?: number;
  useFlashbots?: boolean;
  flashbotsEndpoint?: string;
  useMevShare?: boolean;
  mevShareEndpoint?: string;
  useBlocksRoute?: boolean;
  blocksRouteEndpoint?: string;
  sendAsBundle?: boolean;
  signerKey?: string;
  simulateBundle?: boolean;
  useEthSendRawTx?: boolean;
  customHeaders?: Record<string, string>;
}

export async function sendSignedTxL2(opts: SendSignedTxOptions) {
  const {
    rawTx,
    providers,
    bundleTxs,
    confirmations = 1,
    timeoutMs = 30000,
    maxRetries = 3,
    pingTimeoutMs = 3000,
    useFlashbots = false,
    flashbotsEndpoint,
    useMevShare = false,
    mevShareEndpoint,
    useBlocksRoute = false,
    blocksRouteEndpoint,
    sendAsBundle = false,
    signerKey,
    simulateBundle = false,
    useEthSendRawTx = false,
    customHeaders = {},
  } = opts;

  const customEndpoint = useFlashbots
    ? flashbotsEndpoint
    : useMevShare
    ? mevShareEndpoint
    : useBlocksRoute
    ? blocksRouteEndpoint
    : null;

  if (sendAsBundle && customEndpoint && bundleTxs && signerKey) {
    console.log(`🚀 Enviando bundle via ${
      useFlashbots ? 'Flashbots' :
      useMevShare ? 'MEV-Share' :
      useBlocksRoute ? 'BlocksRoute' : 'Custom'
    }: ${customEndpoint}`);

    return await sendBundle(customEndpoint, bundleTxs, signerKey, simulateBundle, customHeaders);
  }

  if (sendAsBundle) {
    throw new Error('❌ sendAsBundle requires custom endpoint, bundleTxs and signerKey');
  }

  if (customEndpoint && rawTx) {
    console.log(`🚀 Enviando rawTx via ${
      useFlashbots ? 'Flashbots' :
      useMevShare ? 'MEV-Share' :
      useBlocksRoute ? 'BlocksRoute' : 'Custom'
    }: ${customEndpoint}`);

    return await sendViaCustomEndpoint(customEndpoint, rawTx, customHeaders);
  }

  if (!providers || providers.length === 0) {
    throw new Error('❌ Providers array is required for sending transactions');
  }

  console.log('⏱️ Medindo latência dos providers...');

  async function pingProvider(provider: ethers.JsonRpcProvider): Promise<number> {
    try {
      const start = Date.now();
      await Promise.race([
        provider.getBlockNumber(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Ping timeout')), pingTimeoutMs)),
      ]);
      return Date.now() - start;
    } catch {
      return Infinity;
    }
  }

  const latencies = await Promise.all(providers.map(pingProvider));
  const sortedProviders = providers
    .map((provider, i) => ({ provider, latency: latencies[i] }))
    .sort((a, b) => a.latency - b.latency)
    .map(obj => obj.provider);

  console.log(`✅ Providers ordenados por latência.`);

  const sendWithRetry = async (provider: ethers.JsonRpcProvider) => {
    let attempt = 0;

    while (attempt < maxRetries) {
      attempt++;
      try {
        if (rawTx) {
          let txHash: string;

          if (useEthSendRawTx) {
            txHash = await sendViaProviderRpc(provider, rawTx);
          } else {
            const txResponse = await provider.broadcastTransaction(rawTx);
            txHash = txResponse.hash;
          }

          console.log(`✅ Sent via provider: ${txHash}`);

          const receipt = await waitForConfirmation(provider, txHash, confirmations, timeoutMs);
          if (!receipt) {
            throw new Error('❌ Transaction receipt is null');
          }
          console.log(`✅ Confirmed via provider`);

          return receipt;
        }

        if (bundleTxs && bundleTxs.length > 0) {
          for (const { signer, transaction } of bundleTxs) {
            const signedTx = await signer.signTransaction(transaction);

            let txHash: string;

            if (useEthSendRawTx) {
              txHash = await sendViaProviderRpc(provider, signedTx);
            } else {
              const txResponse = await provider.broadcastTransaction(signedTx);
              txHash = txResponse.hash;
            }

            console.log(`✅ Sent tx ${txHash} via provider`);

            const receipt = await waitForConfirmation(provider, txHash, confirmations, timeoutMs);
            if (!receipt) {
              throw new Error('❌ Transaction receipt is null');
            }
            console.log(`✅ Confirmed tx via provider`);

            return receipt;
          }
        }

        throw new Error('❌ No transaction data to send');
      } catch (err) {
        console.warn(`⚠️ Attempt ${attempt} failed via provider:`, err);
        const delay = Math.pow(2, attempt) * 500;
        await sleep(delay);
      }
    }

    console.error(`❌ All retries failed for provider`);
    return null;
  };

  for (const provider of sortedProviders) {
    const receipt = await sendWithRetry(provider);
    if (receipt) return receipt;
  }

  throw new Error('❌ All providers failed after retries.');
}

async function sendViaProviderRpc(provider: JsonRpcProvider, rawTx: string): Promise<string> {
  const network = await provider.getNetwork();

  const transport = (provider as any).transport;
  const rpcUrl = transport?.url;

  if (!rpcUrl) {
    throw new Error('❌ Provider RPC URL is not accessible for direct send');
  }

  const payload = {
    jsonrpc: '2.0',
    id: 1,
    method: 'eth_sendRawTransaction',
    params: [rawTx],
  };

  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(`❌ Failed to send via eth_sendRawTransaction: ${data.error.message}`);
  }

  console.log(`✅ Sent via eth_sendRawTransaction: ${data.result}`);

  return data.result;
}

async function sendViaCustomEndpoint(endpoint: string, rawTx: string, headers: Record<string, string> = {}) {
  const payload = {
    jsonrpc: '2.0',
    id: 1,
    method: 'eth_sendRawTransaction',
    params: [rawTx],
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(`❌ Failed to send via custom endpoint: ${data.error.message}`);
  }

  console.log(`✅ Sent via custom endpoint: ${data.result}`);
  return data.result;
}

async function sendBundle(
  endpoint: string,
  bundleTxs: BundleTx[],
  signerKey: string,
  simulate: boolean,
  headers: Record<string, string> = {}
) {
  const wallet = new ethers.Wallet(signerKey);

  const signedTxs = await Promise.all(
    bundleTxs.map(({ signer, transaction }) => signer.signTransaction(transaction))
  );

  const params = {
    txs: signedTxs,
    blockNumber: 'latest',
    minTimestamp: 0,
    maxTimestamp: Math.floor(Date.now() / 1000) + 60,
    revertingTxHashes: [],
  };

  if (simulate) {
    console.log('🔍 Simulando bundle...');
    const simulation = await sendJsonRpc(endpoint, 'eth_callBundle', [params], headers);
    console.log('✅ Simulação:', simulation);
  }

  const signature = await wallet.signMessage(ethers.hashMessage(JSON.stringify(params)));

  const payload = {
    jsonrpc: '2.0',
    id: 1,
    method: 'eth_sendBundle',
    params: [params],
    signature,
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (data.error) {
    console.warn(`⚠️ Bundle envio falhou: ${data.error.message}, tentando fallback...`);
    if (signedTxs.length > 0) {
      return await sendViaCustomEndpoint(endpoint, signedTxs[0], headers);
    }
    throw new Error(`❌ Failed to send bundle: ${data.error.message}`);
  }

  console.log('✅ Bundle enviado com sucesso:', data.result);
  return data.result;
}

async function sendJsonRpc(endpoint: string, method: string, params: any[], headers: Record<string, string> = {}) {
  const payload = {
    jsonrpc: '2.0',
    id: 1,
    method,
    params,
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(`❌ JSON-RPC error: ${data.error.message}`);
  }

  return data.result;
}

async function waitForConfirmation(
  provider: ethers.JsonRpcProvider,
  txHash: string,
  confirmations: number,
  timeoutMs: number
) {
  return await Promise.race([
    provider.waitForTransaction(txHash, confirmations),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('⏳ Confirmation timeout')), timeoutMs)
    ),
  ]);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
