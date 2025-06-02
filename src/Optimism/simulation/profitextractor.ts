import { BigNumberish, ethers } from "ethers";

type TokenTransfer = {
  from: string;
  to: string;
  token_address: string;
  raw_amount: string;
};

type SimulationResult = {
  simulation: {
    status: boolean;
    gas_used: number;
    id: string;
    transaction: {
      transaction_info: {
        token_transfers: TokenTransfer[];
      };
    };
  };
};

function addToMap(
  map: Record<string, bigint>,
  token: string,
  amount: bigint
) {
  if (!map[token]) {
    map[token] = 0n;
  }
  map[token] = map[token]! + amount;
}

export function extractProfit(
  transfers: TokenTransfer[],
  contractAddress: string,
  bribeRecipientAddresses: string[] = []
): Record<string, bigint> {
  const address = contractAddress.toLowerCase();
  const bribeRecipients = new Set(
    bribeRecipientAddresses.map((a) => a.toLowerCase())
  );

  const netProfit: Record<string, bigint> = {};

  for (const transfer of transfers) {
    const token = transfer.token_address.toLowerCase();
    const from = transfer.from.toLowerCase();
    const to = transfer.to.toLowerCase();
    const value = ethers.toBigInt(transfer.raw_amount);

    // 1. Valor recebido pelo contrato executor → conta como lucro
    if (to === address) {
      addToMap(netProfit, token, value);
    }

    // 2. Valor saindo do contrato para outro destino
    if (from === address) {
      // Se foi um bribe (pagamento ao minerador), ignoramos
      if (!bribeRecipients.has(to)) {
        addToMap(netProfit, token, -value);
      }
    }
  }

  // Remove tokens com lucro zero ou negativo
  for (const [token, amount] of Object.entries(netProfit)) {
    if (amount <= 0n) {
      delete netProfit[token];
    }
  }

  return netProfit;
}
