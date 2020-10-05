import { BigNumber, Transaction as EthTransaction } from "ethers";

export type Transaction = EthTransaction & { value: BigNumber, to: string, from: string };