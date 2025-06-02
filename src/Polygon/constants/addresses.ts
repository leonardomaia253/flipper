import {ethers} from "ethers";
import {DexType} from "../utils/types";


//Contratos de Routers
export const quickswapRouter = ethers.getAddress("0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff"); //Verified
export const uniswapv3Router = ethers.getAddress("0xE592427A0AEce92De3Edee1F18E0157C05861564"); //Verified
export const sushiswapv2Router = ethers.getAddress("0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506");//Verified
export const quickswapv3Router = ethers.getAddress("0xf5b509bB0909a69B1c207E495f687a596C168E12");//Verified

//Dex-Use-map DE ROUTERS
export const DEX_ROUTER: Record<DexType, string> = {
  quickswap: ethers.getAddress("0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff"),
  uniswapv3: ethers.getAddress("0xE592427A0AEce92De3Edee1F18E0157C05861564"),
  sushiswapv2: ethers.getAddress("0x1b02da8cb0d097eb8d57a175b88c7d8b47997506"),
  quickswapv3: ethers.getAddress("0xf5b509bB0909a69B1c207E495f687a596C168E12"),
};
export const DEX_LIST_PRIORITY: DexType[] = [
  "uniswapv3", "quickswap", "quickswapv3", "sushiswapv2"
];


// Contratos de cada quoters dividios em formato unico e mapa

//Contrato de quoters
export const uniswapv3Quoter2 = ethers.getAddress("0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6"); //Verified
export const sushiswapv2Quoter = ethers.getAddress("0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6"); //Verified**  
export const quickswapQuoter = ethers.getAddress("0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff");
export const quickswapv3QUoter = ethers.getAddress("0xa15F0D7377B2A0C0c10db057f641beD21028FC89");

//Dex-Use-map DE qUOTERS
export const DEX_QUOTERS: Record<DexType, string> = {
  quickswap: ethers.getAddress("0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff"),
  uniswapv3: ethers.getAddress("0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6"),
  sushiswapv2: ethers.getAddress("0x1b02da8cb0d097eb8d57a175b88c7d8b47997506"),
  quickswapv3: ethers.getAddress("0xa15F0D7377B2A0C0c10db057f641beD21028FC89"),
};


// Contratos de cada Factory  divididos em formato unico e mapa

//Contrato de Factory
export const uniswapv3Factory = ethers.getAddress("0x1F98431c8aD98523631AE4a59f267346ea31F984"); //Verified
export const quickswapFactory = ethers.getAddress("0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32"); //Verified
export const sushiswapv2Factory = ethers.getAddress("0xc35dadb65012ec5796536bd9864ed8773abc74c4"); //Verified
export const quickswapv3Factory = ethers.getAddress("0x411b0fAcC3489691f28ad58c47006AF5E3Ab3A28"); //Verified


//Factory use
export const DEX_FACTORY = {
uniswapv3Factory: ethers.getAddress("0x1F98431c8aD98523631AE4a59f267346ea31F984"),
quickswapFactory: ethers.getAddress("0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32"),
sushiswapv2Factory: ethers.getAddress("0xc35dadb65012ec5796536bd9864ed8773abc74c4"),
quickswapv3Factory: ethers.getAddress("0x411b0fAcC3489691f28ad58c47006AF5E3Ab3A28"),
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


export const ALLOWED_ADDRESSES = new Set(
  [
    "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff",
    "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    "0x1b02da8cb0d097eb8d57a175b88c7d8b47997506",
    "0xf5b509bB0909a69B1c207E495f687a596C168E12",

  ].map(addr => addr.toLowerCase())
);

export const SWAP_FUNCTION_SIGNATURES = new Set([
  "0x38ed1739", // swapExactTokensForTokens
  "0x5c11d795", // SwapExactTokensForTokensSupportingFeeOnTransferTokens
  "0xc04b8d59", // exactInput
  "0x414bf389", // ExactInputSingle
  "0x8803dbee", //swapTokensForExactTokens

]);

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

export const executoraddress = ethers.getAddress("0x54bd990AB55367F3eA1648702c833eF33Da3Ba5D");
export const WMATIC = ethers.getAddress("0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270");