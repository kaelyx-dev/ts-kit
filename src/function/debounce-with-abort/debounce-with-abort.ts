import { withDefaults } from '../../object/with-defaults/with-defaults'
import type {
  DebounceWithAbortAbortableFunction,
  DebounceWithAbortHandler,
  DebounceWithAbortOptions,
} from './debounce-with-abort.types'

export type * from './debounce-with-abort.types'

/** The state of one call. Each call keeps its own record, so a stale call cannot change a newer one. */
interface Call<R> {
  timer?: ReturnType<typeof setTimeout>
  controller?: AbortController
  promise: Promise<R | undefined>
  run: () => void
  settle: () => void
}

const isAbortError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'name' in error &&
  (error as { name: unknown }).name === 'AbortError'

/**
 * Wraps an async function so that only the latest call matters. Each new call cancels the
 * previous one: it clears a waiting timer, aborts an in-flight call through its `AbortSignal`,
 * and resolves the superseded promise to `undefined`.
 *
 * @param fn - The async function. It gets an `AbortSignal` first, then the call's arguments.
 * @param options - The debounce delay, callbacks and an optional parent signal. With no options,
 *   each call runs immediately and only aborts the previous call.
 * @returns A handler with `cancel`, `flush` and `pending`. Each call resolves with the result, or
 *   `undefined` if the call was skipped, superseded, cancelled or handled by `onError`. It rejects
 *   with a real error from `fn` when `onError` is not set.
 *
 * @example
 * ```ts
 * const search = debounceWithAbort(
 *   (signal, query: string) => fetch(`/search?q=${query}`, { signal }).then((r) => r.json()),
 *   { debounceMs: 300, shouldRun: (query) => query.length > 2 },
 * )
 * input.addEventListener('input', () => search(input.value))
 * ```
 *
 * @category function
 */
export function debounceWithAbort<A extends unknown[], R>(
  fn: DebounceWithAbortAbortableFunction<A, R>,
  options?: DebounceWithAbortOptions<A, R>,
): DebounceWithAbortHandler<A, R> {
  const { debounceMs, shouldRun, onSuccess, onError, signal } = withDefaults(options, {
    debounceMs: 0,
  })
  let current: Call<R> | undefined

  const cancel = (): void => {
    if (!current) return
    clearTimeout(current.timer)
    current.controller?.abort()
    current.settle()
    current = undefined
  }

  signal?.addEventListener('abort', cancel, { once: true })

  const handler = (...args: A): Promise<R | undefined> => {
    cancel()
    if (signal?.aborted || (shouldRun && !shouldRun(...args))) return Promise.resolve(undefined)

    let resolve!: (value: R | undefined) => void
    let reject!: (reason: unknown) => void
    const promise = new Promise<R | undefined>((res, rej) => {
      resolve = res
      reject = rej
    })

    const fail = (controller: AbortController, error: unknown): void => {
      if (controller.signal.aborted || isAbortError(error)) {
        resolve(undefined)
      } else if (!onError) {
        reject(error)
      } else {
        try {
          onError(error, ...args)
          resolve(undefined)
        } catch (handlerError) {
          reject(handlerError)
        }
      }
    }

    const succeed = (controller: AbortController, value: R): void => {
      // Discard a stale result, even if fn ignored the signal.
      if (controller.signal.aborted) {
        resolve(undefined)
        return
      }
      try {
        onSuccess?.(value, ...args)
        resolve(value)
      } catch (error) {
        fail(controller, error)
      }
    }

    const run = (): void => {
      clearTimeout(call.timer)
      call.timer = undefined
      const controller = new AbortController()
      call.controller = controller

      // Clear the state before the result is passed on, so `pending` is false for an awaiting caller.
      const finish = (): void => {
        if (current === call) current = undefined
      }

      // The executor turns a synchronous throw from fn into a rejection.
      new Promise<R>((res) => res(fn(controller.signal, ...args))).then(
        (value) => {
          finish()
          succeed(controller, value)
        },
        (error) => {
          finish()
          fail(controller, error)
        },
      )
    }

    const call: Call<R> = { promise, run, settle: () => resolve(undefined) }
    current = call
    if (debounceMs > 0) call.timer = setTimeout(run, debounceMs)
    else run()
    return promise
  }

  const flush = (): Promise<R | undefined> => {
    const call = current
    if (call?.timer === undefined) return Promise.resolve(undefined)
    call.run()
    return call.promise
  }

  return Object.defineProperties(handler, {
    cancel: { value: cancel },
    flush: { value: flush },
    pending: { get: () => current !== undefined },
  }) as DebounceWithAbortHandler<A, R>
}
