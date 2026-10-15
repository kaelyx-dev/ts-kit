import type { Deferred } from './deferred.type'

/**
 * Create a promise that code outside the executor can resolve or reject.
 * The ES2022 lib has no `Promise.withResolvers`, so this does the same job.
 */
export function createDeferred<T>(): Deferred<T> {
  let resolve!: Deferred<T>['resolve']
  let reject!: Deferred<T>['reject']
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}
