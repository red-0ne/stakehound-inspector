import "reflect-metadata";
import "mocha";

import { expect } from "chai";
import { BehaviorSubject, interval, Observable, of } from "rxjs";
import { map, take, takeWhile } from "rxjs/operators";

import { ERROR, TransactionSource } from "./transaction-source";
import { BlockNumber, BlockTransactions, TransactionStreamConfig } from "domain/models";

const blocks = [
  [ "a", "b", "c" ],
  [ "d" ],
  [],
  [ "e", "f" ],
  [ "" ],
];

class DummyTransactionSource extends TransactionSource<string> {
  public latestBlock = new BehaviorSubject(new BlockNumber(4));

  protected initLatestBlock(): Observable<BlockNumber> {
    return interval(50).pipe(map(i => new BlockNumber(i)));
  }

  protected getBlock(block: BlockNumber): Observable<string[]> {
    return of(blocks[block.value]);
  }
}

describe("TransactionSource", () => {
  it("should start scanning from the initial block number", done => {
    const source = new DummyTransactionSource(new Set(), new BlockNumber(1));
    let result = "";

    source.block.pipe(take(1)).subscribe(
      (v) => result += v.transactions.map(tx => tx).join(''),
      (_) => _,
      () => {
        expect(result).to.equal("d");
        done();
      }
    );
  });

  it("should not emit empty blocks", done => {
    const source = new DummyTransactionSource(new Set(), new BlockNumber(2));
    let result: BlockTransactions<string>;

    source.block.pipe(take(1)).subscribe(
      (x) => result = x,
      (_) => _,
      () => {
        expect(result.block.value).to.equal(3);
        done();
      }
    );
  });

  it("should apply filters to all scanned transactions and emit only the passing ones", done => {
    const filterCfg = {
      filters: [
        { fn: x => "ade".includes(x) },
        { fn: (x, ctx: string) => ctx.includes(x), context: "e" },
      ],
      start: new BlockNumber(1),
    } as TransactionStreamConfig
    const filterFns = filterCfg.filters.map(f => f.fn);
    const source = new DummyTransactionSource(new Set(filterFns), new BlockNumber(0));

    let result = "";

    source.getTransactionStream(filterCfg).pipe(takeWhile(x => x[0] !== "")).subscribe(
      (v) => result += v,
      (_) => _,
      () => {
        expect(result).to.equal("e");
        done();
      }
    );
  });

  it("should emit an error when passed a non registered filter function", done => {
    const filterCfg = {
      filters: [
        { fn: x => "ade".includes(x) },
        { fn: (x, ctx: string) => ctx.includes(x), context: "e" },
      ],
      start: new BlockNumber(1),
    } as TransactionStreamConfig
    const filterFn = filterCfg.filters[0].fn;
    const source = new DummyTransactionSource(new Set([ filterFn ]), new BlockNumber(0));

    source.getTransactionStream(filterCfg).pipe(takeWhile(x => x[0] !== "")).subscribe(
      (_) => _,
      (error: Error) => {
        expect(error.message).to.equal(ERROR.UNKNOWN_FILTER);
        done();
      }
    );
  });

  it("should only allow scans within the initial block", done => {
    const filterCfg = { filters: [], start: new BlockNumber(0) } as TransactionStreamConfig;
    const source = new DummyTransactionSource(new Set(), new BlockNumber(2));

    source.getTransactionStream(filterCfg).pipe(take(1)).subscribe(
      (_) => _,
      (error: Error) => {
        expect(error.message).to.equal(ERROR.BLOCK_UNREACHABLE);
        done();
      }
    );
  });
});