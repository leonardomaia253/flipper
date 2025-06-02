import { ethers } from "ethers";
import { CallData } from "../../utils/types";
import { executoraddress } from "../../constants/addresses";

// Constrói uma call para flashloan que executa uma sequência de operações
export async function buildOrchestrateCall({
  token,
  amount,
  calls,
}: {
  token: string;
  amount: ethers.BigNumberish;
  calls: CallData[];
}): Promise<{ 
  data: string;
  to: string;
}> {
  
  const iface = new ethers.Interface([
    "function orchestrate((address provider, address token, uint256 amount)[],(address target, bytes data, bool requiresApproval, address approvalToken, uint256 approvalAmount)[])"
  ]);

  // Definindo o flashloan (exemplo com Aave como provider)
  const flashloan = [{
    provider: ethers.getAddress("0xA8b1bA3f8A4fA6a7b7C1d0eF3F1eA2b3C4D5E6F7"),// Endereço real do provider, ex: Aave pool
    token,
    amount: amount
  }];

  const data = iface.encodeFunctionData("orchestrate", [flashloan, calls]);

  return {
    to: executoraddress,
    data: data,
  };
}
