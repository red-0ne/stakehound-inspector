import * as fs from "fs";
import { Inject, Injectable } from "injection-js";

import { ActionKind, BlockNumber, Transaction } from "domain/models";
import { BasePath, InitialBlockNumber } from "domain/services";
import { StateStore } from "domain/services";

@Injectable()
export class FilesystemStateStore extends StateStore<Transaction> {
  constructor(
    @Inject(BasePath) public readonly basePath: string,
    @Inject(InitialBlockNumber) protected readonly initialBlockNumber: BlockNumber,
  ) {
    super(initialBlockNumber);
  }

  public getLastProcessedBlock(kind: ActionKind): Promise<BlockNumber> {
    const path = `${this.basePath}${kind}_PROGRESS.TXT`;
    const options = { encoding: "utf8", flag: "a+" } as const;
    return fs.promises.readFile(path, options)
      .then(r => r.length ? new BlockNumber(r) : new BlockNumber(this.initialBlockNumber.value - 1));
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
    const data = transactions.map(tx => `${kind} ${tx.value} ${tx[type]}`).join("\n") + "\n";

    return fs.promises.writeFile(path, data, options);
  }

}