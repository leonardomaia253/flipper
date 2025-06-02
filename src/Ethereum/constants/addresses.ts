import {ethers} from "ethers";
import {DexType} from "../utils/types";


//Contratos de Routers
export const uniswapv2Router = ethers.getAddress("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"); //Verified
export const uniswapv3Router = ethers.getAddress("0xE592427A0AEce92De3Edee1F18E0157C05861564"); //Verified
export const sushiswapv2Router = ethers.getAddress("0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506");//Verified
export const sushiswapv3Router = ethers.getAddress("0xAC4c6e212A361c968F1725b4d055b47E63F80b75"); //Verified
//Dex-Use-map DE ROUTERS
export const DEX_ROUTER: Record<DexType, string> = {
  uniswapv2: ethers.getAddress("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"),
  uniswapv3: ethers.getAddress("0xE592427A0AEce92De3Edee1F18E0157C05861564"),
  sushiswapv3: ethers.getAddress("0xAC4c6e212A361c968F1725b4d055b47E63F80b75"),
  sushiswapv2: ethers.getAddress("0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F"),
};

export const DEX_LIST_PRIORITY: DexType[] = [
  "uniswapv2", "sushiswapv2", "sushiswapv3", "uniswapv3"
];

// Contratos de cada quoters dividios em formato unico e mapa

//Contrato de quoters
export const uniswapv3Quoter2 = ethers.getAddress("0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6"); //Verified
export const sushiswapv3Quoter = ethers.getAddress("0x2214A42d8e2A1d20635c2cb0664422c528B6A432"); //Verified** 
export const uniswapv2Quoter = ethers.getAddress("0x61ffe014ba17989e743c5f6cb21bf9697530b21e"); //Verified
export const sushiswapv2Quoter = ethers.getAddress("0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F"); //Verified

//Dex-Use-map DE qUOTERS
export const DEX_QUOTERS: Record<DexType, string> = {
  uniswapv2: ethers.getAddress("0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6"),
  uniswapv3: ethers.getAddress("0x61ffe014ba17989e743c5f6cb21bf9697530b21e"),
  sushiswapv3: ethers.getAddress("0x2214A42d8e2A1d20635c2cb0664422c528B6A432"),
  sushiswapv2: ethers.getAddress("0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F"),
};


// Contratos de cada Factory  divididos em formato unico e mapa

//Contrato de Factory
export const uniswapv3Factory = ethers.getAddress("0x1F98431c8aD98523631AE4a59f267346ea31F984"); //Verified
export const uniswapv2Factory = ethers.getAddress("0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"); //Verified
export const sushiswapv2Factory = ethers.getAddress("0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac"); //Verified
export const sushiswapv3Factory = ethers.getAddress("0xbACEB8eC6b9355Dfc0269C18bac9d6E2Bdc29C4F");//Verified

//Factory use
export const DEX_FACTORY = {
uniswapv3Factory: ethers.getAddress("0x1F98431c8aD98523631AE4a59f267346ea31F984"),
uniswapv2Factory: ethers.getAddress("0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"),
sushiswapv2Factory: ethers.getAddress("0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac"),
sushiswapv3Factory: ethers.getAddress("0xbACEB8eC6b9355Dfc0269C18bac9d6E2Bdc29C4F"),
};



//Lending-use
export const LENDING_PROTOCOL_addressES = {
  aave: ethers.getAddress("0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24"),
  spark: ethers.getAddress("0xe592427a0aece92de3edee1f18e0157c05861564"),
  venus: ethers.getAddress("0xa7cac4207579a179c1069435d032ee0f9f150e5c"),
  radiant: ethers.getAddress("0xa51afafe0263b40edaef0df8781ea9aa03e381a3"),
  abracadabra: ethers.getAddress("0xc873fecbd354f5a56e00e710b90ef4201db2448d"),
  ironbank: ethers.getAddress("0x5c3b380e5aeec389d1014da3eb372fa2c9e0fc76"),
  morpho: ethers.getAddress("0x2191718cd32d02b8e60badffea33e4b5dd9a0a0d"),
  llamalend: ethers.getAddress("0xa7cac4207579a179c1069435d032ee0f9f150e5c"),
  creamfinance: ethers.getAddress("0x13f4ea83d0bd40e75c8222255bc855a974568dd4"),
  compound: ethers.getAddress("0xaa273216cc9201a1e4285ca623f584badc736944"),
};

export const ALLOWED_ADDRESSES = new Set( [
  "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  "0xE592427A0AEce92De3Edee1F18E0157C05861564",
  "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
  "0xAC4c6e212A361c968F1725b4d055b47E63F80b75",
].map(addr => addr.toLowerCase())
);
export const SWAP_FUNCTION_SIGNATURES = new Set([
  "0x38ed1739", // swapExactTokensForTokens
  "0x5c11d795", // SwapExactTokensForTokensSupportingFeeOnTransferTokens
  "0xc04b8d59", // exactInput
  "0x414bf389", // ExactInputSingle
  "0x8803dbee", //swapTokensForExactTokens

]);

// Chainlink Oracles
export const CHAINLINK_ORACLES = {
  ETH_USD: ethers.getAddress("0x639fe6ab55c921f74e7fac1ee960c0b6293ba612"),
  BTC_USD: ethers.getAddress("0x6ce185860a4963106506c203335a2910413708e9"),
  USDC_USD: ethers.getAddress("0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6"),
  USDT_USD: ethers.getAddress("0x3E7d1eAB13ad0104d2750B8863b489D65364e32D"),
  DAI_USD: ethers.getAddress("0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9"),
};

// Flashloan Providers
export const FLASHLOAN_PROVIDERS = {
  AAVE_V3: ethers.getAddress("0x794a61358d6845594f94dc1db02a252b5b4814ad"),
  BALANCER: ethers.getAddress("0xba12222222228d8ba445958a75a0704d566bf2c8"),
  DYDX: ethers.getAddress("0x1e0447b19bb6ecfdae1e4ae1694b0c3659614e4e"),
};



// MEV Bots
export const MEV_BOTS = {
  FLASHBOTS_RELAY: "https://relay.flashbots.net",
  BLOXROUTE_RELAY: "https://mev.api.blxrbdn.com",
  EDEN_NETWORK: "https://api.edennetwork.io/v1/bundle",
};

// Gas Fee Estimators
export const GAS_ESTIMATORS = {
  ARBISCAN: "https://api.arbiscan.io/api?module=gastracker&action=gasoracle",
  ETHERSCAN: "https://api.etherscan.io/api?module=gastracker&action=gasoracle",
};

export const executoraddress = ethers.getAddress("0x093adfecd56c5215378124fcc66e35d4e102f04f");
export const WETH = ethers.getAddress("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");