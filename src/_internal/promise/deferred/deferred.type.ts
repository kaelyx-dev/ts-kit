/** A promise with its `resolve` and `reject` functions, so code outside the executor can settle it. */
export interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason: unknown) => void
}
