import { ethers } from "ethers";
import { executoraddress } from "../../constants/addresses";
import { WAVAX} from "../../constants/addresses";

export async function getWETHBalance({
  provider,
}: {
  provider: ethers.Provider;
}) {
  const wavax = new ethers.Contract(WAVAX, ["function balanceOf(address) view returns (uint256)"], provider);
  return await wavax.balanceOf(executoraddress);
}
