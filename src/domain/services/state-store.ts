import { BigNumber, providers } from "ethers";
import { Injectable } from "injection-js";

import { ActionKind, BlockNumber } from "domain/models";

type R = providers.TransactionReceipt & { value: BigNumber };

@Injectable()
export abstract class StateStore {
  public abstract getLastProcessedBlock(kind: ActionKind): Promise<BlockNumber>;
  public abstract saveTransactions<T extends R>(kind: ActionKind, transactions: T[]): Promise<void>;
  public abstract updateCurrentBlock(kind: ActionKind, block: BlockNumber): Promise<void>;
}