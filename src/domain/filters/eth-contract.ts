import { Filter } from "shared/models";
import { providers } from "ethers";

import { EthAddress } from "domain/models";

export const byEthContract: Filter<providers.TransactionReceipt, EthAddress> = (
  transaction: providers.TransactionReceipt,
  contract: EthAddress
): boolean => {
  return transaction.to === contract.value;
}