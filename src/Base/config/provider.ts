import WebSocket from "ws";
global.WebSocket = WebSocket as any;
import { ethers, JsonRpcProvider,WebSocketProvider, Wallet} from "ethers";
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env") });

type SupportedProvider = ethers.JsonRpcProvider | ethers.WebSocketProvider;


// Fallback HTTP provider (para chamadas: getBalance, call, estimateGas, etc.)
export const multiprovider = new ethers.JsonRpcProvider(process.env.RPC_COMUM!,8453);
export const alchemysupport= new ethers.JsonRpcProvider(process.env.ALCHEMY_RPC!,8453);
export const blastprovider = new ethers.WebSocketProvider(process.env.BLASTPROVIDER!,8453);
export const quicknodeprovider = new ethers.WebSocketProvider(process.env.QUICKNODEPROVIDER!,8453);
export const alchemyprovider = new ethers.WebSocketProvider(process.env.ALCHEMY_WSS!,8453);
export const infuraprovider = new ethers.WebSocketProvider(process.env.INFURA_WSS!,8453);
export const infurasupport = new ethers.JsonRpcProvider(process.env.INFURA_RPC!,8453);
export const quicknodesupport = new ethers.JsonRpcProvider(process.env.QUICKNODESUPPORT!,8453);




interface ProviderWithUrl {
  provider: ethers.Provider;
  url: string;
}

export const providerhttp: ProviderWithUrl[] = [
  { provider: multiprovider, url: process.env.RPC_COMUM!},
  { provider: alchemysupport, url: process.env.ALCHEMY_RPC!},
  { provider: infurasupport, url: process.env.INFURA_RPC!},
  { provider: quicknodesupport, url: process.env.QUICKNODESUPPORT!},
];

export const providerwss: ProviderWithUrl[] = [
  { provider: blastprovider, url: process.env.BLASTPROVIDER! },
  { provider: quicknodeprovider, url: process.env.QUICKNODEPROVIDER!},
  { provider: alchemyprovider, url: process.env.ALCHEMY_WSS!},
  { provider: infuraprovider, url: process.env.INFURA_WSS!},
];

export const providersimplehttp: JsonRpcProvider[] = [
  multiprovider,
  alchemysupport,
  infurasupport,
  quicknodesupport
];

export const providersimplewss: WebSocketProvider[] = [
  blastprovider,
  quicknodeprovider,
];

export const PRIVATE_KEY = process.env.PRIVATE_KEY!;


// Ajuste o pollingInterval conforme necessidade
multiprovider.pollingInterval = 10; // 1 segundo
alchemysupport.pollingInterval = 10;

// Tenderly configuration for simulations
export const TENDERLY_CONFIG = {
  account: "Volup",
  project: "project1",
  accessKey: process.env.TENDERLY_ACCESS_KEY || "xlY4N6Y4R2e0kXsdaff3uMmRRSvdeIb1",
};

// Flashbots configuration
export const FLASHBOTS_CONFIG = {
  relaySigner: process.env.FLASHBOTS_RELAY_SIGNER || "0x",
  authSigner: process.env.FLASHBOTS_AUTH_SIGNER || "0x",
  relayEndpoint: "https://relay.flashbots.net"
};

// MEV-Share configuration 
export const MEV_SHARE_CONFIG = {
  endpoint: "https://mev-share.flashbots.net",
  authSigner: process.env.MEV_SHARE_AUTH_SIGNER || "0x"
};

// Network configuration
export const ARBITRUM_CONFIG = {
  chainId: 42161,
  blockTime: 0.25, // in seconds
  defaultGasMultiplier: 1.2,
  maxGasPriceGwei: 30
};

