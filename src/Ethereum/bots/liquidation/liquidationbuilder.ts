import { estimateSwapOutput } from "../../utils/estimateOutput";
import { ethers } from "ethers";
import { CallData, BuildLiquidationOrchestrationOptions } from "../../utils/types";
import { BigNumberish } from "ethers";
import { DEX_ROUTER, uniswapv3Router } from "../../constants/addresses";
import { buildSwapTransaction } from "../../shared/build/buildSwap";
import { ERC20_ABI } from '../../constants/abis';
import { estimateCollateralReceived } from "../../utils/estimaterepaybonus";

const erc20Interface = new ethers.Interface(ERC20_ABI);

async function detectCollateralType(tokenAddress: string, provider: ethers.JsonRpcProvider): Promise<"cToken" | "aToken" | "erc20"> {
  const cTokenInterface = new ethers.Interface([
    "function exchangeRateStored() view returns (uint256)",
    "function underlying() view returns (address)"
  ]);

  const aTokenInterface = new ethers.Interface([
    "function UNDERLYING_ASSET_ADDRESS() view returns (address)"
  ]);

  try {
    await provider.call({
      to: tokenAddress,
      data: cTokenInterface.encodeFunctionData("exchangeRateStored")
    });
    return "cToken";
  } catch {}

  try {
    await provider.call({
      to: tokenAddress,
      data: aTokenInterface.encodeFunctionData("UNDERLYING_ASSET_ADDRESS")
    });
    return "aToken";
  } catch {}

  return "erc20";
}

