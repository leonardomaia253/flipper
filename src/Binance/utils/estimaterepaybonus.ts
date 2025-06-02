import { BigNumberish } from "ethers";

export function estimateCollateralReceived(repayAmount: BigNumberish, liquidationBonusBps: number): BigNumberish {
  return (BigInt(repayAmount) * BigInt(10_000 + liquidationBonusBps)) / BigInt(10_000);
}