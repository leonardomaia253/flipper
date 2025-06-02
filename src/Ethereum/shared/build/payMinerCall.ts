import { BigNumberish } from "ethers";
import { ethers } from "ethers";

export function encodePayMinerTx(
  contractaddress: string,
  tokenaddress: string,
  amount: BigNumberish
): { to: string; data: string; value: BigNumberish } {
  const abi = [
    "function payMiner(address token, uint256 amount) external payable",
  ];

  const iface = new ethers.Interface(abi);
  const data = iface.encodeFunctionData("payMiner", [tokenaddress, amount]);

  const value = tokenaddress.toLowerCase() === ethers.ZeroAddress.toLowerCase()
    ? amount
    : 0n;

  return {
    to: contractaddress,
    data,
    value,
  };
}