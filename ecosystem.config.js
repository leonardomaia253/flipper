module.exports = {
  apps: [
    {
      name: 'arb-arbitrage-bot',
      script: './src/Arbitrum/bots/arbitrage/index.ts',
      interpreter: 'ts-node'
    },
    {
      name: 'arb-sandwich-bot',
      script: './src/Arbitrum/bots/sandwich/sandwichScanner.ts',
      interpreter: 'ts-node'
    },
    {
      name: 'arb-frontrun-bot',
      script: './src/Arbitrum/bots/frontrun/frontrunwatcher.ts',
      interpreter: 'ts-node'
    },
    {
      name: 'arb-profiter1-bot',
      script: './src/Arbitrum/bots/profiterone/index.ts',
      interpreter: 'ts-node'
    },
    {
      name: 'arb-profiter2-bot',
      script: './src/Arbitrum/bots/profitertwo/index.ts',
      interpreter: 'ts-node'
    },
        {
      name: 'avax-arbitrage-bot',
      script: './src/Avalanche/bots/arbitrage/index.ts',
      interpreter: 'ts-node'
    },
    {
      name: 'avax-sandwich-bot',
      script: './src/Avalanche/bots/sandwich/sandwichScanner.ts',
      interpreter: 'ts-node'
    },
    {
      name: 'avax-frontrun-bot',
      script: './src/Avalanche/bots/frontrun/frontrunwatcher.ts',
      interpreter: 'ts-node'
    },
    {
      name: 'avax-profiter1-bot',
      script: './src/Avalanche/bots/profiterone/index.ts',
      interpreter: 'ts-node'
    },
    {
      name: 'avax-profiter2-bot',
      script: './src/Avalanche/bots/profitertwo/index.ts',
      interpreter: 'ts-node'
    },
        {
      name: 'base-arbitrage-bot',
      script: './src/Base/bots/arbitrage/index.ts',
      interpreter: 'ts-node'
    },
    {
      name: 'base-sandwich-bot',
      script: './src/Base/bots/sandwich/sandwichScanner.ts',
      interpreter: 'ts-node'
    },
    {
      name: 'base-frontrun-bot',
      script: './src/Base/bots/frontrun/frontrunwatcher.ts',
      interpreter: 'ts-node'
    },
    {
      name: 'base-profiter1-bot',
      script: './src/Base/bots/profiterone/index.ts',
      interpreter: 'ts-node'
    },
    {
      name: 'base-profiter2-bot',
      script: './src/Base/bots/profitertwo/index.ts',
      interpreter: 'ts-node'
    },
        {
      name: 'bsc-arbitrage-bot',
      script: './src/Binance/bots/arbitrage/index.ts',
      interpreter: 'ts-node'
    },
    {
      name: 'bsc-sandwich-bot',
      script: './src/Binance/bots/sandwich/sandwichScanner.ts',
      interpreter: 'ts-node'
    },
    {
      name: 'bsc-frontrun-bot',
      script: './src/Binance/bots/frontrun/frontrunwatcher.ts',
      interpreter: 'ts-node'
    },
    {
      name: 'bsc-profiter1-bot',
      script: './src/Binance/bots/profiterone/index.ts',
      interpreter: 'ts-node'
    },
    {
      name: 'bsc-profiter2-bot',
      script: './src/Binance/bots/profitertwo/index.ts',
      interpreter: 'ts-node'
    },
        {
      name: 'eth-arbitrage-bot',
      script: './src/Ethereum/bots/arbitrage/index.ts',
      interpreter: 'ts-node'
    },
    {
      name: 'eth-sandwich-bot',
      script: './src/Ethereum/bots/sandwich/sandwichScanner.ts',
      interpreter: 'ts-node'
    },
    {
      name: 'eth-frontrun-bot',
      script: './src/Ethereum/bots/frontrun/frontrunwatcher.ts',
      interpreter: 'ts-node'
    },
    {
      name: 'eth-profiter1-bot',
      script: './src/Ethereum/bots/profiterone/index.ts',
      interpreter: 'ts-node'
    },
    {
      name: 'eth-profiter2-bot',
      script: './src/Ethereum/bots/profitertwo/index.ts',
      interpreter: 'ts-node'
    },
        {
      name: 'opt-arbitrage-bot',
      script: './src/Optimism/bots/arbitrage/index.ts',
      interpreter: 'ts-node'
    },
    {
      name: 'opt-sandwich-bot',
      script: './src/Optimism/bots/sandwich/sandwichScanner.ts',
      interpreter: 'ts-node'
    },
    {
      name: 'opt-frontrun-bot',
      script: './src/Optimism/bots/frontrun/frontrunwatcher.ts',
      interpreter: 'ts-node'
    },
    {
      name: 'opt-profiter1-bot',
      script: './src/Optimism/bots/profiterone/index.ts',
      interpreter: 'ts-node'
    },
    {
      name: 'opt-profiter2-bot',
      script: './src/Optimism/bots/profitertwo/index.ts',
      interpreter: 'ts-node'
    },
        {
      name: 'poly-arbitrage-bot',
      script: './src/Polygon/bots/arbitrage/index.ts',
      interpreter: 'ts-node'
    },
    {
      name: 'poly-sandwich-bot',
      script: './src/Polygon/bots/sandwich/sandwichScanner.ts',
      interpreter: 'ts-node'
    },
    {
      name: 'poly-frontrun-bot',
      script: './src/Polygon/bots/frontrun/frontrunwatcher.ts',
      interpreter: 'ts-node'
    },
    {
      name: 'poly-profiter1-bot',
      script: './src/Polygon/bots/profiterone/index.ts',
      interpreter: 'ts-node'
    },
    {
      name: 'poly-profiter2-bot',
      script: './src/Polygon/bots/profitertwo/index.ts',
      interpreter: 'ts-node'
    },
        {
      name: 'withdrawal',
      script: './src/withdrawal.ts',
      interpreter: 'ts-node'
    },
  ]
}
