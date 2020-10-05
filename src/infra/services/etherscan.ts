import { Inject, Injectable } from "injection-js";
import { providers } from "ethers";
import { Observable, of, throwError, timer } from "rxjs";
import { map, switchMap, take, tap } from "rxjs/operators";

import { BlockNumber, Transaction } from "domain/models";
import { PollInterval } from "infra/services/config-tokens";
import { Milliseconds } from "shared/models";
import {
  InitialBlockNumber,
  RegisteredFilterFunctions as RegFilterFns,
  FilterParams,
  TransactionSource,
} from "domain/services";

export const enum ERROR {
  MALFORMED_TRANSACTION = "MALFORMED_TRANSACTION",
}

@Injectable()
export class Etherscan extends TransactionSource<Transaction> {
  protected readonly etherscanProvider = new providers.EtherscanProvider("ropsten");
  protected lastFetch = new Date(0);
  public readonly latestBlock = this.initLatestBlock();

  constructor(
    @Inject(RegFilterFns) protected readonly filterFunctions: RegFilterFns<Transaction>,
    @Inject(FilterParams) protected readonly filterParams: FilterParams,
    @Inject(InitialBlockNumber) protected readonly initialBlockNumber: BlockNumber,
    @Inject(PollInterval) protected readonly pollInterval: Milliseconds,
  ) {
    super(filterFunctions, initialBlockNumber);
  }

  protected initLatestBlock(): Observable<BlockNumber> {
    return timer(this.pollInterval.value).pipe(
      switchMap(() => this.etherscanProvider.getBlockNumber()),
      map(blockNumber => new BlockNumber(blockNumber)),
    )
  }

  protected getBlock(block: BlockNumber): Observable<Transaction[]> {
    const diff = new Date().getTime() - this.lastFetch.getTime();
    const custody = this.filterParams.custody;

    return timer(diff >= this.pollInterval.value ? 0 : diff).pipe(
      take(1),
      switchMap(() => this.etherscanProvider.getHistory(custody.value, block.value, block.value)),
      switchMap((txs) => checkTransactions(txs) ? of(txs) : throwError(new Error(ERROR.MALFORMED_TRANSACTION))),
      tap(() => this.lastFetch = new Date()),
    );
  }
}

function checkTransactions(_: unknown[]): _ is Transaction[] {
  return true;
}