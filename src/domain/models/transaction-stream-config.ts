import { Filter } from "shared/models";
import { BlockNumber } from "domain/models";

export interface FilterConfig<T, CTX> {
  fn: Filter<T, CTX>;
  context?: CTX;
}

/**
 * Shape of the config passed to the `getTransactionStream` observable factory
 *
 * @template T generic type representing a transaction
 */
export interface TransactionStreamConfig<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filters: FilterConfig<T, any>[];
  start: BlockNumber;
}