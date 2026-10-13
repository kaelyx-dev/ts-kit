// Public types for clamp.
// Every exported name must start with "Clamp".

import type { ValueOf } from '../../types'

/**
 * Defines what `clamp` returns for an invalid value when `strict` is `true`. An invalid value is
 * an input of `NaN` or `undefined`, or a bound of `NaN`.
 */
export const ClampUndefinedBehaviour = {
  /** Return `undefined`. */
  RETURN_UNDEFINED: 'return-undefined',
  /** Return `min`. Returns `undefined` if `min` is `NaN`. */
  CLAMP_TO_LOWEST: 'clamp-to-lowest',
  /** Return `max`. Returns `undefined` if `max` is `NaN`. */
  CLAMP_TO_HIGHEST: 'clamp-to-highest',
} as const

/** Represents what `clamp` returns for an invalid value when `strict` is `true`. */
export type ClampUndefinedBehaviour = ValueOf<typeof ClampUndefinedBehaviour>

/** Represents the options for clamping a number within specified bounds. */
export interface ClampOptions {
  /** The minimum value allowed. Must not be greater than `max`. @default -Number.MAX_VALUE */
  min: number

  /** The maximum value allowed. Must not be less than `min`. @default Number.MAX_VALUE */
  max: number

  /**
   * Whether to use `strictBehaviour` for an invalid value. When `false`, an invalid value gives `NaN`.
   * @default false
   */
  strict?: boolean

  /**
   * What to return for an invalid value when `strict` is `true`. Has no effect when `strict` is `false`.
   * @default ClampUndefinedBehaviour.RETURN_UNDEFINED
   */
  strictBehaviour?: ClampUndefinedBehaviour
}
