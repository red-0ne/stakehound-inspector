import { Injectable } from "injection-js";

import { ActionKind, BlockNumber } from "domain/models";

/**
 * @description Abstract class that represent storage and retrieval service for the last processed
 * block and the logged transactions.
 */
@Injectable()
export abstract class StateStore<T> {
  public abstract getLastProcessedBlock(kind: ActionKind): Promise<BlockNumber>;
  public abstract saveTransactions(kind: ActionKind, transactions: T[]): Promise<void>;
  public abstract updateCurrentBlock(kind: ActionKind, block: BlockNumber): Promise<void>;
}