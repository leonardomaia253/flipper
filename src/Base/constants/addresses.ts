import {ethers} from "ethers";
import {DexType} from "../utils/types";


//Contratos de Routers
export const aerodromeslipstreamRouter = ethers.getAddress("0xBE6D8f0d05cC4be24d5167a3eF062215bE6D18a5"); //Verified
export const uniswapv3Router = ethers.getAddress("0x2626664c2603336E57B271c5C0b26F421741e481"); //Verified
export const pancakeswapv3Router = ethers.getAddress("0x1b81D678ffb9C0263b24A97847620C99d213eB14"); //Verified
export const aerodromeRouter = ethers.getAddress("0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43");//Verified
export const uniswapv2Router = ethers.getAddress("0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24"); //Verified
export const sushiswapv3Router = ethers.getAddress("0x80C7DD17B01855a6D2347444a0FCC36136a314de");//Verified
export const baseswapv3Router = ethers.getAddress("0x327Df1E6de05895d2ab08513aaDD9313Fe505d86"); //Verified
export const alienbasev3Router = ethers.getAddress("0x8c1A3cF8f83074169FE5D7aD50B978e1cD6b37c7"); //Verified

//Dex-Use-map DE ROUTERS
export const DEX_ROUTER: Record<DexType, string> = {
  aerodromeslipstream: ethers.getAddress("0xBE6D8f0d05cC4be24d5167a3eF062215bE6D18a5"),
  uniswapv3: ethers.getAddress("0x2626664c2603336E57B271c5C0b26F421741e481"),
  pancakeswapv3: ethers.getAddress("0x1b81D678ffb9C0263b24A97847620C99d213eB14"),
  aerodrome: ethers.getAddress("0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43"),
  uniswapv2: ethers.getAddress("0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24"),
  sushiswapv3: ethers.getAddress("0x80C7DD17B01855a6D2347444a0FCC36136a314de"),
  baseswapv3: ethers.getAddress("0x327Df1E6de05895d2ab08513aaDD9313Fe505d86"),
  alienbasev3: ethers.getAddress("0x8c1A3cF8f83074169FE5D7aD50B978e1cD6b37c7"),
};

export const DEX_LIST_PRIORITY: DexType[] = [
  "uniswapv3", "aerodrome", "aerodromeslipstream", "pancakeswapv3",
  "uniswapv2", "sushiswapv3", "baseswapv3", "alienbasev3"
];


// Contratos de cada quoters dividios em formato unico e mapa

//Contrato de quoters
export const aerodromeslipstreamQuoter = ethers.getAddress("0x254cF9E1E6e233aa1AC962CB9B05b2cfeAaE15b0"); //Verified
export const uniswapv3Quoter2 = ethers.getAddress("0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a"); //Verified
export const pancakeswapv3Quoter = ethers.getAddress("0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997");//Verified
export const aerodromeQuoter = ethers.getAddress("0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43"); //Verified
export const uniswapv2Quoter = ethers.getAddress("0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24"); //Verified**  
export const sushiswapv3Quoter = ethers.getAddress("0x80C7DD17B01855a6D2347444a0FCC36136a314de"); //Verified**  
export const baseswapv3Quoter = ethers.getAddress("0x327Df1E6de05895d2ab08513aaDD9313Fe505d86"); //Verified
export const uniswapv4Quoter = ethers.getAddress("0x0d5e0f971ed27fbff6c2837bf31316121532048d"); //Verified 
export const alienbasev3Quoter = ethers.getAddress("0x8c1A3cF8f83074169FE5D7aD50B978e1cD6b37c7"); //Verified

