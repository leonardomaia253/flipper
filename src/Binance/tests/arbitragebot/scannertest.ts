import { ethers } from "ethers";
import { BigNumber } from "ethers";
import { findBestMultiHopRoute } from "../src/your/path/to/findBestMultiHopRoute";
import * as QuoteRouter from "../src/shared/utils/QuoteRouter";
import * as gasEstimator from "../src/utils/gasEstimator";

jest.mock("../src/shared/utils/QuoteRouter");
jest.mock("../src/utils/gasEstimator");

const mockEstimateSwapOutput = QuoteRouter.estimateSwapOutput as jest.Mock;
const mockEstimateGasUsage = gasEstimator.estimateGasUsage as jest.Mock;
const mockGetGasCostInToken = gasEstimator.getGasCostInToken as jest.Mock;

const USDC = {
  address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  decimals: 6,
  symbol: "USDC",
  name: "USD Coin",
};

const WETH = {
  address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  decimals: 18,
  symbol: "WETH",
  name: "Wrapped Ether",
};

const DAI = {
  address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  decimals: 18,
  symbol: "DAI",
  name: "Dai Stablecoin",
};

describe("findBestMultiHopRoute", () => {
  const mockProvider = {} as ethers.providers.Provider;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve retornar uma rota válida e lucrativa", async () => {
    // mock de retorno para estimateSwapOutput
    mockEstimateSwapOutput.mockImplementation((from, to, amountIn, dex) => {
      if (
        (from === USDC.address && to === WETH.address) ||
        (from === WETH.address && to === DAI.address) ||
        (from === DAI.address && to === USDC.address)
      ) {
        return Promise.resolve(BigNumber.from("1100000")); // simulate profit
      }
      return Promise.resolve(BigNumber.from("0"));
    });

    mockEstimateGasUsage.mockResolvedValue(BigNumber.from("210000"));
    mockGetGasCostInToken.mockResolvedValue(BigNumber.from("10000")); // Simula gas custo de 0.01 USDC

    const result = await findBestMultiHopRoute({
      provider: mockProvider,
      baseToken: USDC,
      tokenList: [WETH, DAI],
      amountInRaw: "1",
    });

    expect(result).toBeTruthy();
    expect(result?.quote.amountOut).toBeGreaterThan(result.inputAmount.toBigInt());
    expect(result?.quote.path.length).toBeGreaterThan(1);
    expect(result?.quote.dex).toContain("→");
    expect(result?.netProfit).toBeGreaterThan(0n);
  });

  it("deve retornar null se não houver rota lucrativa", async () => {
    mockEstimateSwapOutput.mockResolvedValue(BigNumber.from("500000")); // sempre abaixo da entrada
    mockEstimateGasUsage.mockResolvedValue(BigNumber.from("210000"));
    mockGetGasCostInToken.mockResolvedValue(BigNumber.from("10000"));

    const result = await findBestMultiHopRoute({
      provider: mockProvider,
      baseToken: USDC,
      tokenList: [WETH, DAI],
      amountInRaw: "1",
    });

    expect(result).toBeNull();
  });
});
