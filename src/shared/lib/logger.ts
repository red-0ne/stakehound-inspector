import { from, Observable } from "rxjs";
import { switchMap } from "rxjs/operators";
import { BigNumber, providers } from "ethers";

import { byEthSender } from "domain/filters";
import { ActionKind, BlockNumber, EthAddress, FilterConfig } from "domain/models";
import { FilterParams, StateStore, TransactionSource } from "domain/services";
import { Injectable } from "injection-js";

type R = providers.TransactionReceipt & { value: BigNumber };
type T = providers.TransactionResponse;

@Injectable()
export abstract class Logger {
  public readonly transaction: Observable<R[]>;
  public readonly buffer = new Map<number, Map<string, R>>();

  constructor(
    protected readonly store: StateStore,
    protected readonly transactionSource: TransactionSource<R, T>,
    protected readonly filterParams: FilterParams,
    protected readonly actionKind: ActionKind
  ) {

    const filters: FilterConfig<R, EthAddress>[] = [
      { fn: byEthSender, context: this.filterParams.sender }
    ];

    this.transaction = from(this.store.getLastProcessedBlock(actionKind)).pipe(
      switchMap(last => {
        const cfg = { start: new BlockNumber(last.value + 1), filters };

        return this.transactionSource.getTransactionStream(cfg).pipe(
          switchMap(txs => this.store.saveTransactions<R>(this.actionKind, txs).then(() => txs)),
          switchMap(txs => this.store.updateCurrentBlock(this.actionKind, last).then(() => txs)),
        );
      })
    );
  }
}