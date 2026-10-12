// Public standalone type Prettify.
// Every exported name must start with "Prettify".

/**
 * A utility type that makes an object type more readable by flattening its structure.
 * This is particularly useful for complex nested types where readability is important.
 * It essentially "flattens" the type, making it easier to read and work with in TypeScript.
 * @returns The prettified version of the input type.
 * @example
 * ```ts
 * type A = { id: number } & { name: string }
 * // hover shows: { id: number } & { name: string }
 * type B = Prettify<A>
 * // hover shows: { id: number; name: string }
 * ```
 *
 * @category types
 */
export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}
