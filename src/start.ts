import "reflect-metadata";
import { merge, Subscription } from "rxjs";
import { ReflectiveInjector } from "injection-js";

import { EthAddress, BlockNumber } from "domain/models";
import { Milliseconds } from "shared/models";
import { MintLogger } from "domain/services";
import { configureProviders, StakeHoundInspectorConfig, DefaultProviders } from "index";
import { normalize } from "path";

export function start(): Subscription {
  const defaultInterval = 2500;
  const defaultInitialBlock = 1618084;

  const cliConfig: StakeHoundInspectorConfig = {
    filterParams: {
      custody: new EthAddress('0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae'),//process.argv[2]),
      sender: new EthAddress('0xd01d94ffa4a2a2e77ed7b1554e3a9cae21239b80'),//process.argv[3]),
    },
    basePath: normalize(`${__dirname}/../data/`),
    initialBlockNumber: new BlockNumber(process.argv[3] || defaultInitialBlock),
    pollInterval: new Milliseconds(process.argv[4] || defaultInterval),
  };

  const providers = configureProviders(DefaultProviders, cliConfig);
  const injector = ReflectiveInjector.resolveAndCreate(providers);
  const logs = [ MintLogger ].map(s => (injector.get(s)).transaction);

  return merge(logs).subscribe();
}

start();