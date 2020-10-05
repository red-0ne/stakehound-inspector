import "reflect-metadata";
import { merge, Subscription } from "rxjs";
import { ReflectiveInjector } from "injection-js";

import { EthAddress, BlockNumber } from "domain/models";
import { Milliseconds } from "shared/models";
import { MintLogger, SendLogger } from "domain/services";
import { configureProviders, StakeHoundInspectorConfig, DefaultProviders } from "index";
import { normalize } from "path";

/**
 * @description Encapsulates the command line logic so this can be tested
 */
export function start(): Subscription {
  const defaultInterval = 3000;
  const defaultInitialBlock = 1618080;

  const cliConfig: StakeHoundInspectorConfig = {
    filterParams: {
      custody: new EthAddress(process.argv[2]),
      sender: new EthAddress(process.argv[3]),
    },
    basePath: normalize(`${__dirname}/../data/`),
    initialBlock: new BlockNumber(process.argv[4] || defaultInitialBlock),
    pollInterval: new Milliseconds(process.argv[5] || defaultInterval),
  };

  const providers = configureProviders(DefaultProviders, cliConfig);
  const injector = ReflectiveInjector.resolveAndCreate(providers);
  const logs = [ MintLogger, SendLogger ].map(s => (injector.get(s)).transaction);

  return merge(...logs).subscribe();
}

start();