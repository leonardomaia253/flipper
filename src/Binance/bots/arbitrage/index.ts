
import { ethers } from "ethers";
import { getProvider } from "../../config/provider";
import { buildOrchestrationFromRoute } from "./arbitragebuilder";
import { fetchTopTokensArbitrum } from "../../utils/tokensdefi";
import { findBestArbitrageRoute } from "./arbitrageScanner";
import { TokenInfo } from "../../utils/types";
import { convertRouteToSwapSteps } from "../../utils/swapsteps";
import { createClient } from "@supabase/supabase-js";
import { executorAddress } from "../../../Arbitrum/constants/addresses";
import { buildUnwrapWETHCall } from "../../shared/build/UnwrapWETH";
import {getWETHBalance} from "../../shared/build/BalanceOf"
import {BigNumber, Wallet} from "ethers";
import {buildSwapToETHCall} from "../../shared/build/buildSwapResidual";
import { simulateTokenProfit } from "../../simulation/simulate";
import { sendBundle } from "../../../Arbitrum/executor/sendBundle";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Initialize Supabase client for database interaction
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration with defaults and environment variables
const MIN_PROFIT_ETH = parseFloat(process.env.MIN_PROFIT_ETH || "0.01");

// Initialize provider and signer
const provider = new ethers.providers.WebSocketProvider(process.env.ALCHEMY_WSS!);
const signer = new Wallet(process.env.PRIVATE_KEY!, provider);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Bot state tracking
let isRunning = false;
let currentBaseToken: TokenInfo = {
  address: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1", // WETH
  symbol: "WETH",
  decimals: 18,
};
let currentProfitThreshold = MIN_PROFIT_ETH;

// Function to check for bot configuration changes
async function checkBotConfig() {
  try {
    // Fetch current bot configuration from database
    const { data, error } = await supabase
      .from('bot_statistics')
      .select('is_running')
      .eq('bot_type', 'arbitrage')
      .single();
      
    if (error) {
      console.error("❌ Error fetching bot configuration:", error.message);
      return;
    }
    
    // Update local running state based on database
    if (data && isRunning !== data.is_running) {
      if (data.is_running) {
        console.log("🟢 Bot enabled from UI, starting operations...");
        isRunning = true;
      } else {
        console.log("🔴 Bot disabled from UI, pausing operations...");
        isRunning = false;
      }
      
      // Log the state change
      await supabase.from('bot_logs').insert({
        level: isRunning ? 'info' : 'warn',
        message: isRunning ? 'Bot started via UI control' : 'Bot stopped via UI control',
        category: 'bot_state',
        bot_type: 'arbitrage',
        source: 'system'
      });
    }
    
    // Check for configuration changes (like base token or profit threshold)
    // This could be extended based on what configuration options are available in the UI
    
  } catch (err: any) {
    console.error("❌ Failed to check bot configuration:", err.message);
  }
}

