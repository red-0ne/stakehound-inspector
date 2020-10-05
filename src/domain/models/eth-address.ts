import { utils } from "ethers";
import Joi from "@hapi/joi";

import { ValueObject } from "shared/models/value-object";

/**
 * @description Represents an ethereum checksum address.
 */
export class EthAddress extends ValueObject<string> {
  protected static readonly validator = Joi.string().length(42).regex(/^0x[0-9A-F]{40}$/i);

  constructor(address: unknown) {
    super(address, utils.getAddress);
  }

  protected validate(address: unknown): Joi.ValidationResult {
    return EthAddress.validator.validate(address);
  }
}