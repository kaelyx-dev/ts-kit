// Public types for debounce-with-abort.
// Every exported name must start with "DebounceWithAbort".

/**
 * An async function that `debounceWithAbort` can cancel. It gets an `AbortSignal` as its first
 * argument, then the arguments that the caller passed.
 */
export type DebounceWithAbortAbortableFunction<A extends unknown[], R> = (
  signal: AbortSignal,
  ...args: A
) => Promise<R>

/** Options for `debounceWithAbort`. */
export interface DebounceWithAbortOptions<A extends unknown[], R> {
  /** Delay in milliseconds before a call runs. 0 or less runs each call immediately (abort-only behaviour). @default 0. */
  debounceMs?: number

  /** Return false to skip a call, for example below a minimum query length. A skipped call still cancels earlier calls. */
  shouldRun?: (...args: A) => boolean

  /** Called with the result of the latest call. Never called for a superseded or cancelled call. */
  onSuccess?: (result: R, ...args: A) => void

  /**
   * Called for a real (non-abort) error. When set, the returned promise resolves to `undefined`
   * instead of rejecting, so the handler is safe to use fire-and-forget as an event listener.
   */
  onError?: (error: unknown, ...args: A) => void

  /** Parent signal, for example tied to a component's lifetime. Aborting it cancels and disables the handler. */
  signal?: AbortSignal
}

/** The function that `debounceWithAbort` returns, with methods to control it. */
export interface DebounceWithAbortHandler<A extends unknown[], R> {
  /** Resolves with the result, or `undefined` if the call was skipped, superseded, cancelled or handled by `onError`. */
  (...args: A): Promise<R | undefined>

  /** Clears a waiting timer, aborts an in-flight call and resolves its promise to `undefined`. */
  cancel: () => void

  /** Runs a waiting call immediately, for example on blur or submit. Resolves to `undefined` if no call is waiting. */
  flush: () => Promise<R | undefined>

  /** True while a call waits on its timer or is in flight. */
  readonly pending: boolean
}
