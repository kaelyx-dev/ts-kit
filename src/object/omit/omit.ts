export * from './omit.types'

/**
 * Creates a new object by copying the source object without the specified keys.
 *
 * Behaves like a rest pattern: `omit(object, ['a'])` produces the same object as `rest` in `const { a, ...rest } = object`.
 * Only own enumerable properties (including symbol keys) are copied. Inherited properties (including class methods and getters)
 * and non-enumerable properties are not included, and getters are read so that their current value is copied.
 *
 * @param object - The source object. An empty object will result in an empty output.
 * @param keys - The keys to leave out. An empty array will result in a shallow copy of the source object.
 * @returns A new object containing every own enumerable property of the input object except the specified keys.
 *
 * @example
 * ```ts
 * omit({ a: 1, b: 2 }, ['a']) // result: { b: 2 }
 * omit({ a: 1, b: 2, c: 3 }, ['a', 'c']) // result: { b: 2 }
 * omit({ a: 1, b: undefined }, ['b']) // result: { a: 1 }
 * omit({ a: 1, b: 2 }, []) // result: { a: 1, b: 2 }
 * ```
 *
 * @category object
 */
export function omit<T extends object, K extends keyof T>(
  object: T,
  keys: readonly K[],
): Omit<T, K> {
  const result = { ...object } as Record<PropertyKey, unknown>
  for (const key of keys) {
    delete result[key]
  }
  return result as Omit<T, K>
}