async function executeCycle() {
  if (!isRunning) {
    await sleep(1000);
    return;
  }

  try {
    console.log("🔍 Buscando tokens top 200 por volume na Arbitrum...");
    const tokenList = await fetchTopTokensArbitrum(200);

    if (tokenList.length === 0) {
      console.error("❌ Lista de tokens vazia, abortando.");
      return;
    }

    console.log(`✅ Tokens carregados: ${tokenList.length}. Rodando busca de arbitragem...`);

    const bestRoute = await findBestArbitrageRoute({
      provider,
      baseToken: currentBaseToken,
      tokenList,
    });

    if (!bestRoute) {
      console.log("❌ Nenhuma rota de arbitragem encontrada.");
      return;
    }

    const profitInETH = parseFloat(ethers.utils.formatUnits(bestRoute.netProfit, currentBaseToken.decimals));

    if (profitInETH < currentProfitThreshold) {
      console.log(`⚠️ Lucro ${profitInETH} ETH abaixo do mínimo. Ignorando...`);
      return;
    }

    if (bestRoute && bestRoute.route.length > 0) {
      try {
        const routeStr =
          bestRoute.route.map((swap) => swap.tokenIn.symbol).join(" → ") +
          " → " +
          bestRoute.route.at(-1)?.tokenOut.symbol;
        
        if (!bestRoute?.route) throw new Error("Best route undefined");

        const steps = await convertRouteToSwapSteps(bestRoute.route, executorAddress);

        const startsWithBaseToken =
          bestRoute.route[0]?.tokenIn.address.toLowerCase() === currentBaseToken.address.toLowerCase();

        const orchestrationResult = await buildOrchestrationFromRoute({
          route: steps,
          executor: executorAddress,
          altToken: currentBaseToken.address,
          useAltToken: !startsWithBaseToken,
        });

        if (!orchestrationResult) {
          console.error("❌ Erro ao montar a orquestração.");
          return;
        }

        const { calls, flashLoanToken } = orchestrationResult;

        const profit = await simulateTokenProfit({
          provider,
          executorAddress,
          tokenAddress: flashLoanToken,
          calls,
        });

        const SwapRemainingtx = await buildSwapToETHCall({
          tokenIn: flashLoanToken,
          amountIn: profit,
          recipient: executorAddress,
        });

        const wethBalanceRaw = await getWETHBalance({ provider });

        let wethBalance: BigNumber;
        try {
          wethBalance = ethers.utils.parseEther(wethBalanceRaw);
        } catch {
          wethBalance = BigNumber.from(wethBalanceRaw);
        }

        const unwrapCall = buildUnwrapWETHCall({ amount: wethBalance });

        const txs = [...(Array.isArray(calls) ? calls : [calls]), SwapRemainingtx, unwrapCall];

        const bundleTxs = txs.map((tx) => ({
          signer: signer,
          transaction: {
            to: tx.to,
            data: tx.data,
            gasLimit: 500_000,
          },
        }));

        await sendBundle(bundleTxs, provider);
      } catch (innerErr) {
        console.error("❌ Erro na montagem/executação da rota:", innerErr);
      }
    }
  } catch (err) {
    console.error("❌ Erro durante ciclo:", err);
  }
}


// Main bot loop
async function loop() {
  console.log("🤖 Iniciando bot de arbitragem...");
  
  // Initial configuration load
  try {
    const { data, error } = await supabase
      .from('bot_statistics')
      .select('is_running')
      .eq('bot_type', 'arbitrage')
      .single();
      
    if (data) {
      isRunning = data.is_running || false;
      console.log(`🤖 Estado inicial do bot: ${isRunning ? 'EXECUTANDO' : 'PARADO'}`);
    } else {
      // Initialize bot_statistics if it doesn't exist
      await supabase.from('bot_statistics').upsert({
        bot_type: 'arbitrage',
        is_running: false,
        total_profit: 0,
        success_rate: 0,
        average_profit: 0,
        gas_spent: 0,
        transactions_count: 0,
        updated_at: new Date().toISOString()
      });
    }
  } catch (err) {
    console.error("❌ Error initializing bot state:", err);
  }
  
  // Log bot startup
  await supabase.from("bot_logs").insert({
    level: "info",
    message: `Bot iniciado com configuração: Profit min=${currentProfitThreshold} ETH, Base token=${currentBaseToken.symbol}`,
    category: "bot_state",
    bot_type: "arbitrage",
    source: "system",
    metadata: { 
      profitThreshold: currentProfitThreshold,
      baseToken: currentBaseToken.symbol,
      isRunning
    },
  });

  while (true) {
    try {
      // Check for configuration changes from UI
      await checkBotConfig();
      
      // Run execution cycle if bot is enabled
      if (isRunning) {
        await executeCycle();
      }
    } catch (err) {
      console.error("❌ Erro no loop principal:", err);
    }
    await sleep(1000); // Poll every second
  }
}

// Start the bot
loop();
