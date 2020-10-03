import { BlockNumber } from "domain/models";
import { BigNumber } from "ethers";

export interface BlockTransactions<T> {
  block: BlockNumber;
  transactions: T[];
}

export type WaitTx<R> = {
  value: BigNumber,
  wait: (confirmations?: number) => Promise<R>
};