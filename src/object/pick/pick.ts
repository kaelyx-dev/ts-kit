export * from './pick.types'

/**
 * Creates a new object by picking the specified keys from the source object.
 *
 * Behaves like destructuring: `pick(object, ['a', 'b'])` reads the same values as `const { a, b } = object`.
 * Own, inherited and non-enumerable properties are all picked, and getters are read so that their current value is copied.
 * Keys that are not present on the source object or its prototype chain are left out of the output.
 *
 * @param object - The source object. An empty object will result in an empty output.
 * @param keys - The keys to pick from the source object. An empty array will result in an empty output.
 * @returns A new object containing only the specified keys that are present on the input object.
 *
 * @example
 * ```ts
 * pick({ a: 1, b: 2 }, ['a']) // result: { a: 1 }
 * pick({ a: 1, b: 2, c: 3 }, ['a', 'c']) // result: { a: 1, c: 3 }
 * pick({ a: 1, b: undefined }, ['b']) // result: { b: undefined }
 * pick({ a: 1, b: 2 }, []) // result: {}
 * ```
 *
 * @category object
 */
export function pick<T extends object, K extends keyof T>(
  object: T,
  keys: readonly K[],
): Pick<T, K> {
  const result = {} as Pick<T, K>
  for (const key of keys) {
    if (key in object) {
      result[key] = object[key]
    }
  }
  return result
}
