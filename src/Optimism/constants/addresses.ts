import {ethers} from "ethers";
import {DexType} from "../utils/types";
 

//Contratos de Routers
export const uniswapv3Router = ethers.getAddress("0xE592427A0AEce92De3Edee1F18E0157C05861564"); //Verified
export const solidlyv3Router = ethers.getAddress("0x77784f96C936042A3ADB1dD29C91a55EB2A4219f"); //Verified
export const velodromeslipstreamRouter = ethers.getAddress("0x0792a633F0c19c351081CF4B211F68F79bCc9676"); //Verified
export const velodromefinancev2Router = ethers.getAddress("0xa062aE8A9c5e11aaA026fc2670B0D65cCc8B2858"); //Verified

//Dex-Use-map DE ROUTERS
export const DEX_ROUTER: Record<DexType, string> = {

  uniswapv3: ethers.getAddress("0xE592427A0AEce92De3Edee1F18E0157C05861564"),
  velodromefinancev2: ethers.getAddress("0xa062aE8A9c5e11aaA026fc2670B0D65cCc8B2858"),
  velodromeslipstream: ethers.getAddress("0x0792a633F0c19c351081CF4B211F68F79bCc9676"),
  solidlyv3: ethers.getAddress("0x77784f96C936042A3ADB1dD29C91a55EB2A4219f"),
};
export const DEX_LIST_PRIORITY: DexType[] = [
  "uniswapv3", "velodromefinancev2", "velodromeslipstream", "solidlyv3"
];

// Contratos de cada quoters dividios em formato unico e mapa

//Contrato de quoters
export const uniswapv3Quoter2 = ethers.getAddress("0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6"); //Verified
export const velodromefinancev2Quoter = ethers.getAddress("0xa062aE8A9c5e11aaA026fc2670B0D65cCc8B2858"); //Verified
export const velodromeslipstreamQuoter = ethers.getAddress("0x89D8218ed5fF1e46d8dcd33fb0bbeE3be1621466"); //Verified
export const solidlyv3Quoter = ethers.getAddress("0x77784f96C936042A3ADB1dD29C91a55EB2A4219f"); //Verified

//Dex-Use-map DE qUOTERS
export const DEX_QUOTERS: Record<DexType, string> = {
  
  uniswapv3: ethers.getAddress("0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6"),
  velodromefinancev2: ethers.getAddress("0xa062aE8A9c5e11aaA026fc2670B0D65cCc8B2858"),
  velodromeslipstream: ethers.getAddress("0x89D8218ed5fF1e46d8dcd33fb0bbeE3be1621466"),
  solidlyv3: ethers.getAddress("0x77784f96C936042A3ADB1dD29C91a55EB2A4219f"),
};


// Contratos de cada Factory  divididos em formato unico e mapa

//Contrato de Factory
export const uniswapv3Factory = ethers.getAddress("0x1F98431c8aD98523631AE4a59f267346ea31F984"); //Verified
export const velodromefinancev2Factory = ethers.getAddress("0xF1046053aa5682b4F9a81b5481394DA16BE5FF5a"); //Verified
export const velodromeslipstreamFactory = ethers.getAddress("0xCc0bDDB707055e04e497aB22a59c2aF4391cd12F");  //Verified
export const solidlyv3Factory = ethers.getAddress("0x777de5Fe8117cAAA7B44f396E93a401Cf5c9D4d6"); //Verified


//Factory use
export const DEX_FACTORY = {
uniswapv3Factory: ethers.getAddress("0x1F98431c8aD98523631AE4a59f267346ea31F984"),
velodromefinancev2Factory: ethers.getAddress("0xF1046053aa5682b4F9a81b5481394DA16BE5FF5a"),
velodromeslipstreamFactory: ethers.getAddress("0xCc0bDDB707055e04e497aB22a59c2aF4391cd12F"),
solidlyv3Factory: ethers.getAddress("0x777de5Fe8117cAAA7B44f396E93a401Cf5c9D4d6"),
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

export const ALLOWED_ADDRESSES = new Set(
  [
  "0xE592427A0AEce92De3Edee1F18E0157C05861564",
  "0xa062aE8A9c5e11aaA026fc2670B0D65cCc8B2858",
  "0x0792a633F0c19c351081CF4B211F68F79bCc9676",
  "0x77784f96C936042A3ADB1dD29C91a55EB2A4219f",
  
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

export const executoraddress = ethers.getAddress("0xBb26ebC5274b36C8c5DF2b2176849E008D6d2636");
export const WETH = ethers.getAddress("0x4200000000000000000000000000000000000006");