import { Filter } from "shared/models";
import { providers } from "ethers";

import { EthAddress } from "domain/models";

export const byEthSender: Filter<providers.TransactionReceipt, EthAddress> = (
  transaction: providers.TransactionReceipt,
  sender: EthAddress
): boolean => {
  return transaction.from === sender.value;
}