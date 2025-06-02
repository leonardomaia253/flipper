
import { ethers } from "ethers";
import { MULTI_FLASH_LOAN_EXECUTOR_ABI } from "../constants/abis";
// ABI reduzida do executor e do ERC20

const erc20Abi = ["function balanceOf(address) view returns (uint256)"];

// Tipo CallData igual ao seu contrato
interface CallData {
  target?: string;
  data?: string;
  requiresApproval?: boolean;
  approvalToken?: string;
  approvalAmount?: ethers.BigNumberish;
}

export async function simulateTokenProfit({
  provider,
  executoraddress,
  tokenaddress,
  orchestrationResult,
}: {
  provider: ethers.JsonRpcProvider;
  executoraddress: string;
  tokenaddress: string;
  orchestrationResult: {
    approveCalls: CallData[];
    swapCalls: CallData[];
  };
}) {
  const token = new ethers.Contract(tokenaddress, erc20Abi, provider);

  // Junta os calls em sequência: aprovações + swaps
  const allCalls = [...orchestrationResult.approveCalls, ...orchestrationResult.swapCalls];

  // Codifica a chamada ao executor
  const iface = new ethers.Interface(MULTI_FLASH_LOAN_EXECUTOR_ABI);
  const calldata = iface.encodeFunctionData("orchestrate", [allCalls]);

  const balanceBefore = await token.balanceOf(executoraddress);

  try {
    await provider.call({
      to: executoraddress,
      data: calldata,
      from: executoraddress,
    });
  } catch (error: any) {
    console.warn("⚠️ Simulação revertida:", parseRevertReason(error));
    return ethers.toBigInt(0);
  }

  const balanceAfter = await token.balanceOf(executoraddress);
  const profit = balanceAfter.sub(balanceBefore);

  return profit;
}

// Helper para extrair motivo do revert
function parseRevertReason(error: any): string {
  try {
    if (error.data) {
      return ethers.formatUnits(`0x${error.data.substring(138)}`).replace(/\u0000/g, '');
    }
    if (typeof error.message === 'string' && error.message.includes('reverted with reason string')) {
      const match = error.message.match(/'([^']+)'/);
      if (match && match[1]) return match[1];
    }
    return 'Unknown revert reason';
  } catch {
    return 'Unable to parse revert reason';
  }
}



// Adding the missing simulateTransaction function
export async function simulateTransaction({
  provider,
  to,
  data,
  value = 0,
  from,
}: {
  provider: ethers.JsonRpcProvider;
  to: string;
  data: string;
  value?: number | string;
  from?: string;
}) {
  try {
    // If from is not provided, use a random address
    const fromaddress = from || ethers.Wallet.createRandom().address;
    
    // Execute call
    const result = await provider.call({
      to,
      data,
      value: ethers.parseEther(value.toString()),
      from: fromaddress,
    });
    
    return {
      success: true,
      result,
      gasUsed: ethers.toBigInt(0) // In a real simulation we would get actual gas usage
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      reason: parseRevertReason(error)
    };
  }
}

