import { Filter } from "shared/models";

import { EthAddress, Transaction } from "domain/models";

export const byEthContract: Filter<Transaction, EthAddress> = (
  transaction: Transaction,
  contract: EthAddress
): boolean => {
  return transaction.to === contract.value;
}