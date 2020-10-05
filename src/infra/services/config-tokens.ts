import { InjectionToken } from "injection-js"
import { Milliseconds } from "shared/models";

/**
 * @description Token representing the poll interval of the etherscan transaction source service.
 */
export const PollInterval = new InjectionToken<Milliseconds>("PollInterval");