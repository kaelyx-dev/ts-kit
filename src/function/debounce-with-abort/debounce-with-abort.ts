import { createDeferred } from '../../_internal/promise/deferred/deferred'
import type { Deferred } from '../../_internal/promise/deferred/deferred.type'
import { withDefaults } from '../../object/with-defaults/with-defaults'
import type {
  DebounceWithAbortAbortableFunction,
  DebounceWithAbortHandler,
  DebounceWithAbortOptions,
} from './debounce-with-abort.types'

export * from './debounce-with-abort.types'

/** The state of one call. Each call keeps its own record, so a stale call cannot change a newer one. */
interface Call<A extends unknown[], R> {
  args: A
  deferred: Deferred<R | undefined>
  timer?: ReturnType<typeof setTimeout>
  controller?: AbortController
}

const isAbortError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'name' in error &&
  (error as { name: unknown }).name === 'AbortError'

function settleError<A extends unknown[], R>(
  deferred: Deferred<R | undefined>,
  signal: AbortSignal,
  error: unknown,
  args: A,
  onError: DebounceWithAbortOptions<A, R>['onError'],
): void {
  if (signal.aborted || isAbortError(error)) {
    deferred.resolve(undefined)
  } else if (!onError) {
    deferred.reject(error)
  } else {
    try {
      onError(error, ...args)
      deferred.resolve(undefined)
    } catch (handlerError) {
      deferred.reject(handlerError)
    }
  }
}

function settleValue<A extends unknown[], R>(
  deferred: Deferred<R | undefined>,
  signal: AbortSignal,
  value: R,
  args: A,
  { onSuccess, onError }: Pick<DebounceWithAbortOptions<A, R>, 'onSuccess' | 'onError'>,
): void {
  // Discard a stale result, even if fn ignored the signal.
  if (signal.aborted) {
    deferred.resolve(undefined)
    return
  }
  try {
    onSuccess?.(value, ...args)
    deferred.resolve(value)
  } catch (error) {
    settleError(deferred, signal, error, args, onError)
  }
}

function invoke<A extends unknown[], R>(
  fn: DebounceWithAbortAbortableFunction<A, R>,
  call: Call<A, R>,
  signal: AbortSignal,
  callbacks: Pick<DebounceWithAbortOptions<A, R>, 'onSuccess' | 'onError'>,
  finish: () => void,
): void {
  // The executor turns a synchronous throw from fn into a rejection.
  new Promise<R>((res) => res(fn(signal, ...call.args))).then(
    (value) => {
      finish()
      settleValue(call.deferred, signal, value, call.args, callbacks)
    },
    (error) => {
      finish()
      settleError(call.deferred, signal, error, call.args, callbacks.onError)
    },
  )
}

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
 * @playground
 * ```ts
 * const search = debounceWithAbort(
 *   (signal, query: string) =>
 *     new Promise<string>((resolve) => {
 *       const timer = setTimeout(() => resolve(`results for "${query}"`), 200)
 *       signal.addEventListener('abort', () => clearTimeout(timer))
 *     }),
 *   { debounceMs: 100, shouldRun: (query) => query.length > 2 },
 * )
 *
 * Promise.all([search('ty'), search('typ'), search('type')]).then((results) => {
 *   console.log(results) // [undefined, undefined, 'results for "type"']
 * })
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
  const callbacks = { onSuccess, onError }
  let current: Call<A, R> | undefined

  const cancel = (): void => {
    if (!current) return
    clearTimeout(current.timer)
    current.controller?.abort()
    current.deferred.resolve(undefined)
    current = undefined
  }

  signal?.addEventListener('abort', cancel, { once: true })

  const run = (call: Call<A, R>): void => {
    clearTimeout(call.timer)
    call.timer = undefined
    const controller = new AbortController()
    call.controller = controller

    // Clear the state before the result is passed on, so `pending` is false for an awaiting caller.
    const finish = (): void => {
      if (current === call) current = undefined
    }

    invoke(fn, call, controller.signal, callbacks, finish)
  }

  const handler = (...args: A): Promise<R | undefined> => {
    cancel()
    if (signal?.aborted || (shouldRun && !shouldRun(...args))) return Promise.resolve(undefined)

    const call: Call<A, R> = { args, deferred: createDeferred<R | undefined>() }
    current = call
    if (debounceMs > 0) call.timer = setTimeout(() => run(call), debounceMs)
    else run(call)
    return call.deferred.promise
  }

  const flush = (): Promise<R | undefined> => {
    const call = current
    if (call?.timer === undefined) return Promise.resolve(undefined)
    run(call)
    return call.deferred.promise
  }

  return Object.defineProperties(handler, {
    cancel: { value: cancel },
    flush: { value: flush },
    pending: { get: () => current !== undefined },
  }) as DebounceWithAbortHandler<A, R>
}
