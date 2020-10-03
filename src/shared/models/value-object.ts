export const enum ERROR {
  INVALID_VALUE = "INVALID_VALUE",
}

/**
 * Offers a way to define domain values replacing the too generic types like number, string...
 * They are generally created from unsafe seed values that get validated and normalized
 * to the correct representation.
 *
 * @template T is the valid serializable representation of the ValueObject
 */
export abstract class ValueObject<T> {
  public readonly value: T;

  /**
   * @param value Is the outer unsafe value that will be validated and normalized.
   * @param transform Optional transformation function that handles a validated value
   *
   * @returns A valid ValueObject or throws a `ERROR.INVALID_VALUE` error;
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(value: unknown, transform?: (value: any) => T) {
    const validationResult = this.validate(value);

    if (validationResult.error) {
      throw new Error(ERROR.INVALID_VALUE);
    } else {
      this.value = transform ? transform(validationResult.value) : validationResult.value;
    }
  }

  /**
   * Validates a potentially unsafe input value
   *
   * @param value Is the outer unsafe value that will be validated and normalized.
   *
   * @returns A validation result with errors or normalized value
   */
  protected abstract validate(value: unknown): { value: T, error?: unknown };
}