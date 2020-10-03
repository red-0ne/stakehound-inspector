import "mocha";

import { expect } from "chai";
import { interval, Observable, of } from "rxjs";
import { map, take, takeWhile } from "rxjs/operators";

import { ERROR, TransactionSource } from "./transaction-source";
import { BlockNumber, BlockTransactions, TransactionStreamConfig, WaitTx as WTX } from "domain/models";
import { BigNumber } from "ethers";

function addWaitFn(i: string) {
  return { val: i, wait: () => Promise.resolve(i), value: BigNumber.from("1") };
}

type WaitTx = WTX<string> & { val: string };

const blocks = [
  [ "a", "b", "c" ].map(addWaitFn),
  [ "d" ].map(addWaitFn),
  [].map(addWaitFn),
  [ "e", "f" ].map(addWaitFn),
  [ "" ].map(addWaitFn),
];

class DummyTransactionSource extends TransactionSource<string, WaitTx> {
  protected initLatestBlock(): Observable<BlockNumber> {
    return interval(50).pipe(map(i => new BlockNumber(i)));
  }

  protected getBlock(block: BlockNumber): Observable<WaitTx[]> {
    return of(blocks[block.value]);
  }
}

describe("TransactionSource", () => {
  it("should start scanning from the initial block number", done => {
    const source = new DummyTransactionSource(new Set(), new BlockNumber(1));
    let result = "";

    source.block.pipe(take(1)).subscribe(
      (v) => result += v.transactions.map(tx => tx.val).join(''),
      (_) => _,
      () => {
        expect(result).to.equal("d");
        done();
      }
    );
  });

  it("should not emit empty blocks", done => {
    const source = new DummyTransactionSource(new Set(), new BlockNumber(2));
    let result: BlockTransactions<WaitTx>;

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
    } as TransactionStreamConfig<string>
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
    } as TransactionStreamConfig<string>
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
    const filterCfg = { filters: [], start: new BlockNumber(0) } as TransactionStreamConfig<string>;
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