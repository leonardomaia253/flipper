import { ethers } from "ethers";
import { BuiltRoute, SimulationResult } from "../utils/types";
import { enhancedLogger } from "../utils/enhancedLogger";
import axios from "axios";
import { TENDERLY_CONFIG } from "../constants/config";

/**
 * Simulate a route and validate its profitability using Tenderly simulation
 */
export async function simulateAndValidateRoute(
  route: BuiltRoute,
  useraddress: string
): Promise<SimulationResult> {
  try {
    enhancedLogger.info(`Simulating route with ${route.swaps.length} swaps`, {
      botType: "arbitrage",
      metadata: { 
        tokenIn: route.swaps[0]?.tokenIn || "unknown",
        tokenOut: route.swaps[route.swaps.length - 1]?.tokenOut || "unknown",
      }
    });

    // Prepare the simulation payload for Tenderly API
    const simulationPayload = {
      network_id: "56", // Binance One
      from: useraddress,
      to: route.swaps[0]?.target || ethers.ZeroAddress,
      input: route.swaps[0]?.callData || "0x",
      gas: 10_000_000, // Gas limit, can be adjusted
      value: "0", // ETH value to send
      save: true, // Save simulation for later reference
      save_if_fails: true, // Save even if simulation fails
      simulation_type: "full" // Full simulation to get accurate results
    };

    // Call Tenderly API for simulation
    const response = await axios.post(
      `https://api.tenderly.co/api/v1/account/${TENDERLY_CONFIG.account}/project/${TENDERLY_CONFIG.project}/simulate-bundle`,
      simulationPayload,
      {
        headers: {
          "X-Access-Key": TENDERLY_CONFIG.accessKey,
          "Content-Type": "application/json"
        }
      }
    );

    // Process simulation results
    const simulationResult = response.data?.simulation;
    if (!simulationResult) {
      throw new Error("Invalid simulation response from Tenderly");
    }

    // Extract token transfers from the simulation
    const tokenTransfers = simulationResult.transaction?.transaction_info?.token_transfers || [];

    // Calculate profit based on token transfers
    let totalIn = 0n;
    let totalOut = 0n;

    tokenTransfers.forEach((transfer: any) => {
      const value = ethers.toBigInt(transfer.value);
      if (transfer.to.toLowerCase() === useraddress.toLowerCase()) {
        totalIn += value;
      } else if (transfer.from.toLowerCase() === useraddress.toLowerCase()) {
        totalOut += value;
      }
    });

    // Calculate profit
    const profits = totalIn - totalOut;

    // Generate simulation URL
    const simulationUrl = `https://dashboard.tenderly.co/simulator/${simulationResult.id}`;

    // Log result
    if (profits > 0n) {
      enhancedLogger.info(`Simulation successful with projected profit: ${ethers.formatEther(profits)} ETH`, {
        botType: "arbitrage",
        metadata: { 
          simulationUrl,
          profits: ethers.formatEther(profits)
        }
      });
    } else {
      enhancedLogger.warn(`Simulation completed but no profit detected: ${ethers.formatEther(profits)} ETH`, {
        botType: "arbitrage",
        metadata: { 
          simulationUrl,
          profits: ethers.formatEther(profits)
        }
      });
    }

    return {
      success: simulationResult.status === true,
      ok: simulationResult.status === true && profits > 0n,
      profits,
      simulationUrl
    };
  } catch (error) {
    enhancedLogger.error(`Route simulation failed: ${error instanceof Error ? error.message : String(error)}`, {
      botType: "arbitrage",
      data: error
    });

    return {
      success: false,
      ok: false,
      profits: 0n,
      simulationUrl: "",
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