export async function buildLiquidationOrchestration({
  flashLoanToken,
  flashLoanAmount,
  liquidatorContract,
  borrower,
  repayToken,
  collateralToken,
  slippageBps = 30,
  liquidationBonusBps = 500, // ✅ Aqui coloca valor padrão: 5%
  provider,
  protocol,
}: BuildLiquidationOrchestrationOptions & { provider: ethers.JsonRpcProvider; liquidationBonusBps?: number }): Promise<{
  approveCalls: CallData[];
  liquidationCall: CallData;
  postSwapCalls: CallData[];
}> {
  const approveCache = new Set<string>();
  const approveCalls: CallData[] = [];
  const postSwapCalls: CallData[] = [];

  let repayAmount = flashLoanAmount;

  // --- Pré-swap se necessário ---
  if (flashLoanToken.toLowerCase() !== repayToken.toLowerCase()) {
    let estimated: BigNumberish;
    try {
      estimated = await estimateSwapOutput(
        flashLoanToken,
        repayToken,
        flashLoanAmount,
        "uniswapv3"
      );
    } catch (err) {
      throw new Error(`Falha na estimativa do pré-swap: ${(err as Error).message}`);
    }

    const minOut = (BigInt(estimated) * BigInt(10_000 - slippageBps)) / BigInt(10_000);
    repayAmount = estimated;

    const tokenKey = `${flashLoanToken.toLowerCase()}-UNISWAP`;
    if (!approveCache.has(tokenKey)) {
      approveCache.add(tokenKey);
      approveCalls.push({
        to: flashLoanToken,
        data: erc20Interface.encodeFunctionData("approve", [DEX_ROUTER.uniswapv3, flashLoanAmount]),
        dex: "uniswapv3",
        requiresApproval: true,
        approvalToken: flashLoanToken,
        approvalAmount: flashLoanAmount,
        value: BigInt(0),
      });
    }

    const preSwap = await buildSwapTransaction({
      tokenIn: flashLoanToken,
      tokenOut: repayToken,
      amountIn: flashLoanAmount,
      amountOutMin: minOut,
      dex: "uniswapv3",
    });

    postSwapCalls.push(preSwap);
  }

  // --- Aprovação do repayToken para o liquidator ---
  const tokenKey = `${repayToken.toLowerCase()}-LIQUIDATOR`;
  if (!approveCache.has(tokenKey)) {
    approveCache.add(tokenKey);
    approveCalls.push({
      to: repayToken,
      data: erc20Interface.encodeFunctionData("approve", [liquidatorContract, repayAmount]),
      protocol,
      requiresApproval: true,
      approvalToken: repayToken,
      approvalAmount: repayAmount,
      value: BigInt(0),
    });
  }

  // --- Montagem da liquidate() ---
  const liquidationInterface = new ethers.Interface([
    "function liquidate(address borrower, address repayToken, uint256 repayAmount, address collateralToken)"
  ]);

  const liquidationCall: CallData = {
    to: liquidatorContract,
    data: liquidationInterface.encodeFunctionData("liquidate", [
      borrower,
      repayToken,
      repayAmount,
      collateralToken
    ]),
    protocol,
    requiresApproval: false,
    approvalToken: "",
    approvalAmount: BigInt(0),
    value: BigInt(0),
  };

  // --- Detecção do tipo de collateral ---
  const collateralType = await detectCollateralType(collateralToken, provider);
  let underlyingToken = collateralToken;
  const estimatedCollateral = estimateCollateralReceived(repayAmount, liquidationBonusBps);

  if (collateralType === "cToken") {
    const cTokenInterface = new ethers.Interface([
      "function redeem(uint256 redeemTokens) external returns (uint256)",
      "function underlying() view returns (address)"
    ]);

    // Redeem
    const redeemCall: CallData = {
      to: collateralToken,
      data: cTokenInterface.encodeFunctionData("redeem", [estimatedCollateral]),
      protocol: "compound",
      requiresApproval: false,
      approvalToken: "",
      approvalAmount: BigInt(0),
      value: BigInt(0),
    };

    postSwapCalls.push(redeemCall);

    try {
      const data = cTokenInterface.encodeFunctionData("underlying");
      const result = await provider.call({ to: collateralToken, data });
      [underlyingToken] = cTokenInterface.decodeFunctionResult("underlying", result);
    } catch {
      throw new Error(`Falha ao obter underlying de cToken ${collateralToken}`);
    }
  } else if (collateralType === "aToken") {
    const aTokenInterface = new ethers.Interface([
      "function UNDERLYING_ASSET_ADDRESS() view returns (address)",
      "function withdraw(address asset, uint256 amount, address to) external returns (uint256)"
    ]);

    try {
      const data = aTokenInterface.encodeFunctionData("UNDERLYING_ASSET_ADDRESS");
      const result = await provider.call({ to: collateralToken, data });
      [underlyingToken] = aTokenInterface.decodeFunctionResult("UNDERLYING_ASSET_ADDRESS", result);
    } catch {
      throw new Error(`Falha ao obter underlying de aToken ${collateralToken}`);
    }

    // Withdraw
    const withdrawCall: CallData = {
      to: collateralToken,
      data: aTokenInterface.encodeFunctionData("withdraw", [underlyingToken, estimatedCollateral, liquidatorContract]),
      protocol: "aave",
      requiresApproval: false,
      approvalToken: "",
      approvalAmount: BigInt(0),
      value: BigInt(0),
    };

    postSwapCalls.push(withdrawCall);
  }

  // --- Pós-swap se necessário ---
  if (underlyingToken.toLowerCase() !== flashLoanToken.toLowerCase()) {
    let estimated: BigNumberish;

    try {
      estimated = await estimateSwapOutput(
        underlyingToken,
        flashLoanToken,
        estimatedCollateral,
        "uniswapv3"
      );
    } catch (err) {
      throw new Error(`Falha na estimativa do pós-swap: ${(err as Error).message}`);
    }

    const minOut = (BigInt(estimated) * BigInt(10_000 - slippageBps)) / BigInt(10_000);

    const tokenKey = `${underlyingToken.toLowerCase()}-UNISWAP`;
    if (!approveCache.has(tokenKey)) {
      approveCache.add(tokenKey);
      approveCalls.push({
        to: underlyingToken,
        data: erc20Interface.encodeFunctionData("approve", [uniswapv3Router, estimatedCollateral]),
        dex: "uniswapv3",
        requiresApproval: true,
        approvalToken: underlyingToken,
        approvalAmount: estimatedCollateral,
        value: BigInt(0),
      });
    }

    const postSwap = await buildSwapTransaction({
      tokenIn: underlyingToken,
      tokenOut: flashLoanToken,
      amountIn: estimatedCollateral,
      amountOutMin: minOut,
      dex: "uniswapv3",
    });

    postSwapCalls.push(postSwap);
  }

  return {
    approveCalls,
    liquidationCall,
    postSwapCalls,
  };
}
