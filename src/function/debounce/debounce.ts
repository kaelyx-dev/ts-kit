import { withDefaults } from '../../object/with-defaults/with-defaults'
import type { DebounceHandler, DebounceOptions } from './debounce.types'

export * from './debounce.types'

/**
 * Delays a function until `debounceMs` milliseconds have passed since the last call. Only the
 * latest call runs, with its arguments. Any return value from `fn` is ignored.
 *
 * If `fn` throws, the error comes from the timer callback, or from `flush` when you call it.
 * To get a result back from an async function, use `debounceWithAbort`.
 *
 * @param fn - The function to delay.
 * @param options - The delay. With no options, `fn` runs on the next timer tick after the last call.
 * @returns A handler with `cancel` and `flush`.
 *
 * @example
 * ```ts
 * const save = debounce((value: string) => localStorage.setItem('draft', value), {
 *   debounceMs: 300,
 * })
 *
 * save('a')
 * save('ab') // Only this call runs, 300ms after it was made
 * ```
 *
 * @playground
 * ```ts
 * const save = debounce((value: string) => console.log('saved', value), { debounceMs: 300 })
 * for (const value of ['a', 'ab', 'abc']) save(value) // Only the last call runs: saved abc
 * ```
 *
 * @category function
 */
export function debounce<A extends unknown[]>(
  fn: (...args: A) => unknown,
  options?: DebounceOptions,
): DebounceHandler<A> {
  const opts = withDefaults(options, { debounceMs: 0 })
  let timer: ReturnType<typeof setTimeout> | undefined
  let waitingArgs: A | undefined

  const cancel = (): void => {
    clearTimeout(timer)
    timer = undefined
    waitingArgs = undefined
  }

  const flush = (): void => {
    const args = waitingArgs
    cancel()
    if (args) fn(...args)
  }

  const handler = (...args: A): void => {
    clearTimeout(timer)
    waitingArgs = args
    timer = setTimeout(flush, opts.debounceMs)
  }

  return Object.assign(handler, { cancel, flush })
}
