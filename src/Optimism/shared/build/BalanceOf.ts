import { ethers } from "ethers";
import { executoraddress } from "../../constants/addresses";
import { WETH } from "../../constants/addresses";

export async function getWETHBalance({
  provider,
}: {
  provider: ethers.Provider;
}) {
  const weth = new ethers.Contract(WETH, ["function balanceOf(address) view returns (uint256)"], provider);
  return await weth.balanceOf(executoraddress);
}
