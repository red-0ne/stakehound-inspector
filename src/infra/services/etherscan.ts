import { Inject, Injectable } from "injection-js";
import { BigNumber, providers } from "ethers";
import { Observable, timer } from "rxjs";
import { map, switchMap, take, tap } from "rxjs/operators";

import { BlockNumber } from "domain/models";
import { PollInterval } from "infra/services/config-tokens";
import { Milliseconds } from "shared/models";
import {
  InitialBlockNumber,
  RegisteredFilterFunctions as RegFilterFns,
  FilterParams,
  TransactionSource,
} from "domain/services";

type TransactionReceipt = providers.TransactionReceipt & { value: BigNumber };
type TransactionResponse = providers.TransactionResponse & { value: BigNumber };

export const enum ERROR {
  MALFORMED_TRANSACTION = "MALFORMED_TRANSACTION",
}

@Injectable()
export class Etherscan extends TransactionSource<TransactionReceipt, TransactionResponse> {
  protected readonly etherscanProvider = new providers.EtherscanProvider("ropsten");
  protected lastFetch = new Date(0);

  constructor(
    @Inject(RegFilterFns) protected readonly filterFunctions: RegFilterFns<TransactionReceipt>,
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

  protected getBlock(block: BlockNumber): Observable<providers.TransactionResponse[]> {
    const diff = new Date().getTime() - this.lastFetch.getTime();
    const custody = this.filterParams.custody;

    return timer(diff >= this.pollInterval.value ? 0 : diff).pipe(
      take(1),
      switchMap(() => this.etherscanProvider.getHistory(custody.value, block.value, block.value)),
      tap(() => this.lastFetch = new Date()),
      tap((x) => x.map(y => y)),
    );
  }
}