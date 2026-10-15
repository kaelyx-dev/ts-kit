import { withDefaults } from '../../object'
import {
  type SumNumberOptions,
  type SumObjectOptions,
  SumOptionsMissingBehaviour,
} from './sum.types'

export * from './sum.types'

/**
 * Adds all the numbers in an array.
 *
 * @param array - The numbers to add. An empty array gives `initialValue`.
 * @param options - Optional. See {@link SumNumberOptions}.
 * @returns `initialValue` plus the total of the numbers.
 *
 * @example
 * ```ts
 * sum([1, 2, 3])                      // 6
 * sum([])                             // 0
 * sum([1, 2, 3], { initialValue: 10 }) // 16
 * ```
 *
 * @category array
 */
export function sum(array: readonly number[], options?: SumNumberOptions): number
/**
 * Adds one number value from each object in an array.
 *
 * @param array - The objects. An empty array gives `initialValue`.
 * @param options - See {@link SumObjectOptions}. `key` must be a key whose value is a `number`.
 * @returns `initialValue` plus the total of the values at `key`.
 * @throws {TypeError} If `missingBehaviour` is `'THROW'` and an object has no value at `key`.
 *
 * @example
 * ```ts
 * sum([{ price: 2 }, { price: 3 }], { key: 'price' }) // 5
 * sum([{ price: 2 }, {}], { key: 'price', missingBehaviour: 'ZERO' }) // 2
 * ```
 *
 * @category array
 */
export function sum<T extends object>(array: readonly T[], options: SumObjectOptions<T>): number
export function sum(
  array: readonly (object | number)[],
  options?: {
    readonly key?: PropertyKey
    readonly initialValue?: number
    readonly missingBehaviour?: SumOptionsMissingBehaviour
  },
): number {
  const opts = withDefaults(options, {
    key: undefined,
    initialValue: 0,
    missingBehaviour: SumOptionsMissingBehaviour.zero,
  })

  if (opts.key === undefined) {
    return (array as readonly number[]).reduce((total, value) => total + value, opts.initialValue)
  }
  const missingBehaviour = opts.missingBehaviour
  return array.reduce<number>((total, item, index) => {
    const value = (item as Record<PropertyKey, number | undefined>)[opts.key]
    if (value !== undefined) return total + value
    if (missingBehaviour === SumOptionsMissingBehaviour.throw) {
      throw new TypeError(
        `sum: the item at index ${index} has no value at key "${String(opts.key)}"`,
      )
    }
    return total
  }, opts.initialValue)
}
