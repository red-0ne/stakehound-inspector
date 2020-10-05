import { Inject, Injectable } from "injection-js";
import { providers } from "ethers";
import { interval, Observable, of, throwError } from "rxjs";
import { distinctUntilChanged, map, publish, refCount, switchMap, take, tap } from "rxjs/operators";

import { BlockNumber, Transaction } from "domain/models";
import { PollInterval } from "infra/services/config-tokens";
import { Milliseconds } from "shared/models";
import {
  InitialBlock,
  RegisteredFilterFunctions as RegFilterFns,
  FilterParams,
  TransactionSource,
} from "domain/services";

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
    return interval(this.pollInterval.value).pipe(
      switchMap(() => this.etherscanProvider.getBlockNumber()),
      distinctUntilChanged(),
      map(block => new BlockNumber(block)),
      tap(block => console.log(`>>> Latest block updated to ${block.value}`)),
      publish(),
      refCount(),
    );
  }

  protected getBlock(block: BlockNumber): Observable<Transaction[]> {
    // Calculate how much time passed between the last API request and now
    const diff = new Date().getTime() - this.lastFetch.getTime();
    const custody = this.filterParams.custody;

    return interval(diff >= this.pollInterval.value ? 0 : diff).pipe(
      take(1),
      switchMap(() => this.etherscanProvider.getHistory(custody.value, block.value, block.value)),
      switchMap((txs) => checkTransactions(txs) ? of(txs) : throwError(new Error(ERROR.MALFORMED_TRANSACTION))),
      // Update the last fetch time
      tap(() => this.lastFetch = new Date()),
    );
  }
}

function checkTransactions(_: unknown[]): _ is Transaction[] {
  return true;
}