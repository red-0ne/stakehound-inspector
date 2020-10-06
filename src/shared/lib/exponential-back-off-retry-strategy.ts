import { Observable, throwError, TimeoutError, timer } from "rxjs";
import { delayWhen } from "rxjs/operators";
import { Milliseconds } from "shared/models";

export function exponentialBackOffRetryStrategy(maxAttempts: number, minWait: Milliseconds) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (errors: Observable<any>): Observable<any> => errors.pipe(
    // Wait longer exponentially each time there is an error with a maximum of 5 retries
    // and a starting from 3 seconds.
    delayWhen((error, attempt) => {
      // This should be on an injectable configuration token
      console.log("### Error", error);

      // If it is a timeout error, no need to wait more, we retry right now or throw if we
      // did too much retries
      if (error instanceof TimeoutError) {
        return attempt < maxAttempts ? timer((0)) : throwError(error);
      }

      return attempt < maxAttempts
        ? timer((Math.pow(2, attempt) * 1000) - 1000 + minWait.value)
        : throwError(error);
    }),
  );
}