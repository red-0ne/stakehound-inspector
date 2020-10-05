import { Filter } from "shared/models";

import { EthAddress, Transaction } from "domain/models";

export const byEthSender: Filter<Transaction, EthAddress> = (
  transaction: Transaction,
  sender: EthAddress
): boolean => {
  return transaction.from === sender.value;
}