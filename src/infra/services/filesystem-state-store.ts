import * as fs from "fs";
import { BigNumber, providers } from "ethers";
import { Inject, Injectable } from "injection-js";

import { ActionKind, BlockNumber } from "domain/models";
import { BasePath } from "domain/services";
import { StateStore } from "domain/services";

type R = providers.TransactionReceipt & { value: BigNumber };

@Injectable()
export class FilesystemStateStore extends StateStore {
  constructor(@Inject(BasePath) public readonly basePath: string) {
    super();
  }

  public getLastProcessedBlock(kind: ActionKind): Promise<BlockNumber> {
    const path = `${this.basePath}/${kind}_PROGRESS.TXT`;
    const options = { encoding: "utf8", flags: "r+" } as const;
    return fs.promises.readFile(path, options).then(result => new BlockNumber(result));
  }

  public updateCurrentBlock(kind: ActionKind, block: BlockNumber): Promise<void> {
    const path = `${this.basePath}/${kind}_PROGRESS.TXT`;
    const options = { encoding: "utf8", flags: "w+" } as const;
    return fs.promises.writeFile(path, block.value.toString(), options);
  }

  public saveTransactions<T extends R>(kind: ActionKind, transactions: T[]): Promise<void> {
    const path = `${this.basePath}/${kind}.TXT`;
    const options = { encoding: "utf8", flags: "a+" } as const;
    const data = transactions.map(({ to, from, value }) => ({ to, from, value })).join("\n");

    return fs.promises.writeFile(path, data, options);
  }

}