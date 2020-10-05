import { Inject, Injectable } from "injection-js";

import { ActionKind, BlockNumber } from "domain/models";
import { InitialBlockNumber } from "./config-tokens";

@Injectable()
export abstract class StateStore<T> {
  constructor(
    @Inject(InitialBlockNumber) protected readonly initialBlockNumber: BlockNumber,
  ) {}

  public abstract getLastProcessedBlock(kind: ActionKind): Promise<BlockNumber>;
  public abstract saveTransactions(kind: ActionKind, transactions: T[]): Promise<void>;
  public abstract updateCurrentBlock(kind: ActionKind, block: BlockNumber): Promise<void>;
}