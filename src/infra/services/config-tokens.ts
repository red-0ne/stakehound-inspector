import { InjectionToken } from "injection-js"
import { Milliseconds } from "shared/models";

export const PollInterval = new InjectionToken<Milliseconds>("PollInterval");