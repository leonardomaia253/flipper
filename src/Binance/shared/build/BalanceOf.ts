import { ethers } from "ethers";
import { executoraddress } from "../../constants/addresses";
import { WBNB} from "../../constants/addresses";

export async function getWETHBalance({
  provider,
}: {
  provider: ethers.Provider;
}) {
  const weth = new ethers.Contract(WBNB, ["function balanceOf(address) view returns (uint256)"], provider);
  return await weth.balanceOf(executoraddress);
}
