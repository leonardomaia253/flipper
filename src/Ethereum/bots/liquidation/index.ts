import { ethers } from 'ethers';
import { LiquidationOpportunity } from './liquidationwatcher';
import { buildOrchestrateCall } from '../../shared/build/buildOrchestrate';
import { encodePayMinerTx } from '../../shared/build/payMinerCall';
import { buildUnwrapWETHCall } from '../../shared/build/UnwrapWETH';
import { buildSwapToETHCall } from '../../shared/build/buildSwapResidual';
import { sendSignedTxL2 } from '../../executor/sendBundle';
import { multiprovider, PRIVATE_KEY, providersimplewss } from '../../config/provider';
import { executoraddress, WETH } from '../../constants/addresses';
import { buildLiquidationOrchestration } from './liquidationbuilder';
import { getEquivalentWETHAmount } from '../../utils/getEquivalentWETHAmount';
import { simulateTokenProfit } from '../../simulation/simulate';



export async function mainExecutor(opportunity: LiquidationOpportunity) {
  const start = Date.now();
  const { protocol, liquidated, txHash, calldata, targetContract } = opportunity;

  const signer = new ethers.Wallet(PRIVATE_KEY, multiprovider);
  try {
    console.log(`⚙️ Processando oportunidade de liquidação: ${txHash} para ${liquidated}`);

    // Já recebemos os args decodificados:
    const args = calldata.args;

    // Variáveis para flashLoan token e valor
    let tokenDebtOrCollateral: string;
    let amountTokenDebtOrCollateral: bigint;

    switch (protocol) {
      case 'aave':
        tokenDebtOrCollateral = args.collateral;
        amountTokenDebtOrCollateral = BigInt(args.debtToCover);
        break;

      case 'compound':
        tokenDebtOrCollateral = args.cTokenCollateral;
        amountTokenDebtOrCollateral = BigInt(args.repayAmount);
        break;

      case 'morpho':
        tokenDebtOrCollateral = args.collateral;
        amountTokenDebtOrCollateral = BigInt(args.amount);
        break;

      default:
        console.error(`❌ Protocolo desconhecido: ${protocol}`);
        return;
    }

    // Converte para WETH
    const flashLoanAmountRaw = await getEquivalentWETHAmount(tokenDebtOrCollateral, amountTokenDebtOrCollateral);

    // Aplica margem de 2%
    const flashLoanAmount = (flashLoanAmountRaw * 102n) / 100n;
    const flashLoanToken = WETH;

    console.log(`🔗 Token do flash loan: ${flashLoanToken}, valor: ${flashLoanAmount}`);


    // Monta a orquestração dinâmica da transação
    const orchestrationResult = await buildLiquidationOrchestration({
      flashLoanToken, flashLoanAmount, liquidatorContract:targetContract, borrower: liquidated, provider: alchemysupport,protocol, repayToken:tokenDebtOrCollateral, 
    });

    if (!orchestrationResult) {
      console.error(`❌ Erro ao montar orquestração da tx ${txHash}`);
      return;
    }


    // Monta as chamadas para approve e swap
    const calls = [
      ...orchestrationResult.approveCalls.map(call => ({
        to: call.to,
        data: call.data,
        requiresApproval: true,
        approvalToken: call.approvalToken,
        approvalAmount: call.approvalAmount,
      })),
      ...orchestrationResult.swapCalls.map(call => ({
        to: call.to,
        data: call.data,
        requiresApproval: true,
        approvalToken: call.approvalToken,
        approvalAmount: call.approvalAmount,
      })),
    ];

    // Monta a chamada orquestrada atômica (flashloan + swaps + aprovações)
    const atomic = await buildOrchestrateCall({
      token: flashLoanToken,
      amount: flashLoanAmount,
      calls,
    });

    // Transação para swap do lucro residual para ETH
    const swapRemainingTx = await buildSwapToETHCall({
      tokenIn: flashLoanToken,
      amountIn: profit!,
      recipient: executoraddress,
    });

    // Call para unwrap WETH para ETH
    const unwrapCall = buildUnwrapWETHCall({ wethaddress: WETH });

    // Call para pagar o miner (MEV share)
    const minerTx = encodePayMinerTx(executoraddress, WETH, ethers.parseEther("0.002"));

    // Lista de txs para o bundle
    const txs = [atomic, swapRemainingTx, unwrapCall, minerTx];

    const gasLimitPerTx = 500_000;

    // Monta os objetos tx para envio
    const bundleTxs = txs.map(tx => ({
      signer: signer,
      transaction: {
        to: tx.to,
        data: tx.data,
        gasLimit: gasLimitPerTx,
      },
    }));

    const totalGas = BigInt(gasLimitPerTx) * BigInt(bundleTxs.length);
    console.info(`⛽️ Gas estimado: ${totalGas}`);

    if (config.DRY_RUN) {
      console.warn(`🧪 DRY-RUN ativado: bundle não será enviado - tx ${txHash}`);
      bundleTxs.forEach((tx, i) => console.log(`Bundle tx ${i + 1}: ${JSON.stringify(tx, null, 2)}`));
      console.log(`Lucro estimado: ${ethers.formatEther(profit!)} ETH`);
      console.log(`Gas estimado: ${totalGas}`);
    } else {
      // Retry em caso de falha no envio
      await retry(async () => {
        await sendSignedTxL2({
          providers: providersimplehttp,
          bundleTxs,
          flashbotsEndpoint: process.env.FLASHBOTS!,
          mevShareEndpoint: process.env.MEV_SHARE!,
          signerKey: process.env.PRIVATE_KEY!,
          blocksRouteEndpoint: process.env.BLOXROUTE!,
          customHeaders: { Authorization: `Bearer ${process.env.BLOXROUTE_AUTH}` },
        });
        console.info(`✅ Bundle enviado - tx ${txHash}`);
      }, {
        retries: 3,
        minTimeout: 500,
        maxTimeout: 2000,
        factor: 2,
      });
    }

  } catch (err) {
    console.error(`❌ Erro ao processar tx ${txHash}: ${(err as Error).message}`);
  } finally {
    cleanCache(txHash);
    const duration = Date.now() - start;
    console.info(`⏱️ Processamento levou ${duration} ms - tx ${txHash}`);
  }
}
