import Joi from "@hapi/joi";

import { ValueObject } from "shared/models/value-object";

/**
 * @description Represents an ethereum block number
 */
export class BlockNumber extends ValueObject<number> {
  protected static readonly validator = Joi.number().integer().positive().allow(0);

  protected validate(address: unknown): Joi.ValidationResult {
    return BlockNumber.validator.validate(address);
  }
}