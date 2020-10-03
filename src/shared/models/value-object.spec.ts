import "mocha";

import Joi from "@hapi/joi";
import { expect } from "chai";

import { ValueObject } from "./value-object";

class YesNoValueObject extends ValueObject<"yes"|"no"> {
  public static readonly schema = Joi.valid("yes", "no", true, false);

  protected validate(value: unknown): Joi.ValidationResult {
    return YesNoValueObject.schema.validate(value);
  }
}

class ChoiceValueObject extends ValueObject<boolean> {
  public static readonly schema = Joi.string().valid("yes", "no");

  constructor(value: unknown) {
    super(value, (v) => v !== "no");
  }

  protected validate(value: unknown): Joi.ValidationResult {
    return YesNoValueObject.schema.validate(value);
  }
}

describe("ValueObject", () => {
  it("should create an instance when provided a valid input value", () => {
    expect(new YesNoValueObject("yes")).instanceOf(YesNoValueObject);
  });

  it("should be initialized with a valid input value", () => {
    const choice = new YesNoValueObject("yes");

    expect(choice.value).to.equal("yes");
  });

  it("should throw an exception when initialized with an invalid input value", () => {
    expect(() => new YesNoValueObject("y")).to.throw("INVALID_VALUE");
  });

  it("should transform the valid value when provided a transformation function", () => {
    const choice = new ChoiceValueObject("yes");

    expect(choice.value).to.equal(true);
  });

  it("should be able to be created from the value of another ValueObject of the same class" +
    " and have the same value", () => {
    const first = new ChoiceValueObject("yes");
    const second = new ChoiceValueObject(first.value);

    expect(first.value).to.equal(second.value);
  })
});