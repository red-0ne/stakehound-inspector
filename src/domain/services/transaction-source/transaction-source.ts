import { BehaviorSubject, Observable, throwError } from "rxjs";
import { concatMap, exhaustMap, filter, map, retryWhen, shareReplay, takeWhile, tap } from "rxjs/operators";

import { BlockNumber, TransactionStreamConfig, BlockTransactions } from "domain/models";
import { Filter } from "shared/models/filter";
import { Inject, Injectable } from "injection-js";
import { InitialBlock, RegisteredFilterFunctions } from "domain/services/config-tokens";
import { exponentialBackOffRetryStrategy } from "shared/lib/exponential-back-off-retry-strategy";
import { Milliseconds } from "shared/models";

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

    return this.latestBlock.pipe(
      // Ignore new blocks until the next block to process reaches the latest block
      // We then get the new latest block to repeat the process
      exhaustMap(latest => nextBlockController.pipe(
        // Delay block retrieval until it is no longer ahead of the latest block
        takeWhile((next) => next.value <= latest.value),
        // Execute the block retrieval logic implemented by the subclass. It is up to the subclass
        // to cache the retrieved blocks so it has not to scan again the chain on the next run
        concatMap(next => this.getBlock(next).pipe(
          retryWhen(exponentialBackOffRetryStrategy(5, new Milliseconds(3000))),
          map(transactions => ({ block: next, transactions })),
          // Trigger the retrieval of the next block on the next tick
          tap(({ block }) => nextBlockController.next(new BlockNumber(block.value + 1))),
          tap(({ block }) => console.log(`[latest: ${latest.value}] Block ${block.value} fetched!`)),
        )),
      )),
      // Do not execute the above operators on every new subscription. Store (in-memory) the blocks
      // and give them back for new subscriptions.
      shareReplay(),
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