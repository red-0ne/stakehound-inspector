import { BehaviorSubject, combineLatest, Observable, throwError, timer } from "rxjs";
import { delayWhen, filter, map, publishReplay, refCount, retryWhen, switchMap,
  tap, } from "rxjs/operators";

import { BlockNumber, TransactionStreamConfig, BlockTransactions } from "domain/models";
import { Filter } from "shared/models/filter";
import { Inject, Injectable } from "injection-js";
import { InitialBlock, RegisteredFilterFunctions } from "domain/services/config-tokens";
import { exponentialBackOffRetryStrategy } from "shared/lib/exponential-back-off-retry-strategy";

export const enum ERROR {
  UNKNOWN_FILTER = "UNKNOWN_FILTER",
  BLOCK_UNREACHABLE = "BLOCK_UNREACHABLE",
}

/**
 * @description This service serves as a base class to implement transaction source services.
 * @template T Generic type representing the shape of the handled transaction
 */
@Injectable()
export abstract class TransactionSource<T> {
  /**
   * @description Observable emitting scanned blocks transactions. At boot time, it may emit
   * old blocks starting from the provided `InitialBlockNumber`.
   */
  public abstract readonly block: Observable<BlockTransactions<T>>;

  /**
   * @description Observable representing the latest blockchain block. It will emit each time there
   * is a new one. It is up to the superclass to provide an observable blueprint as it may be done
   * through sockets or poll interval.
   */
  public abstract readonly latestBlock: Observable<BlockNumber>;

  constructor(
    /**
     * @description Set of the authorized filter functions.
     */
    @Inject(RegisteredFilterFunctions) protected readonly filterFunctions: Set<Filter<T, unknown>>,

    /**
     * @description Block number to start scanning from.
     */
    @Inject(InitialBlock) protected readonly initialBlock: BlockNumber,
  ) {
  }

  /**
   * @description Creates an observable that emits transactions of the blocks starting from `start`
   * until it reaches the latest block then continues on each new block and applies the passed
   * filters to each transaction.
   */
  public getTransactionStream({ filters, start }: TransactionStreamConfig): Observable<BlockTransactions<T>> {
    // If any of the filters passed is not registered then throw `UNKNOWN_FILTER`
    if (!filters.every(f => this.filterFunctions.has(f.fn))) {
      return throwError(new Error(ERROR.UNKNOWN_FILTER));
    }

    // We cannot get blocks earlier than the initial block since they will not be scanned
    if (start.value < this.initialBlock.value) {
      return throwError(new Error(ERROR.BLOCK_UNREACHABLE));
    }

    return this.block.pipe(
      // Do not replay the scanned blocks that are not required by this call, filter them out from the stream
      filter(blockTransactions => blockTransactions.block.value >= start.value),
      map(({ transactions, block }) => ({
        // Apply all the filters to all the block's transactions. Any transaction has to pass all the filters
        transactions: transactions.filter(tx => filters.every(f => f.fn(tx, f.context))),
        block,
      })),
    );
  }

  /**
   * @description Creates a scanned blocks observable that fetches one block at the time. It also
   * has retry logic with exponential back-off delays.
   *
   * @param start The initial block from where this method starts scanning the blockchain from
   */
  protected buildBlockStream(start: BlockNumber): Observable<BlockTransactions<T>> {
    // Declare a next block controller that signals when to fetch the next block
    // It has an initial emission of start block number
    const nextBlockController = new BehaviorSubject<BlockNumber>(start);

    return combineLatest([nextBlockController, this.latestBlock]).pipe(
      // Do not execute the above operators on every new subscription. Store (in-memory) the blocks
      // and give them back for new subscriptions.
      publishReplay(),

      // Stop scanning the chain if there is no subscriber
      refCount(),
      // Delay block retrieval until until it is no longer ahead of the latest block
      filter(([next, latest]) => next.value <= latest.value),
      // Execute the block retrieval logic implemented by the subclass. It is up to the subclass
      // to cache the retrieved blocks so it has not to scan again the chain on the next run
      switchMap(([next, latest]) => this.getBlock(next).pipe(
        // Retry logic
        retryWhen(errors => errors.pipe(
          // Wait longer exponentially each time there is an error with a maximum of 5 retries
          // and a starting from 3 seconds
          delayWhen((error, attempt) => attempt < 5
            ? timer((Math.pow(2, attempt) * 1000) + 2000)
            : throwError(error)
          ),
        )),
        tap(() => console.log(`[latest: ${latest.value}] Block ${next.value} fetched`)),
        // Trigger the retrieval of the next block on the next tick
        tap(() => setTimeout(() => nextBlockController.next(new BlockNumber(next.value + 1)))),
        // Send the transactions array and their corresponding block number
        map(transactions => ({ block: next, transactions })),
      )),
    );
  }

  /**
   * @description This is where the specialized subclass has to implement the logic of block retrieval
   *
   * @param block The block number of the block that we want to fetch
   */
  protected abstract getBlock(block: BlockNumber): Observable<T[]>;

  /**
   * @description Abstract class that enforces implementation of the new block notification logic
   */
  protected abstract initLatestBlock(): Observable<BlockNumber>;
}