import { Inject, Injectable } from "injection-js";

import { Logger } from "shared/lib/logger";
import { FilterParams, } from "domain/services/config-tokens";
import { StateStore } from "domain/services/state-store";
import { TransactionSource } from "domain/services/transaction-source/transaction-source";
import { Transaction } from "domain/models";

/**
 * @description Logs the mint operations
 */
@Injectable()
export class MintLogger extends Logger<Transaction> {
  constructor(
    protected readonly store: StateStore<Transaction>,
    protected readonly transactionSource: TransactionSource<Transaction>,
    @Inject(FilterParams) protected readonly filterParams: FilterParams,
  ) {
    super(store, transactionSource, filterParams, "MINT");
  }
}