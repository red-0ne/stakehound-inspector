import { BehaviorSubject, Observable, throwError, timer } from "rxjs";
import {
  concatMap,
  delayWhen,
  filter,
  map,
  publishReplay,
  refCount,
  retryWhen,
  switchMap,
  take,
  tap,
} from "rxjs/operators";

import { BlockNumber, TransactionStreamConfig, BlockTransactions } from "domain/models";
import { Filter } from "shared/models/filter";
import { providers } from "ethers";
import { Inject, Injectable } from "injection-js";
import { InitialBlockNumber, RegisteredFilterFunctions } from "domain/services/config-tokens";

export const enum ERROR {
  UNKNOWN_FILTER = "UNKNOWN_FILTER",
  BLOCK_UNREACHABLE = "BLOCK_UNREACHABLE",
}

@Injectable()
export abstract class TransactionSource<R, T = providers.TransactionResponse> {
  public readonly block = this.buildBlockStream(this.initialBlockNumber);
  public readonly latestBlock = this.initLatestBlock();

  constructor(
    @Inject(RegisteredFilterFunctions) protected readonly filterFunctions: Set<Filter<R, unknown>>,
    @Inject(InitialBlockNumber) protected readonly initialBlockNumber: BlockNumber,
  ) {
  }

  public getTransactionStream({ filters, start }: TransactionStreamConfig<R>): Observable<R[]> {
    if (!filters.every((f) => this.filterFunctions.has(f.fn))) {
      return throwError(new Error(ERROR.UNKNOWN_FILTER));
    }

    if (start.value < this.initialBlockNumber.value) {
      return throwError(new Error(ERROR.BLOCK_UNREACHABLE));
    }

    return this.block.pipe(
      filter(blockTransactions => blockTransactions.block.value >= start.value),
      filter(({ transactions }) => transactions.length !== 0),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      concatMap(({ transactions }) => Promise.all(transactions.map((tx: any) => tx.wait()))),
      map(transactions => transactions.filter(tx => filters.every(f => f.fn(tx, f.context)))),
      filter(txs => txs.length !== 0),
    );
  }

  protected buildBlockStream(start: BlockNumber): Observable<BlockTransactions<T>> {
    const nextBlockController = new BehaviorSubject<BlockNumber>(start);

    return nextBlockController.pipe(
      delayWhen(next => this.latestBlock.pipe(
        filter(latestBlock => next.value <= latestBlock.value),
        take(1),
      )),
      switchMap(next => this.getBlock(next).pipe(
        retryWhen(errors => errors.pipe(
          delayWhen((error, attempt) => attempt < 5
            ? timer((Math.pow(2, attempt) * 1000) + 2000)
            : throwError(error)
          ),
        )),
        tap(() => setTimeout(() => nextBlockController.next(new BlockNumber(next.value + 1)))),
        map(transactions => ({ block: next, transactions })),
      )),
      filter(({ transactions }) => transactions.length !== 0),
      publishReplay(),
      refCount(),
    );
  }

  protected abstract getBlock(block: BlockNumber): Observable<T[]>;
  protected abstract initLatestBlock(): Observable<BlockNumber>;
}