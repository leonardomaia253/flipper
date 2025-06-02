import {ethers} from "ethers";
import {DexType} from "../utils/types";


//Contratos de Routers
export const uniswapv3Router = ethers.getAddress("0xbb00FF08d01D300023C629E8fFfFcb65A5a578cE"); //Verified
export const lfjv22Router = ethers.getAddress("0x18556DA13313f3532c54711497A8FedAC273220E"); //Verified
export const lfjRouter = ethers.getAddress("0x60aE616a2155Ee3d9A68541Ba4544862310933d4"); //Verified
export const lfjv21Router = ethers.getAddress("0xb4315e873dBcf96Ffd0acd8EA43f689D8c20fB30"); //Verified

//Dex-Use-map DE ROUTERS
export const DEX_ROUTER: Record<DexType, string> = {
  uniswapv3: ethers.getAddress("0xbb00FF08d01D300023C629E8fFfFcb65A5a578cE"),
  lfj: ethers.getAddress("0x60aE616a2155Ee3d9A68541Ba4544862310933d4"),
  lfjv22: ethers.getAddress("0x18556DA13313f3532c54711497A8FedAC273220E"),
  lfjv21: ethers.getAddress("0xb4315e873dBcf96Ffd0acd8EA43f689D8c20fB30"),
};

export const DEX_LIST_PRIORITY: DexType[] = [
  "uniswapv3", "lfj", "lfjv21", "lfjv22"
];


// Contratos de cada quoters dividios em formato unico e mapa

//Contrato de quoters
export const uniswapv3Quoter2 = ethers.getAddress("0xbe0F5544EC67e9B3b2D979aaA43f18Fd87E6257F"); //Verified
export const lfjv21Quoter = ethers.getAddress("0xd76019A16606FDa4651f636D9751f500Ed776250"); //Verified
export const lfjv22Quoter = ethers.getAddress("0x9A550a522BBaDFB69019b0432800Ed17855A51C3"); //Verified
export const lfjQuoter = ethers.getAddress("0x60aE616a2155Ee3d9A68541Ba4544862310933d4"); //Verified**  

//Dex-Use-map DE qUOTERS
export const DEX_QUOTERS: Record<DexType, string> = {
  uniswapv3: ethers.getAddress("0xbe0F5544EC67e9B3b2D979aaA43f18Fd87E6257F"),
  lfj: ethers.getAddress("0x60aE616a2155Ee3d9A68541Ba4544862310933d4"),
  lfjv22: ethers.getAddress("0x9A550a522BBaDFB69019b0432800Ed17855A51C3"),
  lfjv21: ethers.getAddress("0xd76019A16606FDa4651f636D9751f500Ed776250"),
};


// Contratos de cada Factory  divididos em formato unico e mapa

//Contrato de Factory
export const uniswapv3Factory = ethers.getAddress("0x740b1c1de25031C31FF4fC9A62f554A55cdC1baD"); //Verified
export const lfjFactory = ethers.getAddress("0x9Ad6C38BE94206cA50bb0d90783181662f0Cfa10");//Verified
export const lfjv21Factory = ethers.getAddress("0x8e42f2F4101563bF679975178e880FD87d3eFd4e");  //Verified
export const lfjv22Factory =ethers.getAddress("0xb43120c4745967fa9b93E79C149E66B0f2D6Fe0c"); //Verified


//Factory use
export const DEX_FACTORY = {
uniswapv3Factory: ethers.getAddress("0x740b1c1de25031C31FF4fC9A62f554A55cdC1baD"),
lfjFactory: ethers.getAddress("0x9Ad6C38BE94206cA50bb0d90783181662f0Cfa10"),
lfjv21Factory: ethers.getAddress("0x8e42f2F4101563bF679975178e880FD87d3eFd4e"),
lfjv22Factory: ethers.getAddress("0xb43120c4745967fa9b93E79C149E66B0f2D6Fe0c"), 
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

export const ALLOWED_ADDRESSES = new Set([
  "0xbb00FF08d01D300023C629E8fFfFcb65A5a578cE",
  "0x18556DA13313f3532c54711497A8FedAC273220E",
  "0x60aE616a2155Ee3d9A68541Ba4544862310933d4",
  "0xb4315e873dBcf96Ffd0acd8EA43f689D8c20fB30",
  "0xf2614A233c7C3e7f08b1F887Ba133a13f1eb2c55",
  "0x32226588378236fd0c7c4053999f88ac0e5cac77",
  "0x2191718CD32d02B8E60BAdFFeA33E4B5DD9A0A0D",
  "0xAA23611badAFB62D37E7295A682D21960ac85A90",
  "0x5c3b380e5Aeec389d1014Da3Eb372FA2C9e0fc76",
  "0x1F721E2E82F6676FCE4eA07A5958cF098D339e18",
].map(addr => addr.toLowerCase()));

export const SWAP_FUNCTION_SIGNATURES = new Set([
  "0x38ed1739", "0x5c11d795", "0xac9650d8", "0xc04b8d59",
  "0x414bf389"
]);
//0x414bf389 //ExactInputSingle
//0xc04b8d59 //ExactInput
//0xac9650d8 //Multicall
//0x5c11d795 //SwapExactTokensForTokensSupportingFeeOnTransferTokens
//0x38ed1739



// Chainlink Oracles
export const CHAINLINK_ORACLES = {
  AVAX_USD: ethers.getAddress("0x639fe6ab55c921f74e7fac1ee960c0b6293ba612"),
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
  AVAXSCAN: "https://api.arbiscan.io/api?module=gastracker&action=gasoracle",
  ETHERSCAN: "https://api.etherscan.io/api?module=gastracker&action=gasoracle",
};

export const executoraddress = ethers.getAddress("0xBb26ebC5274b36C8c5DF2b2176849E008D6d2636");
export const WAVAX = ethers.getAddress("0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7");