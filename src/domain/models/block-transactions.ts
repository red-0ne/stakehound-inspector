import { BlockNumber } from "domain/models";

export interface BlockTransactions<T> {
  block: BlockNumber;
  transactions: T[];
}