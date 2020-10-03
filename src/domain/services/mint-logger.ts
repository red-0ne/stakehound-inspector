import { BigNumber, providers } from "ethers";
import { Inject, Injectable } from "injection-js";

import { Logger } from "shared/lib/logger";
import { FilterParams, } from "domain/services/config-tokens";
import { StateStore } from "domain/services/state-store";
import { TransactionSource } from "domain/services/transaction-source/transaction-source";

type R = providers.TransactionReceipt & { value: BigNumber };
type T = providers.TransactionResponse;

@Injectable()
export class MintLogger extends Logger {
  constructor(
    protected readonly store: StateStore,
    protected readonly transactionSource: TransactionSource<R, T>,
    @Inject(FilterParams) protected readonly filterParams: FilterParams,
  ) {
    super(store, transactionSource, filterParams, "MINT");
  }
}