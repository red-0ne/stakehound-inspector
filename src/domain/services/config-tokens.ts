import { InjectionToken } from "injection-js";

import { Filter } from "shared/models";
import { BlockNumber, EthAddress } from "domain/models";

/**
 * Token injected into TransactionSource to store the filtering function set. This lets us
 * control (at boot time) the functions that are allowed to filter the transactions stream.
 */
export type RegisteredFilterFunctions<T> = Set<Filter<T, unknown>>;
export const RegisteredFilterFunctions = new InjectionToken<RegisteredFilterFunctions<unknown>>("RegisteredFilterFunctions");

/**
 * Injection token used to configure the minimum block number from where we start scanning
 * the blockchain.
 */
export const InitialBlockNumber = new InjectionToken<BlockNumber>("InitialBlockNumber");

/**
 * Token used to configure the base path where files will be stored to
 */
export const BasePath = new InjectionToken<string>("BasePath");

/**
 * Injection token to pass global filtering configuration.
 */
export interface FilterParams { custody: EthAddress,
  sender: EthAddress,
}
export const FilterParams = new InjectionToken<FilterParams>("FilterParams");