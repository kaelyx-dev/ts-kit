export * from './ok.types'

import type { Result } from '../../types/result/result.types'

/**
 * Creates a successful `Result` that holds the given value.
 *
 * @param value - The value to hold. Falsy values such as `undefined`, `''` or `0` are kept as they are.
 * @returns A `Result` with `ok: true` and the value in the `value` property.
 *
 * @example
 * ```ts
 * ok(42) // { ok: true, value: 42 }
 * ok({ name: 'John' }) // { ok: true, value: { name: 'John' } }
 * ```
 *
 * @category result
 */
export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value }
}
