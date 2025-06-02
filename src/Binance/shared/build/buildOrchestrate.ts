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
    provider: ethers.getAddress("0x6807dc923806fE8Fd134338EABCA509979a7e0cB"),// Endereço real do provider, ex: Aave pool
    token,
    amount: amount
  }];

  const data = iface.encodeFunctionData("orchestrate", [flashloan, calls]);

  return {
    to: executoraddress,
    data: data,
  };
}
