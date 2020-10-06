import { Inject, Injectable } from "injection-js";
import { providers } from "ethers";
import { interval, Observable, of, throwError } from "rxjs";
import { distinctUntilChanged, exhaustMap, map, publishReplay, refCount, retryWhen, switchMap,
  take, tap, timeout } from "rxjs/operators";

import { BlockNumber, Transaction } from "domain/models";
import { PollInterval } from "infra/services/config-tokens";
import { Milliseconds } from "shared/models";
import {
  InitialBlock,
  RegisteredFilterFunctions as RegFilterFns,
  FilterParams,
  TransactionSource,
} from "domain/services";
import { exponentialBackOffRetryStrategy } from "shared/lib";

export const enum ERROR {
  MALFORMED_TRANSACTION = "MALFORMED_TRANSACTION",
}

/**
 * @description Handles transactions retrieval from the etherscan API service
 */
@Injectable()
export class Etherscan extends TransactionSource<Transaction> {
  protected readonly etherscanProvider = new providers.EtherscanProvider("ropsten");
  protected lastFetch = new Date(0);
  public readonly latestBlock = this.initLatestBlock();
  public readonly block = this.buildBlockStream(this.initialBlock);

  constructor(
    @Inject(RegFilterFns) protected readonly filterFunctions: RegFilterFns<Transaction>,
    @Inject(FilterParams) protected readonly filterParams: FilterParams,
    @Inject(InitialBlock) protected readonly initialBlock: BlockNumber,
    @Inject(PollInterval) protected readonly pollInterval: Milliseconds,
  ) {
    super(filterFunctions, initialBlock);
  }

  protected initLatestBlock(): Observable<BlockNumber> {
    // Since etherscan does not support sockets and push notifications, we go the polling way
    // As long as there is at least one subscriber to this observable, emit ticks every pollInterval
    return interval(this.pollInterval.value).pipe(
      // We use exhaustMap here, so that if a next tick arrives but the previous request has not
      // finished executing yet then we ignore the tick giving a chance to the request to finish
      exhaustMap(() => this.etherscanProvider.getBlockNumber()),
      // We give the request twice the pollInterval value for it to finish
      timeout(this.pollInterval.value * 2),
      // Only emit when there is a different block
      distinctUntilChanged(),
      // Sanitize external data
      map(block => new BlockNumber(block - 12)),
      tap(block => console.log(`>>> Latest block updated to ${block.value}`)),
      publishReplay(1),
      refCount(),
    );
  }

  protected getBlock(block: BlockNumber): Observable<Transaction[]> {
    // Calculate how much time passed between the last API request and now
    const diff = new Date().getTime() - this.lastFetch.getTime();
    const custody = this.filterParams.custody;

    return interval(diff >= this.pollInterval.value ? 0 : diff).pipe(
      take(1),
      exhaustMap(() => this.etherscanProvider.getHistory(custody.value, block.value, block.value)),
      timeout(this.pollInterval.value * 2),
      retryWhen(exponentialBackOffRetryStrategy(5, new Milliseconds(3000))),
      switchMap((txs) => checkTransactions(txs) ? of(txs) : throwError(new Error(ERROR.MALFORMED_TRANSACTION))),
      // Update the last fetch time
      tap(() => this.lastFetch = new Date()),
    );
  }
}

// Ugly hack to return a transaction array :'( there should be validation here
// We should have a Transaction ValueObject and map the unknownTransactions to ours
function checkTransactions(_: unknown[]): _ is Transaction[] {
  return true;
}