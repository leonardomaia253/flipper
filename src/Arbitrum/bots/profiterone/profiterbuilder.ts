import { Call, BasicSwapStep, BuildOrchestrationParams } from "../../utils/types";
import { buildSwapTransaction } from "../../shared/build/buildSwap";
import { buildApproveCall } from "../../shared/build/buildApproveCall";
import { selectFlashloanToken } from "../../utils/flashloanamount";
import { BigNumber } from "ethers";
import { DEX_ROUTER } from "../../constants/addresses";

export interface OrchestrationResult {
  calls: Call[];
  flashLoanAmount: BigNumber;
  flashLoanToken: string;
}

const SLIPPAGE_TOLERANCE = 0.005; // 0.5%, ajuste conforme desejar

export async function buildOrchestrationFromRoute({
  route,
  executor,
  useAltToken,
  altToken,
}: BuildOrchestrationParams): Promise<OrchestrationResult | undefined> {
  if (!route || route.length === 0) {
    throw new Error("Rota inválida ou não encontrada");
  }

  const calls: Call[] = [];

  const firstStep = route[0];
  const lastStep = route[route.length - 1];

  // Extrai os nomes das DEX para pré e pós swap (você pode ajustar conforme sua lógica)
  const preSwapDex = "uniswapv3"; // ex: pode ser parâmetro no futuro
  const postSwapDex = "uniswapv3";

  // Pega o router correto para as DEXs (do mapa)
  const preSwapSpender = DEX_ROUTER[preSwapDex];
  if (useAltToken && !preSwapSpender) {
    throw new Error(`Router do pré-swap não encontrado para a DEX: ${preSwapDex}`);
  }

  const postSwapSpender = DEX_ROUTER[postSwapDex];
  if (useAltToken && !postSwapSpender) {
    throw new Error(`Router do pós-swap não encontrado para a DEX: ${postSwapDex}`);
  }

  // ----------------------------------------
  // 🔁 Flashloan setup
  // ----------------------------------------
  const flashloanData = await selectFlashloanToken({
    dex: preSwapDex,
    tokenIn: firstStep.tokenIn,
    amountIn: firstStep.amountIn,
  });

  if (!flashloanData) return;

  const { flashLoanToken, flashLoanAmount } = flashloanData;

  // ----------------------------------------
  // 🔁 Pré-swap com token alternativo (opcional)
  // ----------------------------------------
  if (useAltToken) {
    // Aprovação do token do flashloan para o router do pré-swap
    calls.push(buildApproveCall(flashLoanToken, preSwapSpender, flashLoanAmount.toString()));

    // Construção do pré-swap para converter flashLoanToken → primeiro token da rota
    const preSwapStep: BasicSwapStep = {
      dex: preSwapDex,
      tokenIn: flashLoanToken,
      tokenOut: firstStep.tokenIn,
      amountIn: flashLoanAmount,
      // Aqui o mínimo que aceitamos é o amountIn do primeiro passo (sem slippage)
      amountOutMin: firstStep.amountIn,
      recipient: executor,
    };
    const preSwapCall = await buildSwapTransaction(preSwapStep);
    calls.push(preSwapCall);
  } else {
    // Aprovação direta do primeiro tokenIn da rota para o spender da pool
    const spender =
      typeof firstStep.poolData === "string"
        ? firstStep.poolData
        : firstStep.poolData?.router;

    if (!spender) {
      throw new Error("Spender (router) não definido no primeiro passo");
    }

    calls.push(
      buildApproveCall(
        firstStep.tokenIn,
        spender,
        (firstStep.amountIn ?? BigNumber.from(0)).toString()
      )
    );
  }

  // ----------------------------------------
  // 🔁 Execução da rota principal (swaps principais)
  // ----------------------------------------
  for (const step of route) {
    const swapCall = await buildSwapTransaction({  ...step, recipient: executor, amountOutMin: step.amountOutMin ?? BigNumber.from(0),});
    calls.push(swapCall);
  }

  // ----------------------------------------
  // 🔁 Pós-swap com token alternativo (opcional)
  // ----------------------------------------
  if (useAltToken) {
    const postSwapAmountIn = lastStep.amountOut;
    if (!postSwapAmountIn) throw new Error("amountOut não definido para o último passo");

    // Aprovação para o router do pós-swap usar o token do último passo
    calls.push(
      buildApproveCall(lastStep.tokenOut, postSwapSpender, postSwapAmountIn.toString())
    );

    // Construção do pós-swap para converter tokenOut final → flashLoanToken
    const postSwapStep: BasicSwapStep = {
      dex: postSwapDex,
      tokenIn: lastStep.tokenOut,
      tokenOut: flashLoanToken,
      amountIn: postSwapAmountIn,
      amountOutMin: flashLoanAmount.mul(1.01),
      recipient: executor,
    };
    const postSwapCall = await buildSwapTransaction(postSwapStep);
    calls.push(postSwapCall);
  }

  // ----------------------------------------
  // ✅ Retorna resultado final da orquestração
  // ----------------------------------------
  return {
    calls,
    flashLoanAmount,
    flashLoanToken,
  };
}
