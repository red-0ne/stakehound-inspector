import * as fs from "fs";
import { Inject, Injectable } from "injection-js";

import { ActionKind, BlockNumber, Transaction } from "domain/models";
import { BasePath, InitialBlock } from "domain/services";
import { StateStore } from "domain/services";

/**
 * @description: Filesystem wise implementation of the `StateStore`.
 */
@Injectable()
export class FilesystemStateStore extends StateStore<Transaction> {
  constructor(
    @Inject(BasePath) public readonly basePath: string,
    @Inject(InitialBlock) protected readonly initialBlock: BlockNumber,
  ) {
    super();
  }

  public getLastProcessedBlock(kind: ActionKind): Promise<BlockNumber> {
    const path = `${this.basePath}${kind}_PROGRESS.TXT`;
    const options = { encoding: "utf8", flag: "a+" } as const;
    return fs.promises.readFile(path, options)
      .then(r => r.length ? new BlockNumber(r) : new BlockNumber(this.initialBlock.value - 1));
  }

  public updateCurrentBlock(kind: ActionKind, block: BlockNumber): Promise<void> {
    const path = `${this.basePath}${kind}_PROGRESS.TXT`;
    const options = { encoding: "utf8", flag: "w" } as const;
    return fs.promises.writeFile(path, block.value.toString(), options);
  }

  public saveTransactions(kind: ActionKind, transactions: Transaction[]): Promise<void> {
    const path = `${this.basePath}${kind}.TXT`;
    const options = { encoding: "utf8", flag: "a+" } as const;
    const type = kind === "SEND" ? "to" : "from";
    const data = transactions.map(tx => `${kind} ${tx.value} ${tx[type]} ${tx.hash}`).join("\n") + "\n";
    console.log(`Saving ${transactions.length} ${kind} transactions`);

    return fs.promises.writeFile(path, data, options);
  }

}