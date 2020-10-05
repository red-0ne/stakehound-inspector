import Joi from "@hapi/joi";
import { ValueObject } from "shared/models/value-object";

/**
 * @description Represents a duration in milliseconds
 */
export class Milliseconds extends ValueObject<number> {
  protected static readonly validator = Joi.number().integer().positive().allow(0);

  protected validate(address: unknown): Joi.ValidationResult {
    return Milliseconds.validator.validate(address);
  }
}