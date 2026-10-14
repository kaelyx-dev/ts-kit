// Public types for sum.
// Every exported name must start with "Sum".

import type { ValueOf } from '../../types'

/**
 * The keys of `T` that have a value of type `number`.
 * An optional key is included. See `missingBehaviour` in {@link SumObjectOptions} for what happens when its value is missing.
 */
export type SumKey<T> = {
  [K in keyof T]-?: [T[K]] extends [number | undefined]
    ? [T[K]] extends [undefined]
      ? never
      : K
    : never
}[keyof T]

/** The values for `missingBehaviour` in {@link SumObjectOptions}. */
export const SumOptionsMissingBehaviour = {
  /** Throw an error. */
  throw: 'THROW',
  /** Add 0 for the object. */
  zero: 'ZERO',
} as const

/** What {@link sum} does when an object has no value at `key`. */
export type SumOptionsMissingBehaviour = ValueOf<typeof SumOptionsMissingBehaviour>

/** Options for {@link sum} when the array holds numbers. */
export interface SumNumberOptions {
  /** The value to start the total from. @default 0 */
  readonly initialValue?: number
  /** Not used for an array of numbers. */
  readonly key?: never
  /** Not used for an array of numbers. */
  readonly missingBehaviour?: never
}

/** Options for {@link sum} when the array holds objects. */
export interface SumObjectOptions<T> {
  /** The value to start the total from. @default 0 */
  readonly initialValue?: number
  /** The key of the number to add from each object. See {@link SumKey}. */
  readonly key: SumKey<T>
  /** What the function does when the value at `key` is missing or `undefined`. @default SumOptionsMissingBehaviour.zero */
  readonly missingBehaviour?: SumOptionsMissingBehaviour
}
