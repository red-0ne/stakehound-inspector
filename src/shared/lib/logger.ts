import { from, Observable, of } from "rxjs";
import { concatMap, switchMap } from "rxjs/operators";

import { byEthSender } from "domain/filters";
import { ActionKind, BlockNumber, EthAddress, FilterConfig, Transaction } from "domain/models";
import { FilterParams, StateStore, TransactionSource } from "domain/services";
import { Injectable } from "injection-js";

@Injectable()
export abstract class Logger<T = Transaction> {
  public readonly transaction: Observable<T[]>;

  constructor(
    protected readonly store: StateStore<T>,
    protected readonly transactionSource: TransactionSource<T>,
    protected readonly filterParams: FilterParams,
    protected readonly actionKind: ActionKind
  ) {

    const filters: FilterConfig<Transaction, EthAddress>[] = [
      { fn: byEthSender, context: this.filterParams.sender }
    ];

    this.transaction = from(this.store.getLastProcessedBlock(actionKind)).pipe(switchMap(last => {
      const next = new BlockNumber(last.value + 1);
      const cfg = { start: next, filters };

      return this.transactionSource.getTransactionStream(cfg).pipe(
        concatMap(txs => txs.transactions.length
          ? this.store.saveTransactions(this.actionKind, txs.transactions).then(() => txs)
          : of(txs)),
        concatMap(txs => this.store.updateCurrentBlock(this.actionKind, txs.block)
          .then(() => txs.transactions)),
      );
    }));
  }
}