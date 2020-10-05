import { Transaction } from "ethers";
import { Inject, Injectable } from "injection-js";

import { Logger } from "shared/lib/logger";
import { FilterParams, } from "domain/services/config-tokens";
import { StateStore } from "domain/services/state-store";
import { TransactionSource } from "domain/services/transaction-source/transaction-source";

/**
 * @description Logs the send operations
 */
@Injectable()
export class SendLogger extends Logger<Transaction> {
  constructor(
    protected readonly store: StateStore<Transaction>,
    protected readonly transactionSource: TransactionSource<Transaction>,
    @Inject(FilterParams) protected readonly filterParams: FilterParams,
  ) {
    super(store, transactionSource, filterParams, "SEND");
  }
}