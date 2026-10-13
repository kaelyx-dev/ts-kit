// Public types for debounce.
// Every exported name must start with "Debounce".

/** Options for `debounce`. */
export interface DebounceOptions {
  /** Delay in milliseconds after the last call before `fn` runs. @default 0 */
  debounceMs?: number
}

/** The function that `debounce` returns, with methods to control it. */
export interface DebounceHandler<A extends unknown[]> {
  /** Schedules `fn` to run after the wait. Each call restarts the wait and replaces the earlier arguments. */
  (...args: A): void

  /** Clears a waiting call, so `fn` does not run. */
  cancel: () => void

  /** Runs a waiting call immediately with its latest arguments. Does nothing if no call is waiting. */
  flush: () => void
}
