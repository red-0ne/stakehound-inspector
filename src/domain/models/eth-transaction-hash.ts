import Joi from "@hapi/joi";

import { ValueObject } from "shared/models/value-object";

/**
 * Represents an ethereum transaction hash.
 */
export class EthTransactionHash extends ValueObject<string> {
  protected static readonly validator = Joi.string().length(66).regex(/^0x[0-9A-F]{40}$/i);

  constructor(address: unknown) {
    super(address, (v: string) => v.toLowerCase());
  }

  protected validate(address: unknown): Joi.ValidationResult {
    return EthTransactionHash.validator.validate(address);
  }
}