import { Filter } from "shared/models";
import { BlockNumber } from "domain/models";

export interface FilterConfig<T, CTX> {
  fn: Filter<T, CTX>;
  context?: CTX;
}

/**
 * @description Shape of the config passed to the `getTransactionStream` observable factory
 *
 * @template T generic type representing a transaction
 */
export interface TransactionStreamConfig {
  /**
   * @description Set of filters with their attached params that will be used to filter transactions
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filters: FilterConfig<any, any>[];

  /**
   * @description The block to start scanning from. It may not be lesser than the `InitialBlock`
   */
  start: BlockNumber;
}