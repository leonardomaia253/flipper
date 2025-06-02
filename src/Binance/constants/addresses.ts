import {ethers} from "ethers";
import {DexType} from "../utils/types";


//Contratos de Routers
export const uniswapv2Router = ethers.getAddress("0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24"); //Verified
export const pancakeswapv2Router = ethers.getAddress("0x10ED43C718714eb63d5aA57B78B54704E256024E"); //Verified
export const nomiswapRouter = ethers.getAddress("0x596f619600da38ace164c9facee730c6dbe83c86"); //Verified
export const pancakeswapv3Router = ethers.getAddress("0x1A0A18AC4BECDDbd6389559687d1A73d8927E416"); //Verified
export const uniswapv3Router = ethers.getAddress("0xB971eF87ede563556b2ED4b1C0b0019111Dd85d2"); //Verified

//Dex-Use-map DE ROUTERS
export const DEX_ROUTER: Record<DexType, string> = {
  uniswapv2: ethers.getAddress("0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24"),
  pancakeswapv2: ethers.getAddress("0x10ED43C718714eb63d5aA57B78B54704E256024E"),
  nomiswap: ethers.getAddress("0x596f619600da38ace164c9facee730c6dbe83c86"),
  pancakeswapv3: ethers.getAddress("0x1A0A18AC4BECDDbd6389559687d1A73d8927E416"),
  uniswapv3: ethers.getAddress("0xB971eF87ede563556b2ED4b1C0b0019111Dd85d2"),
};

export const DEX_LIST_PRIORITY: DexType[] = [
  "uniswapv2", "pancakeswapv2", "nomiswap", "pancakeswapv3", "uniswapv3"
];


// Contratos de cada quoters dividios em formato unico e mapa

//Contrato de quoters
export const uniswapv2Quoter = ethers.getAddress("0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24"); //Verified
export const pancakeswapv2Quoter = ethers.getAddress("0x10ED43C718714eb63d5aA57B78B54704E256024E");//Verified
export const nomiswapQuoter = ethers.getAddress("0x596f619600da38ace164c9facee730c6dbe83c86"); //Verified
export const pancakeswapv3Quoter = ethers.getAddress("0x78D78E420Da98ad378D7799bE8f4AF69033EB077"); //Verified
export const uniswapv3Quoter = ethers.getAddress("0x78D78E420Da98ad378D7799bE8f4AF69033EB077"); //Verified**  

//Dex-Use-map DE qUOTERS
export const DEX_QUOTERS: Record<DexType, string> = {  
  uniswapv2: ethers.getAddress("0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24"),
  pancakeswapv2: ethers.getAddress("0x10ED43C718714eb63d5aA57B78B54704E256024E"),
  nomiswap: ethers.getAddress("0x596f619600da38ace164c9facee730c6dbe83c86"),
  pancakeswapv3: ethers.getAddress("0x78D78E420Da98ad378D7799bE8f4AF69033EB077"),
  uniswapv3: ethers.getAddress("0x78D78E420Da98ad378D7799bE8f4AF69033EB077"),
};


// Contratos de cada Factory  divididos em formato unico e mapa

//Contrato de Factory
export const uniswapv2Factory = ethers.getAddress("0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6"); //Verified
export const pancakeswapv2Factory = ethers.getAddress("0xBCfCcbde45cE874adCB698cC183deBcF17952812"); //Verified
export const nomiswapFactory = ethers.getAddress("0xd6715A8be3944ec72738F0BFDC739d48C3c29349"); //Verified
export const pancakeswapv3Factory = ethers.getAddress("0x1097053Fd2ea711dad45caCcc45EfF7548fCB362"); //Verified
export const uniswapv3Factory = ethers.getAddress("0xdB1d10011AD0Ff90774D0C6Bb92e5C5c8b4461F7"); //Verified



//Factory use
export const DEX_FACTORY = {
  uniswapv2Factory: ethers.getAddress("0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6"),
  pancakeswapv2Factory: ethers.getAddress("0xBCfCcbde45cE874adCB698cC183deBcF17952812"),
  nomiswapFactory: ethers.getAddress("0xd6715A8be3944ec72738F0BFDC739d48C3c29349"),
  pancakeswapv3Factory: ethers.getAddress("0x1097053Fd2ea711dad45caCcc45EfF7548fCB362"),
  uniswapv3Factory: ethers.getAddress("0xdB1d10011AD0Ff90774D0C6Bb92e5C5c8b4461F7"),
};

export const ALLOWED_ADDRESSES = new Set( [
  "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24",
  "0x10ED43C718714eb63d5aA57B78B54704E256024E",
  "0x596f619600da38ace164c9facee730c6dbe83c86",
  "0x1A0A18AC4BECDDbd6389559687d1A73d8927E416",
  "0xB971eF87ede563556b2ED4b1C0b0019111Dd85d2",
].map(addr => addr.toLowerCase()));
  

export const SWAP_FUNCTION_SIGNATURES = new Set([
  "0x38ed1739", // swapExactTokensForTokens
  "0x5c11d795", // SwapExactTokensForTokensSupportingFeeOnTransferTokens
  "0xc04b8d59", // exactInput
  "0x414bf389", // ExactInputSingle
  "0x8803dbee", //swapTokensForExactTokens

]);
//0x414bf389 //ExactInputSingle
//0xc04b8d59 //ExactInput
//0xac9650d8 //Multicall
//0x5c11d795 //SwapExactTokensForTokensSupportingFeeOnTransferTokens
//0x38ed1739

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
export const WBNB = ethers.getAddress("0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c");