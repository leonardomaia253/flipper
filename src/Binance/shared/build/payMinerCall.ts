import { BigNumberish } from "ethers";
import { ethers } from "ethers";

export function encodePayMiner(
  contractaddress: string,
  tokenaddress: string,
  amount: BigNumberish
): ethers.TransactionRequest {
  const abi = [
    "function payMiner(address token, uint256 amount) external payable",
  ];

  const iface = new ethers.Interface(abi);
  const data = iface.encodeFunctionData("payMiner", [tokenaddress, amount]);

  const value = tokenaddress.toLowerCase() === ethers.ZeroAddress.toLowerCase()
    ? amount
    : 0n;

  return {
    to: contractaddress, // em vez de hardcoded
    data,
    value,
    gasLimit: 200_000n, // use valor maior do que 21000 se não for uma tx simples
    maxFeePerGas: ethers.parseUnits("100", "gwei"),
    maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
  };
}
