import {ethers} from "ethers";
import {DexType} from "../utils/types";


//Contratos de Routers
export const uniswapv2Router = ethers.getAddress("0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24"); //Verified
export const uniswapv3Router = ethers.getAddress("0xE592427A0AEce92De3Edee1F18E0157C05861564"); //Verified
export const sushiswapv2Router = ethers.getAddress("0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506");//Verified
export const sushiswapv3Router = ethers.getAddress("0xf2614A233c7C3e7f08b1F887Ba133a13f1eb2c55"); //Verified
export const pancakeswapv3Router = ethers.getAddress("0x32226588378236fd0c7c4053999f88ac0e5cac77");//Verified
export const ramsesv2Router = ethers.getAddress("0xAA23611badAFB62D37E7295A682D21960ac85A90"); //Verified
export const camelotRouter = ethers.getAddress("0x1F721E2E82F6676FCE4eA07A5958cF098D339e18"); //Verified

//Dex-Use-map DE ROUTERS
export const DEX_ROUTER: Record<DexType, string> = {
  uniswapv2: ethers.getAddress("0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24"),
  uniswapv3: ethers.getAddress("0xe592427a0aece92de3edee1f18e0157c05861564"),
  sushiswapv3: ethers.getAddress("0xf2614A233c7C3e7f08b1F887Ba133a13f1eb2c55"),
  camelot: ethers.getAddress("0x1f721e2e82f6676fce4ea07a5958cf098d339e18"),
  sushiswapv2: ethers.getAddress("0x1b02da8cb0d097eb8d57a175b88c7d8b47997506"),
  pancakeswapv3: ethers.getAddress("0x32226588378236fd0c7c4053999f88ac0e5cac77"),
  ramsesv2: ethers.getAddress("0xaa23611badafb62d37e7295a682d21960ac85a90"),
};


// Contratos de cada quoters dividios em formato unico e mapa

//Contrato de quoters
export const uniswapv3Quoter2 = ethers.getAddress("0x61ffe014ba17989e743c5f6cb21bf9697530b21e"); //Verified
export const pancakeswapv3Quoter = ethers.getAddress("0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997");//Verified
export const camelotQuoter = ethers.getAddress("0x0Fc73040b26E9bC8514fA028D998E73A254Fa76E"); //Verified
export const ramsesv2Quoter = ethers.getAddress("0xAA20EFF7ad2F523590dE6c04918DaAE0904E3b20"); //Verified
export const uniswapv4Quoter = ethers.getAddress("0x3972c00f7ed4885e145823eb7c655375d275a1c5"); //Verified
export const sushiswapv3Quoter = ethers.getAddress("0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6"); //Verified**  

//Dex-Use-map DE qUOTERS
export const DEX_QUOTERS: Record<DexType, string> = {
  uniswapv2: ethers.getAddress("0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24"),
  uniswapv3: ethers.getAddress("0x61ffe014ba17989e743c5f6cb21bf9697530b21e"),
  sushiswapv3: ethers.getAddress("0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6"),
  camelot: ethers.getAddress("0x0Fc73040b26E9bC8514fA028D998E73A254Fa76E"),
  sushiswapv2: ethers.getAddress("0x1b02da8cb0d097eb8d57a175b88c7d8b47997506"),
  pancakeswapv3: ethers.getAddress("0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997"),
  ramsesv2: ethers.getAddress("0xAA20EFF7ad2F523590dE6c04918DaAE0904E3b20"),
};


// Contratos de cada Factory  divididos em formato unico e mapa

//Contrato de Factory
export const uniswapv3Factory = ethers.getAddress("0x1F98431c8aD98523631AE4a59f267346ea31F984"); //Verified
export const uniswapv2Factory = ethers.getAddress("0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"); //Verified
export const sushiswapv2Factory = ethers.getAddress("0xc35dadb65012ec5796536bd9864ed8773abc74c4"); //Verified
export const sushiswapv3Factory = ethers.getAddress("0x1af415a1EbA07a4986a52B6f2e7dE7003D82231e");//Verified
export const pancakeswapv3Factory = ethers.getAddress("0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865"); //Verified
export const camelotFactory = ethers.getAddress("0x6EcCab422D763aC031210895C81787E87B43A652"); //Verified
export const ramsesv2Factory = ethers.getAddress("0xAAA20D08e59F6561f242b08513D36266C5A29415"); //Verified


//Factory use
export const DEX_FACTORY = {
uniswapv3Factory: ethers.getAddress("0x1F98431c8aD98523631AE4a59f267346ea31F984"),
uniswapv2Factory: ethers.getAddress("0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"),
sushiswapv2Factory: ethers.getAddress("0xc35dadb65012ec5796536bd9864ed8773abc74c4"),
sushiswapv3Factory: ethers.getAddress("0x1af415a1EbA07a4986a52B6f2e7dE7003D82231e"),
pancakeswapv3Factory: ethers.getAddress("0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865"),
camelotFactory: ethers.getAddress("0x6EcCab422D763aC031210895C81787E87B43A652"),
ramsesv2Factory: ethers.getAddress("0xAAA20D08e59F6561f242b08513D36266C5A29415"),
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
    "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24",
    "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    "0xf2614A233c7C3e7f08b1F887Ba133a13f1eb2c55",
    "0x1f721e2e82f6676fce4ea07a5958cf098d339e18",
    "0x5c3b380e5Aeec389d1014Da3Eb372FA2C9e0fc76",
    "0x1b02da8cb0d097eb8d57a175b88c7d8b47997506",
    "0x32226588378236fd0c7c4053999f88ac0e5cac77",
    "0xaa23611badafb62d37e7295a682d21960ac85a90",
  ].map(addr => addr.toLowerCase())
);


export const SWAP_FUNCTION_SIGNATURES = new Set([
  "0x38ed1739", // swapExactTokensForTokens
  "0x5c11d795", // SwapExactTokensForTokensSupportingFeeOnTransferTokens
  "0xac9650d8", // multicall
  "0xc04b8d59", // exactInput
  "0x414bf389", // ExactInputSingle
  "0x8803dbee", //swapTokensForExactTokens
  "0xded9382a", //RemoveLiquidityETHWithPermit

]);

export const DEX_LIST_PRIORITY: DexType[] = [
  "uniswapv3", "uniswapv2", "sushiswapv3", "sushiswapv2",
  "camelot", "ramsesv2", "pancakeswapv3",
];


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
export const WETH = ethers.getAddress("0x82af49447d8a07e3bd95bd0d56f35241523fbab1");