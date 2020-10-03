/**
 * @template T transaction to be filtered by the function
 * @template CTX context used by the function to perform the filtering
 */
export type Filter<T, CTX> = (item: T, context: CTX) => boolean;