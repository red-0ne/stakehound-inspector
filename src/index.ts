import "reflect-metadata";
import { Provider } from "injection-js";

import { BlockNumber } from "domain/models";
import { byEthContract, byEthSender } from "domain/filters";
import { Milliseconds } from "shared/models";
import { Etherscan, FilesystemStateStore, PollInterval } from "infra/services";
import {
  TransactionSource,
  StateStore,
  MintLogger,
  SendLogger,
  FilterParams,
  InitialBlockNumber,
  RegisteredFilterFunctions,
  BasePath,
} from "domain/services";

export interface StakeHoundInspectorConfig {
  filterParams: FilterParams;
  pollInterval: Milliseconds;
  initialBlockNumber: BlockNumber;
  basePath: string;
}

export const DefaultProviders = [
  { provide: TransactionSource, useClass: Etherscan },
  { provide: MintLogger, useClass: MintLogger },
  { provide: SendLogger, useClass: SendLogger },
  { provide: StateStore, useClass: FilesystemStateStore },
  { provide: RegisteredFilterFunctions, useValue: new Set([ byEthSender, byEthContract ]) },
];

/**
 * Builds a Provider directives array based on a default one and a config object. The returned
 * provider array may be modified before performing the resolving and creation of the injector.
 *
 * @param defaultProviders List of default providers for the domain services.
 * @param config Boot-time configuration to fine tune the services behavior.
 */
export function configureProviders(
  defaultProviders: Provider[],
  config: StakeHoundInspectorConfig
): Provider[] {

  return [
    ...defaultProviders,
    { provide: FilterParams, useValue: config.filterParams },
    { provide: PollInterval, useValue: config.pollInterval },
    { provide: InitialBlockNumber, useValue: config.initialBlockNumber },
    { provide: BasePath, useValue: config.basePath },
  ];
}