import type { WithDefaults } from '../..'

export type * from './with-defaults.types'

/**
 * Adds default values to an options object. If a key in `input` is `undefined`,
 * the result uses the default value for that key.
 *
 * @param input - The options object.
 * @param defaults - The default values.
 * @returns A new object. Each key from `defaults` is required in its type.
 *
 * @example
 * ```ts
 * const opts = withDefaults(options, { retries: 3 }); // opts.retries: number
 * ```
 *
 * @category object
 */
export function withDefaults<T extends object, D extends Partial<T>>(
  input: T | undefined,
  defaults: D,
): WithDefaults<T, D> {
  const definedInput = Object.fromEntries(
    Object.entries(input ?? {}).filter(([, value]) => value !== undefined),
  )
  return { ...defaults, ...definedInput } as WithDefaults<T, D>
}
