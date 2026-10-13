// Public standalone type ValueOf.
// Every exported name must start with "ValueOf".

/**
 * Gets the type of the values of an object or array.
 *
 * @example
 * ```ts
 * const obj = { a: 1, b: 2 } as const
 * const value: ValueOf<typeof obj> = 1 // or 2
 * ```
 *
 * @category types
 */
export type ValueOf<T> = T extends readonly unknown[] ? T[number] : T[keyof T]