//Dex-Use-map DE qUOTERS
export const DEX_QUOTERS: Record<DexType, string> = {  
  aerodromeslipstream: ethers.getAddress("0x254cF9E1E6e233aa1AC962CB9B05b2cfeAaE15b0"),
  uniswapv3: ethers.getAddress("0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a"),
  pancakeswapv3: ethers.getAddress("0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997"),
  aerodrome: ethers.getAddress("0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43"),
  uniswapv2: ethers.getAddress("0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24"),
  sushiswapv3: ethers.getAddress("0x80C7DD17B01855a6D2347444a0FCC36136a314de"),
  baseswapv3: ethers.getAddress("0x327Df1E6de05895d2ab08513aaDD9313Fe505d86"),
  alienbasev3: ethers.getAddress("0x8c1A3cF8f83074169FE5D7aD50B978e1cD6b37c7"),
};


// Contratos de cada Factory  divididos em formato unico e mapa

//Contrato de Factory
export const aerodromeslipstreamFactory = ethers.getAddress("0x5e7BB104d84c7CB9B682AaC2F3d509f5F406809A"); //Verified
export const uniswapv3Factory = ethers.getAddress("0x33128a8fC17869897dcE68Ed026d694621f6FDfD"); //Verified
export const pancakeswapv3Factory = ethers.getAddress("0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865"); //Verified
export const aerodromeFactory = ethers.getAddress("0x420DD381b31aEf6683db6B902084cB0FFECe40Da");//Verified
export const uniswapv2Factory= ethers.getAddress("0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6"); //Verified
export const sushiswapv3Factory = ethers.getAddress("0xc35DADB65012eC5796536bD9864eD8773aBc74C4");//Verified
export const baseswapv3Factory = ethers.getAddress("0xFDa619b6d20975be80A10332cD39b9a4b0FAa8BB"); //Verified
export const uniswapv4Factory = ethers.getAddress("0x498581ff718922c3f8e6a244956af099b2652b2b"); //Verified
export const alienbasev3Factory = ethers.getAddress("0x3e84d913803b02a4a7f027165e8ca42c14c0fde7"); //Verified


//Factory use
export const DEX_FACTORY = {
aerodromeslipstreamFactory: ethers.getAddress("0x5e7BB104d84c7CB9B682AaC2F3d509f5F406809A"),
uniswapv3Factory: ethers.getAddress("0x33128a8fC17869897dcE68Ed026d694621f6FDfD"),
pancakeswapv3Factory: ethers.getAddress("0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865"),
aerodromeFactory: ethers.getAddress("0x420DD381b31aEf6683db6B902084cB0FFECe40Da"),
uniswapv2Factory: ethers.getAddress("0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6"),
sushiswapv3Factory: ethers.getAddress("0xc35DADB65012eC5796536bD9864eD8773aBc74C4"),
baseswapv3Factory: ethers.getAddress("0xFDa619b6d20975be80A10332cD39b9a4b0FAa8BB"),
uniswapv4Factory: ethers.getAddress("0x498581ff718922c3f8e6a244956af099b2652b2b"),
alienbasev3Factory: ethers.getAddress("0x3e84d913803b02a4a7f027165e8ca42c14c0fde7"),
};



export const ALLOWED_ADDRESSES = new Set([
  "0xBE6D8f0d05cC4be24d5167a3eF062215bE6D18a5",
  "0x2626664c2603336E57B271c5C0b26F421741e481",
  "0x1b81D678ffb9C0263b24A97847620C99d213eB14",
  "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43",
  "0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24",
  "0x80C7DD17B01855a6D2347444a0FCC36136a314de",
  "0x327Df1E6de05895d2ab08513aaDD9313Fe505d86",
  "0x8c1A3cF8f83074169FE5D7aD50B978e1cD6b37c7",
].map(addr => addr.toLowerCase()));

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
  BASESCAN: "https://api.base.io/api?module=gastracker&action=gasoracle",
  ETHERSCAN: "https://api.etherscan.io/api?module=gastracker&action=gasoracle",
};

export const executoraddress = ethers.getAddress("0x54bd990AB55367F3eA1648702c833eF33Da3Ba5D");
export const WETH = ethers.getAddress("0x4200000000000000000000000000000000000006");